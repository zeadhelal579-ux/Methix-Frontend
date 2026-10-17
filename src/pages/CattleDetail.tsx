// ============================================================
// File: src/pages/CattleDetail.tsx
// Purpose: Most complex page — single animal's profile, feed
//          record history, and the full "Run Prediction Model"
//          flow (result + SHAP explanation + recommendation)
// Logic:
//   - cattleId comes from the URL via useParams (React Router)
//   - Two independent queries (cattle detail + feed records) via
//     useCattleDetail/useFeedRecords, each with its own loading
//     state, matching the Architecture's "end-to-end trace"
//   - The prediction RESULT itself is local state (useState), not
//     server state cached by React Query — it's a one-off action
//     result, not something re-fetched; this exactly matches
//     Frontend-Architecture step 7: "النتيجة بتتخزن في Local
//     State جوه صفحة CattleDetail"
//   - "Run Prediction Model" button disables + shows a spinner
//     label while the mutation is pending
//   - Two-column layout matches the Cattle Detail mockup: left
//     column holds the profile card + feed records, right column
//     holds the prediction button/result/explanation/recommendation,
//     stacking to a single column on small screens
//   - "Edit" toggles CattleProfileCard for an inline edit form (same
//     pattern as the Add-feed-record toggle below it), pre-filled
//     from the loaded cattle and wired to useUpdateCattle — this
//     closes a gap where updateCattle/UpdateCattleDto/PUT
//     /api/cattle/{cattleId} all existed end-to-end but had no UI
//     entry point anywhere in the app
// ============================================================
import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Pencil, Sparkles } from "lucide-react";
import {
    useCattleDetail,
    useCreateFeedRecord,
    useFeedRecords,
    useUpdateCattle,
} from "@/hooks/useCattleDetail";
import { useRunPrediction } from "@/hooks/usePrediction";
import { CattleProfileCard } from "@/components/cattle/CattleProfileCard";
import { FeedRecordTable } from "@/components/cattle/FeedRecordTable";
import { PredictionResultCard } from "@/components/predictions/PredictionResultCard";
import { ExplanationChart } from "@/components/predictions/ExplanationChart";
import { RecommendationCard } from "@/components/predictions/RecommendationCard";
import type { CattleDetail, CreateFeedRecordDto, UpdateCattleDto } from "@/types/cattle";
import type { PredictionResult } from "@/types/prediction";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

const INPUT_CLASSES =
    "h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
export default function CattleDetail() {
    // cattleId is read from the URL and converted to a number for the
    // hooks below (React Router params are always strings)
    const { cattleId } = useParams<{ cattleId: string }>();
    const id = Number(cattleId);

    const { data: cattle, isLoading: isCattleLoading, isError: isCattleError, error: cattleError } = useCattleDetail(id);
    const { data: feedRecords, isLoading: isFeedLoading } = useFeedRecords(id);

    const createFeedRecord = useCreateFeedRecord(id);
    const updateCattle = useUpdateCattle(id);
    const runPrediction = useRunPrediction(id);

    // Holds the latest prediction result locally; not server-cached,
    // since it's a one-off action output, not re-fetchable page data
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [predictionErrorMsg, setPredictionErrorMsg] = useState<string | null>(null);

    // Local state for the inline "Add feed record" form, field order
    // matches FeedRecordTable's columns: Intake, Forage, NDF, ADF,
    // Starch, Fat, Protein, Temp
    const [showFeedForm, setShowFeedForm] = useState(false);
    const [dmi, setDmi] = useState("");
    const [forage, setForage] = useState("");
    const [ndf, setNdf] = useState("");
    const [adf, setAdf] = useState("");
    const [starch, setStarch] = useState("");
    const [fat, setFat] = useState("");
    const [protein, setProtein] = useState("");
    const [temperature, setTemperature] = useState("");

    // Local state for the inline "Edit cattle" form, opened from
    // CattleProfileCard's header. Seeded from the loaded `cattle` each
    // time the form is opened (see handleStartEdit), not on mount,
    // since `cattle` isn't available yet on first render.
    const [isEditingCattle, setIsEditingCattle] = useState(false);
    const [editBreed, setEditBreed] = useState("");
    const [editAge, setEditAge] = useState("");
    const [editWeight, setEditWeight] = useState("");
    const [editSex, setEditSex] = useState<"1" | "2">("2");
    const [editMetabolicStatus, setEditMetabolicStatus] = useState<
        "Lactating" | "Growing" | "Dry"
    >("Lactating");
    const [editDim, setEditDim] = useState("");
    const [editMilkKgDay, setEditMilkKgDay] = useState("");
    const [editMilkFatPct, setEditMilkFatPct] = useState("");
    const [editMilkLactosePct, setEditMilkLactosePct] = useState("");

    // Submit a new feed record, then reset and close the inline form
    function handleAddFeedRecord(e: FormEvent) {
        e.preventDefault();
        const payload: CreateFeedRecordDto = {
            foragePctDM: Number(forage),
            ndfPctDM: Number(ndf),
            adfPctDM: Number(adf),
            starchPctDM: Number(starch),
            fatPercentage: Number(fat),
            proteinPercentage: Number(protein),
            temperature: Number(temperature),
            dmi: Number(dmi),
        };
        createFeedRecord.mutate(payload, {
            onSuccess: () => {
                setDmi("");
                setForage("");
                setNdf("");
                setAdf("");
                setStarch("");
                setFat("");
                setProtein("");
                setTemperature("");
                setShowFeedForm(false);
            },
        });
    }

    // Open the edit form, seeding every field from the animal's current
    // values. Takes `cattle` as a parameter (rather than closing over the
    // outer `cattle` directly) so this can be defined once, above the
    // page's loading/error early-returns, same as the other handlers.
    function handleStartEdit(currentCattle: CattleDetail) {
        setEditBreed(currentCattle.breed);
        setEditAge(String(currentCattle.age));
        setEditWeight(String(currentCattle.weight));
        setEditSex(String(currentCattle.sex) as "1" | "2");
        setEditMetabolicStatus(currentCattle.metabolicStatus);
        setEditDim(String(currentCattle.dim));
        setEditMilkKgDay(String(currentCattle.milkKgDay));
        setEditMilkFatPct(String(currentCattle.milkFatPct));
        setEditMilkLactosePct(String(currentCattle.milkLactosePct));
        setIsEditingCattle(true);
    }

    // Submit the edit form; closes it only once the save actually succeeds,
    // same convention as the Add-cattle/Add-feed-record/Add-member forms
    function handleUpdateCattle(e: FormEvent) {
        e.preventDefault();
        const payload: UpdateCattleDto = {
            breed: editBreed,
            age: Number(editAge),
            weight: Number(editWeight),
            sex: Number(editSex) as UpdateCattleDto["sex"],
            metabolicStatus: editMetabolicStatus,
            dim: Number(editDim),
            milkKgDay: Number(editMilkKgDay),
            milkFatPct: Number(editMilkFatPct),
            milkLactosePct: Number(editMilkLactosePct),
        };
        updateCattle.mutate(payload, {
            onSuccess: () => setIsEditingCattle(false),
        });
    }

    // Trigger a full prediction run; on failure, show a clear inline message
    // instead of technical details, per the Backend's 503/502 error contract.
    // Clears both the previous error AND the previous result up front: without
    // this, a failed re-run left the OLD PredictionResultCard/ExplanationChart/
    // RecommendationCard on screen directly beside a fresh "unavailable" error,
    // implying the stale number was still current.
    function handleRunPrediction() {
        setPredictionErrorMsg(null);
        setResult(null);
        runPrediction.mutate(undefined, {
            onSuccess: (data) => setResult(data),
            onError: (err) => {
                setPredictionErrorMsg(
                    getFriendlyErrorMessage(
                        err,
                        "Prediction is unavailable right now. Please try again shortly."
                    )
                );
            },
        });
    }
    // Loading state for the core animal data (blocks the whole page)
    if (isCattleLoading) {
        return <p className="text-sm text-on-surface-variant">Loading animal...</p>;
    }

    // Error/not-found state for the core animal data
    if (isCattleError || !cattle) {
        return (
            <p className="text-sm text-error" role="alert">
                {getFriendlyErrorMessage(cattleError, "This animal could not be found.")}
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column: animal profile + feed records */}
            <div className="flex flex-col gap-6 lg:col-span-2">
                {isEditingCattle ? (
                    <form
                        onSubmit={handleUpdateCattle}
                        className="grid grid-cols-1 gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5 sm:grid-cols-4"
                    >
                        <input
                            type="text"
                            placeholder="Breed"
                            value={editBreed}
                            onChange={(e) => setEditBreed(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <input
                            type="number"
                            placeholder="Age (months)"
                            value={editAge}
                            onChange={(e) => setEditAge(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Weight (kg)"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <select
                            value={editSex}
                            onChange={(e) => setEditSex(e.target.value as "1" | "2")}
                            className={INPUT_CLASSES}
                        >
                            <option value="2">Female</option>
                            <option value="1">Male</option>
                        </select>
                        <select
                            value={editMetabolicStatus}
                            onChange={(e) =>
                                setEditMetabolicStatus(e.target.value as "Lactating" | "Growing" | "Dry")
                            }
                            className={INPUT_CLASSES}
                        >
                            <option value="Lactating">Lactating</option>
                            <option value="Growing">Growing</option>
                            <option value="Dry">Dry</option>
                        </select>
                        <input
                            type="number"
                            placeholder="DIM (days)"
                            value={editDim}
                            onChange={(e) => setEditDim(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Milk yield (kg/day)"
                            value={editMilkKgDay}
                            onChange={(e) => setEditMilkKgDay(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Milk fat %"
                            value={editMilkFatPct}
                            onChange={(e) => setEditMilkFatPct(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />
                        <input
                            type="number"
                            step="0.1"
                            placeholder="Milk lactose %"
                            value={editMilkLactosePct}
                            onChange={(e) => setEditMilkLactosePct(e.target.value)}
                            required
                            className={INPUT_CLASSES}
                        />

                        <div className="flex items-center gap-2 sm:col-span-4">
                            <button
                                type="submit"
                                disabled={updateCattle.isPending}
                                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updateCattle.isPending ? "Saving..." : "Save changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditingCattle(false)}
                                className="h-10 rounded-md border border-outline-variant px-4 text-sm font-medium text-on-surface hover:bg-surface-container"
                            >
                                Cancel
                            </button>
                        </div>

                        {updateCattle.isError && (
                            <p className="text-sm text-error sm:col-span-4" role="alert">
                                {getFriendlyErrorMessage(
                                    updateCattle.error,
                                    "Could not save changes. Please try again."
                                )}
                            </p>
                        )}
                    </form>
                ) : (
                    <div className="relative">
                        <CattleProfileCard cattle={cattle} />
                        <button
                            type="button"
                            onClick={() => handleStartEdit(cattle)}
                            aria-label="Edit animal"
                            className="absolute right-5 top-5 flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    </div>
                )}

                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-display text-lg font-semibold text-on-surface">
                            Feed record
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowFeedForm((prev) => !prev)}
                            className="rounded-md border border-outline-variant px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container"
                        >
                            Add record
                        </button>
                    </div>

                    {/* Inline add-record form: Intake / Forage / NDF / ADF /
                        Starch / Fat % / Protein % / Temp °C, matching
                        FeedRecordTable's column order */}
                    {showFeedForm && (
                        <form
                            onSubmit={handleAddFeedRecord}
                            className="mb-4 grid grid-cols-1 gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5 sm:grid-cols-4"
                        >
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Intake (kg)"
                                value={dmi}
                                onChange={(e) => setDmi(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Forage %"
                                value={forage}
                                onChange={(e) => setForage(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="NDF %"
                                value={ndf}
                                onChange={(e) => setNdf(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="ADF %"
                                value={adf}
                                onChange={(e) => setAdf(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Starch %"
                                value={starch}
                                onChange={(e) => setStarch(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Fat %"
                                value={fat}
                                onChange={(e) => setFat(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Protein %"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Temp (°C)"
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                                required
                                className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />

                            <button
                                type="submit"
                                disabled={createFeedRecord.isPending}
                                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-4 sm:w-fit"
                            >
                                {createFeedRecord.isPending ? "Saving..." : "Save record"}
                            </button>

                            {createFeedRecord.isError && (
                                <p className="text-sm text-error sm:col-span-4" role="alert">
                                    {getFriendlyErrorMessage(
                                        createFeedRecord.error,
                                        "Could not save the feed record. Please try again."
                                    )}
                                </p>
                            )}
                        </form>
                    )}

                    {/* Feed record history table, or a loading message while
                        the query is in flight */}
                    {isFeedLoading ? (
                        <p className="text-sm text-on-surface-variant">Loading feed records...</p>
                    ) : (
                        <FeedRecordTable records={feedRecords ?? []} />
                    )}
                </div>
            </div>

            {/* Right column: Run Prediction Model button, then the result
                panel once a prediction has been run */}
            <div className="flex flex-col gap-6">
                <button
                    type="button"
                    onClick={handleRunPrediction}
                    disabled={runPrediction.isPending || !feedRecords?.length}
                    className="flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {runPrediction.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Run Prediction Model
                        </>
                    )}
                </button>

                {/* Guardrail message: explains why the button is disabled
                    when there's no feed record to run the model on */}
                {!feedRecords?.length && (
                    <p className="-mt-4 text-xs text-on-surface-variant">
                        Add a feed record before running a prediction.
                    </p>
                )}

                {/* Prediction failure message: generic and non-technical,
                    per Backend-Architecture's 503/502 error contract */}
                {predictionErrorMsg && (
                    <p className="-mt-4 text-sm text-error" role="alert">
                        {predictionErrorMsg}
                    </p>
                )}

                {/* Prediction result: headline number, SHAP explanation,
                    and the AI-generated recommendation, shown only after
                    a successful run */}
                {result && (
                    <>
                        <PredictionResultCard result={result} />
                        <ExplanationChart factors={result.topContributors} />
                        <RecommendationCard result={result} />
                    </>
                )}
            </div>
        </div>
    );
}