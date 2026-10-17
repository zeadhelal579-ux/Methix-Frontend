// ============================================================
// File: src/mocks/demoAdapter.ts
// Purpose: A complete in-browser replacement for the METHIX REST API,
//          plugged into axios as a custom adapter (see axiosClient.ts)
// Logic:
//   - Every request the app makes through axiosClient lands in
//     handleDemoRequest(), which matches METHOD + path against the
//     route table below and runs the handler against the demo
//     database (demoDb.ts) instead of touching the network
//   - Routes, payloads and response shapes mirror the real controllers
//     one-to-one (same paths, same DTO field names, same paging
//     envelope, same status codes: 401/403/404/409), so the frontend
//     code, hooks and pages need no demo-specific branches at all
//   - Failures are thrown as real AxiosError objects, so the existing
//     interceptors and getFriendlyErrorMessage() behave exactly as
//     they do against the real server
//   - The session token is "demo-token-<userId>". It is NOT secure and
//     exists only to emulate login; the real backend issues JWTs
//   - Responses are deep-copied, like data that crossed a real network
//   - A short artificial delay makes loading states visible
//   - This file is only fetched in demo mode (dynamic import)
// ============================================================
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { CattleDetail, CattleListItem, FeedRecord } from "@/types/cattle";
import type { Farm, Personnel } from "@/types/farm";
import type { PagedResult } from "@/types/pagination";
import type { PredictionHistoryItem, PredictionResult } from "@/types/prediction";
import type { AuthResponse, Role, User } from "@/types/user";
import { getDb, saveDb } from "./demoDb";
import { nextId } from "./demoIds";
import { classifyAmount, DEMO_MODEL_VERSION, DEMO_THRESHOLDS, runDemoModel } from "./demoPrediction";
import { createFarmWithSampleData } from "./demoSeed";
import type { DemoDb, DemoFarm, DemoFeedRecord, DemoPrediction, DemoUser } from "./demoTypes";

const TOKEN_PREFIX = "demo-token-";
const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

// ------------------------------------------------------------
// Error and request plumbing
// ------------------------------------------------------------

// Thrown by handlers to produce an HTTP error response
class DemoHttpError extends Error {
    status: number;
    payload: { error: string; message: string };

    constructor(status: number, error: string, message: string) {
        super(message);
        this.status = status;
        this.payload = { error, message };
    }
}

// Everything a route handler needs to know about one request
interface RequestContext {
    db: DemoDb;
    user: DemoUser | null;
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: Record<string, unknown>;
}

interface Route {
    method: string;
    pattern: RegExp;
    paramNames: string[];
    isPublic: boolean;
    delayMs?: number;
    isMutation: boolean;
    handler: (ctx: RequestContext) => unknown;
}

const routes: Route[] = [];

// Registers a route; ":name" segments become named path parameters
function addRoute(
    method: string,
    path: string,
    handler: (ctx: RequestContext) => unknown,
    options: { isPublic?: boolean; delayMs?: number } = {}
): void {
    const paramNames: string[] = [];
    const source = path.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
        paramNames.push(name);
        return "([^/]+)";
    });
    routes.push({
        method,
        pattern: new RegExp(`^${source}$`),
        paramNames,
        isPublic: options.isPublic ?? false,
        delayMs: options.delayMs,
        isMutation: method !== "GET",
        handler,
    });
}

// Promise-based sleep used to simulate network latency
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Normalizes a request url: drops the query string and trailing slash
function normalizePath(url: string): string {
    const withoutQuery = url.split("?")[0];
    const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// axios serializes JSON bodies to strings before they reach the adapter
function parseBody(data: unknown): Record<string, unknown> {
    if (typeof data === "string" && data.length > 0) {
        try {
            const parsed: unknown = JSON.parse(data);
            if (typeof parsed === "object" && parsed !== null) {
                return parsed as Record<string, unknown>;
            }
        } catch {
            throw new DemoHttpError(400, "invalid_json", "The request body is not valid JSON.");
        }
    }
    if (typeof data === "object" && data !== null) return data as Record<string, unknown>;
    return {};
}

// Reads the Authorization header regardless of how axios stores it
function readAuthHeader(config: InternalAxiosRequestConfig): string {
    const headers = config.headers as unknown as {
        get?: (name: string) => unknown;
        Authorization?: unknown;
    };
    const value = typeof headers.get === "function" ? headers.get("Authorization") : headers.Authorization;
    return typeof value === "string" ? value : "";
}

// Resolves the logged-in user from the bearer token, or null
function resolveUser(db: DemoDb, config: InternalAxiosRequestConfig): DemoUser | null {
    const header = readAuthHeader(config);
    if (!header.startsWith(`Bearer ${TOKEN_PREFIX}`)) return null;
    const userId = Number(header.slice(`Bearer ${TOKEN_PREFIX}`.length));
    return db.users.find((candidate) => candidate.userId === userId) ?? null;
}

// ------------------------------------------------------------
// Small validation / lookup helpers
// ------------------------------------------------------------

// Reads a required, trimmed, non-empty string field
function requireString(body: Record<string, unknown>, key: string, maxLength = 200): string {
    const value = body[key];
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new DemoHttpError(400, "validation_error", `${key} is required.`);
    }
    if (value.trim().length > maxLength) {
        throw new DemoHttpError(400, "validation_error", `${key} is too long.`);
    }
    return value.trim();
}

// Reads a required finite number within [min, max]
function requireNumber(body: Record<string, unknown>, key: string, min: number, max: number): number {
    const value = Number(body[key]);
    if (body[key] === null || body[key] === undefined || body[key] === "" || !Number.isFinite(value)) {
        throw new DemoHttpError(400, "validation_error", `${key} must be a number.`);
    }
    if (value < min || value > max) {
        throw new DemoHttpError(400, "validation_error", `${key} must be between ${min} and ${max}.`);
    }
    return value;
}

// Throws 403 unless the user belongs to the given farm (the real
// backend's FarmAccessGuard equivalent)
function assertFarmAccess(user: DemoUser, farmId: number): void {
    if (user.farmId === null || user.farmId !== farmId) {
        throw new DemoHttpError(403, "forbidden", "You don't have access to this farm.");
    }
}

// Finds a farm by id or throws 404
function findFarm(db: DemoDb, farmId: number): DemoFarm {
    const farm = db.farms.find((candidate) => candidate.farmId === farmId);
    if (!farm) throw new DemoHttpError(404, "not_found", "Farm not found.");
    return farm;
}

// Finds an animal and verifies the user may access it (404, then 403)
function findAccessibleCattle(ctx: RequestContext): CattleDetail {
    const cattleId = Number(ctx.params.cattleId);
    const cattle = ctx.db.cattle.find((candidate) => candidate.cattleId === cattleId);
    if (!cattle) throw new DemoHttpError(404, "not_found", "Animal not found.");
    assertFarmAccess(ctx.user as DemoUser, cattle.farmId);
    return cattle;
}

// Reads the mandatory farmId query parameter and checks access to it
function requireFarmIdQuery(ctx: RequestContext): number {
    const farmId = Number(ctx.query.farmId);
    if (!Number.isFinite(farmId) || farmId <= 0) {
        throw new DemoHttpError(400, "validation_error", "farmId is required.");
    }
    assertFarmAccess(ctx.user as DemoUser, farmId);
    return farmId;
}

// Public shape of a farm (drops server-only fields)
function toFarm(farm: DemoFarm): Farm {
    return { farmId: farm.farmId, name: farm.name, operationalStatus: farm.operationalStatus };
}

// Public shape of a user inside AuthResponse
function toUser(user: DemoUser): User {
    return {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.picture ? { picture: user.picture } : {}),
    };
}

// Builds the { token, user } payload returned by every auth endpoint
function toAuthResponse(user: DemoUser): AuthResponse {
    return { token: `${TOKEN_PREFIX}${user.userId}`, user: toUser(user) };
}

// Public shape of a feed record (drops the owning cattleId)
function toFeedRecord(record: DemoFeedRecord): FeedRecord {
    return {
        feedId: record.feedId,
        date: record.date,
        foragePctDM: record.foragePctDM,
        ndfPctDM: record.ndfPctDM,
        adfPctDM: record.adfPctDM,
        starchPctDM: record.starchPctDM,
        fatPercentage: record.fatPercentage,
        proteinPercentage: record.proteinPercentage,
        temperature: record.temperature,
        dmi: record.dmi,
    };
}

// Latest feed record of an animal: newest date, ties broken by highest id
function latestFeedRecord(db: DemoDb, cattleId: number): DemoFeedRecord | undefined {
    return db.feedRecords
        .filter((record) => record.cattleId === cattleId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.feedId - a.feedId)[0];
}

// Most recent prediction of an animal, if any
function latestPrediction(db: DemoDb, cattleId: number): DemoPrediction | undefined {
    return db.predictions
        .filter((prediction) => prediction.cattleId === cattleId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.predictionId - a.predictionId)[0];
}

// Slices a list into the paging envelope the real API returns
function paginate<T>(items: T[], pageValue: unknown): PagedResult<T> {
    const requested = Number(pageValue);
    const page = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
    const start = (page - 1) * PAGE_SIZE;
    return { items: items.slice(start, start + PAGE_SIZE), totalCount: items.length, page, pageSize: PAGE_SIZE };
}

// Rounds to one decimal place
function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

// Decodes the payload of a Google ID token (demo only, no signature check)
function decodeGoogleCredential(credential: string): { name: string; email: string; picture?: string } {
    try {
        const part = credential.split(".")[1] ?? "";
        const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
            name?: string;
            email?: string;
            picture?: string;
        };
        if (!payload.email) throw new Error("missing email");
        return { name: payload.name || payload.email, email: payload.email, picture: payload.picture };
    } catch {
        throw new DemoHttpError(401, "invalid_google_token", "The Google credential could not be verified.");
    }
}

// ------------------------------------------------------------
// Auth routes
// ------------------------------------------------------------

// POST /auth/login: checks email + password and returns a session
addRoute(
    "POST",
    "/auth/login",
    ({ db, body }) => {
        const email = requireString(body, "email").toLowerCase();
        const password = typeof body.password === "string" ? body.password : "";
        const user = db.users.find((candidate) => candidate.email.toLowerCase() === email);
        if (!user || user.password === null || user.password !== password) {
            throw new DemoHttpError(401, "invalid_credentials", "Invalid email or password.");
        }
        return toAuthResponse(user);
    },
    { isPublic: true }
);

// POST /auth/register: creates a new Farmer account with no farm yet
addRoute(
    "POST",
    "/auth/register",
    ({ db, body }) => {
        const name = requireString(body, "name", 100);
        const email = requireString(body, "email").toLowerCase();
        const password = typeof body.password === "string" ? body.password : "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new DemoHttpError(400, "validation_error", "email is not valid.");
        }
        if (password.length < 8) {
            throw new DemoHttpError(400, "validation_error", "password must be at least 8 characters.");
        }
        if (db.users.some((candidate) => candidate.email.toLowerCase() === email)) {
            throw new DemoHttpError(409, "email_taken", "This email is already registered.");
        }
        const user: DemoUser = {
            userId: nextId(db, "user"),
            name,
            email,
            password,
            role: "Farmer",
            farmId: null,
        };
        db.users.push(user);
        return toAuthResponse(user);
    },
    { isPublic: true }
);

// POST /auth/google: signs in (or signs up) with a Google ID token
addRoute(
    "POST",
    "/auth/google",
    ({ db, body }) => {
        const profile = decodeGoogleCredential(requireString(body, "credential", 4000));
        const email = profile.email.toLowerCase();
        let user = db.users.find((candidate) => candidate.email.toLowerCase() === email);
        if (!user) {
            user = {
                userId: nextId(db, "user"),
                name: profile.name,
                email,
                password: null,
                role: "Farmer",
                farmId: null,
                picture: profile.picture,
            };
            db.users.push(user);
        } else if (profile.picture) {
            user.picture = profile.picture;
        }
        return toAuthResponse(user);
    },
    { isPublic: true }
);

// ------------------------------------------------------------
// Farm routes
// ------------------------------------------------------------

// GET /farms/me: the farm the current user belongs to, or 404 "no_farm"
addRoute("GET", "/farms/me", ({ db, user }) => {
    const farm = db.farms.find((candidate) => candidate.farmId === (user as DemoUser).farmId);
    if (!farm) throw new DemoHttpError(404, "no_farm", "You do not belong to a farm yet.");
    return toFarm(farm);
});

// POST /farms: creates the user's first farm, promotes them to Admin and
// returns a fresh token (mirrors the real backend's role refresh)
addRoute("POST", "/farms", ({ db, user, body }) => {
    const current = user as DemoUser;
    const name = requireString(body, "name", 100);
    if (current.farmId !== null) {
        throw new DemoHttpError(409, "already_has_farm", "You already belong to a farm.");
    }
    const farm = createFarmWithSampleData(db, current, name);
    return { ...toFarm(farm), token: `${TOKEN_PREFIX}${current.userId}` };
});

// GET /farms/:farmId: farm details
addRoute("GET", "/farms/:farmId", ({ db, user, params }) => {
    const farmId = Number(params.farmId);
    assertFarmAccess(user as DemoUser, farmId);
    return toFarm(findFarm(db, farmId));
});

// PUT /farms/:farmId: renames the farm
addRoute("PUT", "/farms/:farmId", ({ db, user, params, body }) => {
    const farmId = Number(params.farmId);
    assertFarmAccess(user as DemoUser, farmId);
    const farm = findFarm(db, farmId);
    farm.name = requireString(body, "name", 100);
    return toFarm(farm);
});

// PUT /farms/:farmId/status: archives or reactivates the farm
addRoute("PUT", "/farms/:farmId/status", ({ db, user, params, body }) => {
    const farmId = Number(params.farmId);
    assertFarmAccess(user as DemoUser, farmId);
    const farm = findFarm(db, farmId);
    farm.operationalStatus = requireString(body, "operationalStatus", 60);
    return toFarm(farm);
});

// GET /farms/:farmId/personnel: team members of the farm
addRoute("GET", "/farms/:farmId/personnel", ({ db, user, params }): Personnel[] => {
    const farmId = Number(params.farmId);
    assertFarmAccess(user as DemoUser, farmId);
    return db.users
        .filter((member) => member.farmId === farmId)
        .map((member) => ({
            userId: member.userId,
            name: member.name,
            email: member.email,
            role: member.role,
        }));
});

// POST /farms/:farmId/personnel: adds a team member (Admin only)
addRoute("POST", "/farms/:farmId/personnel", ({ db, user, params, body }): Personnel => {
    const current = user as DemoUser;
    const farmId = Number(params.farmId);
    assertFarmAccess(current, farmId);
    if (current.role !== "Admin") {
        throw new DemoHttpError(403, "forbidden", "Only an Admin can add team members.");
    }
    const name = requireString(body, "name", 100);
    const email = requireString(body, "email").toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "Admin" ? "Admin" : body.role === "Farmer" ? "Farmer" : null;
    if (role === null) {
        throw new DemoHttpError(400, "validation_error", "role must be Farmer or Admin.");
    }
    if (password.length < 8) {
        throw new DemoHttpError(400, "validation_error", "password must be at least 8 characters.");
    }
    if (db.users.some((candidate) => candidate.email.toLowerCase() === email)) {
        throw new DemoHttpError(409, "email_taken", "This email is already registered.");
    }
    const member: DemoUser = {
        userId: nextId(db, "user"),
        name,
        email,
        password,
        role: role as Role,
        farmId,
    };
    db.users.push(member);
    return { userId: member.userId, name: member.name, email: member.email, role: member.role };
});

// ------------------------------------------------------------
// Cattle and feed record routes
// ------------------------------------------------------------

// Validates the animal fields shared by create and update
function readCattleFields(body: Record<string, unknown>): Omit<CattleDetail, "cattleId" | "farmId"> {
    const status = body.metabolicStatus;
    if (status !== "Lactating" && status !== "Growing" && status !== "Dry") {
        throw new DemoHttpError(400, "validation_error", "metabolicStatus is not valid.");
    }
    const sex = Number(body.sex);
    if (sex !== 1 && sex !== 2) {
        throw new DemoHttpError(400, "validation_error", "sex must be 1 (Male) or 2 (Female).");
    }
    return {
        breed: requireString(body, "breed", 80),
        age: requireNumber(body, "age", 0, 400),
        weight: requireNumber(body, "weight", 1, 1500),
        sex,
        dim: requireNumber(body, "dim", 0, 800),
        milkKgDay: requireNumber(body, "milkKgDay", 0, 100),
        milkFatPct: requireNumber(body, "milkFatPct", 0, 15),
        milkLactosePct: requireNumber(body, "milkLactosePct", 0, 15),
        metabolicStatus: status,
    };
}

// GET /cattle: searchable, filterable, paged herd list
addRoute("GET", "/cattle", (ctx): PagedResult<CattleListItem> => {
    const farmId = requireFarmIdQuery(ctx);
    const search = typeof ctx.query.search === "string" ? ctx.query.search.trim().toLowerCase() : "";
    const level = typeof ctx.query.level === "string" ? ctx.query.level : "";

    const items = ctx.db.cattle
        .filter((animal) => animal.farmId === farmId)
        .map((animal): CattleListItem => ({
            cattleId: animal.cattleId,
            breed: animal.breed,
            age: animal.age,
            weight: animal.weight,
            sex: animal.sex,
            metabolicStatus: animal.metabolicStatus,
            latestEmissionLevel: latestPrediction(ctx.db, animal.cattleId)?.emissionLevel ?? null,
        }))
        .filter((animal) => {
            const matchesSearch =
                search === "" ||
                animal.breed.toLowerCase().includes(search) ||
                String(animal.cattleId) === search.replace("#", "");
            const matchesLevel = level === "" || animal.latestEmissionLevel === level;
            return matchesSearch && matchesLevel;
        })
        .sort((a, b) => a.cattleId - b.cattleId);

    return paginate(items, ctx.query.page);
});

// POST /cattle: adds an animal to the user's farm
addRoute("POST", "/cattle", ({ db, user, body }): CattleDetail => {
    const farmId = requireNumber(body, "farmId", 1, Number.MAX_SAFE_INTEGER);
    assertFarmAccess(user as DemoUser, farmId);
    const cattle: CattleDetail = { cattleId: nextId(db, "cattle"), farmId, ...readCattleFields(body) };
    db.cattle.push(cattle);
    return cattle;
});

// GET /cattle/:cattleId: full animal profile
addRoute("GET", "/cattle/:cattleId", (ctx): CattleDetail => findAccessibleCattle(ctx));

// PUT /cattle/:cattleId: edits an animal
addRoute("PUT", "/cattle/:cattleId", (ctx): CattleDetail => {
    const cattle = findAccessibleCattle(ctx);
    Object.assign(cattle, readCattleFields(ctx.body));
    return cattle;
});

// GET /cattle/:cattleId/feed-records: feed history, newest first
addRoute("GET", "/cattle/:cattleId/feed-records", (ctx): FeedRecord[] => {
    const cattle = findAccessibleCattle(ctx);
    return ctx.db.feedRecords
        .filter((record) => record.cattleId === cattle.cattleId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.feedId - a.feedId)
        .map(toFeedRecord);
});

// POST /cattle/:cattleId/feed-records: logs a feed record (date defaults to today)
addRoute("POST", "/cattle/:cattleId/feed-records", (ctx): FeedRecord => {
    const cattle = findAccessibleCattle(ctx);
    const { body } = ctx;
    const record: DemoFeedRecord = {
        feedId: nextId(ctx.db, "feed"),
        cattleId: cattle.cattleId,
        date: typeof body.date === "string" && body.date ? body.date : new Date().toISOString(),
        foragePctDM: requireNumber(body, "foragePctDM", 0, 100),
        ndfPctDM: requireNumber(body, "ndfPctDM", 0, 100),
        adfPctDM: requireNumber(body, "adfPctDM", 0, 100),
        starchPctDM: requireNumber(body, "starchPctDM", 0, 100),
        fatPercentage: requireNumber(body, "fatPercentage", 0, 30),
        proteinPercentage: requireNumber(body, "proteinPercentage", 0, 50),
        temperature: requireNumber(body, "temperature", -30, 60),
        dmi: requireNumber(body, "dmi", 0, 60),
    };
    ctx.db.feedRecords.push(record);
    return toFeedRecord(record);
});

// ------------------------------------------------------------
// Prediction routes
// ------------------------------------------------------------

// POST /cattle/:cattleId/predict: runs the simulated model on the latest
// feed record, stores the result in history and returns the full explanation
addRoute(
    "POST",
    "/cattle/:cattleId/predict",
    (ctx): PredictionResult => {
        const cattle = findAccessibleCattle(ctx);
        const feed = latestFeedRecord(ctx.db, cattle.cattleId);
        if (!feed) {
            throw new DemoHttpError(400, "no_feed_record", "Add a feed record before running a prediction.");
        }
        const output = runDemoModel(cattle, feed);
        const emissionLevel = classifyAmount(output.amount);
        const prediction: DemoPrediction = {
            predictionId: nextId(ctx.db, "prediction"),
            cattleId: cattle.cattleId,
            cattleBreed: cattle.breed,
            date: new Date().toISOString(),
            predictedMethaneAmount: output.amount,
            emissionLevel,
        };
        ctx.db.predictions.push(prediction);
        return {
            predictionId: prediction.predictionId,
            cattleId: cattle.cattleId,
            date: prediction.date,
            predictedMethaneAmount: output.amount,
            emissionLevel,
            topContributors: output.contributors,
            recommendations: output.recommendations,
            riskThresholds: DEMO_THRESHOLDS,
            modelVersion: DEMO_MODEL_VERSION,
        };
    },
    { delayMs: 1500 }
);

// Applies the level + date filters shared by the history list and the CSV export
function filterPredictions(ctx: RequestContext, farmId: number): DemoPrediction[] {
    const level = typeof ctx.query.level === "string" ? ctx.query.level : "";
    const dateFrom = typeof ctx.query.dateFrom === "string" ? ctx.query.dateFrom : "";
    const dateTo = typeof ctx.query.dateTo === "string" ? ctx.query.dateTo : "";
    const farmCattleIds = new Set(
        ctx.db.cattle.filter((animal) => animal.farmId === farmId).map((animal) => animal.cattleId)
    );

    return ctx.db.predictions
        .filter((prediction) => {
            if (!farmCattleIds.has(prediction.cattleId)) return false;
            if (level !== "" && prediction.emissionLevel !== level) return false;
            const day = prediction.date.slice(0, 10);
            if (dateFrom !== "" && day < dateFrom) return false;
            if (dateTo !== "" && day > dateTo) return false;
            return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.predictionId - a.predictionId);
}

// GET /predictions: filtered, paged prediction history
addRoute("GET", "/predictions", (ctx): PagedResult<PredictionHistoryItem> => {
    const farmId = requireFarmIdQuery(ctx);
    return paginate(filterPredictions(ctx, farmId), ctx.query.page);
});

// GET /predictions/export: the same filtered history as a CSV file
addRoute("GET", "/predictions/export", (ctx): Blob => {
    const farmId = requireFarmIdQuery(ctx);
    const header = "Prediction ID,Date,Cattle ID,Breed,Predicted methane (g/day),Emission level";
    const rows = filterPredictions(ctx, farmId).map((prediction) =>
        [
            prediction.predictionId,
            prediction.date,
            prediction.cattleId,
            `"${prediction.cattleBreed.replace(/"/g, '""')}"`,
            prediction.predictedMethaneAmount.toFixed(1),
            prediction.emissionLevel,
        ].join(",")
    );
    return new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
});

// ------------------------------------------------------------
// Dashboard route
// ------------------------------------------------------------

// GET /dashboard/summary: KPIs, daily trend and the latest predictions
addRoute("GET", "/dashboard/summary", (ctx) => {
    const farmId = requireFarmIdQuery(ctx);
    const days = ctx.query.range === "30d" ? 30 : 7;
    const farmCattle = ctx.db.cattle.filter((animal) => animal.farmId === farmId);
    const farmCattleIds = new Set(farmCattle.map((animal) => animal.cattleId));
    const farmPredictions = ctx.db.predictions.filter((prediction) => farmCattleIds.has(prediction.cattleId));

    const since = new Date(Date.now() - (days - 1) * DAY_MS).toISOString().slice(0, 10);
    const inRange = farmPredictions.filter((prediction) => prediction.date.slice(0, 10) >= since);

    // Daily average of every prediction made that day
    const byDay = new Map<string, number[]>();
    inRange.forEach((prediction) => {
        const day = prediction.date.slice(0, 10);
        byDay.set(day, [...(byDay.get(day) ?? []), prediction.predictedMethaneAmount]);
    });
    const trend = [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
            date,
            averageMethane: round1(values.reduce((sum, value) => sum + value, 0) / values.length),
        }));

    const averageMethane = inRange.length
        ? round1(inRange.reduce((sum, prediction) => sum + prediction.predictedMethaneAmount, 0) / inRange.length)
        : 0;

    // A cattle counts as "high risk" when its most recent prediction is High
    const highEmissionCount = farmCattle.filter(
        (animal) => latestPrediction(ctx.db, animal.cattleId)?.emissionLevel === "High"
    ).length;

    const recentPredictions = [...farmPredictions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.predictionId - a.predictionId)
        .slice(0, 5)
        .map((prediction) => ({
            predictionId: prediction.predictionId,
            cattleBreed: prediction.cattleBreed,
            predictedMethaneAmount: prediction.predictedMethaneAmount,
            emissionLevel: prediction.emissionLevel,
            date: prediction.date,
        }));

    return { totalCattle: farmCattle.length, averageMethane, highEmissionCount, trend, recentPredictions };
});

// ------------------------------------------------------------
// Adapter entry point
// ------------------------------------------------------------

// Wraps a handler result in a minimal axios response. The data is deep-copied,
// exactly like a real network round trip: handlers return live database
// objects, and handing those to TanStack Query would let a later in-place
// edit change a cached object without the UI noticing (same reference =
// "nothing changed")
function buildResponse(config: InternalAxiosRequestConfig, data: unknown): AxiosResponse {
    return { data: structuredClone(data), status: 200, statusText: "OK", headers: {}, config };
}

// Converts a DemoHttpError into the AxiosError a real failed call produces
function buildAxiosError(config: InternalAxiosRequestConfig, error: DemoHttpError): AxiosError {
    const response: AxiosResponse = {
        data: error.payload,
        status: error.status,
        statusText: error.payload.error,
        headers: {},
        config,
    };
    return new AxiosError(
        `Request failed with status code ${error.status}`,
        error.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response
    );
}

// Handles one axios request against the demo database
export async function handleDemoRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    try {
        const method = (config.method ?? "get").toUpperCase();
        const path = normalizePath(config.url ?? "");

        let matched: { route: Route; params: Record<string, string> } | null = null;
        for (const route of routes) {
            if (route.method !== method) continue;
            const result = route.pattern.exec(path);
            if (!result) continue;
            const params: Record<string, string> = {};
            route.paramNames.forEach((name, index) => {
                params[name] = decodeURIComponent(result[index + 1]);
            });
            matched = { route, params };
            break;
        }

        await sleep(matched?.route.delayMs ?? 180 + Math.random() * 220);

        if (!matched) {
            throw new DemoHttpError(404, "not_found", `No demo route for ${method} ${path}.`);
        }

        const db = getDb();
        const user = resolveUser(db, config);
        if (!matched.route.isPublic && !user) {
            throw new DemoHttpError(401, "unauthorized", "Please log in again.");
        }

        const query =
            typeof config.params === "object" && config.params !== null
                ? (config.params as Record<string, unknown>)
                : {};

        const data = matched.route.handler({
            db,
            user,
            params: matched.params,
            query,
            body: parseBody(config.data),
        });

        if (matched.route.isMutation) saveDb(db);
        return buildResponse(config, data);
    } catch (error) {
        if (error instanceof DemoHttpError) throw buildAxiosError(config, error);
        throw error;
    }
}
