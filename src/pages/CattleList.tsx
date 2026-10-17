// ============================================================
// File: src/pages/CattleList.tsx
// Purpose: Cattle Inventory page — searchable, filterable,
//          paginated list of all cattle on the farm, plus an
//          inline "Add cattle" form
// Logic:
//   - search/level/page are local UI state; all three are part
//     of useCattleList's queryKey, so any change triggers an
//     automatic, cached refetch (no manual effect needed)
//   - Backend returns a paged result { items, totalCount, page,
//     pageSize } for GET /api/cattle, so totalPages is computed
//     from the real totalCount/pageSize, not a client-side guess
//   - "Add cattle" toggles a small inline form (same pattern as
//     PersonnelAccessCard) instead of a full modal, since no
//     modal component exists yet in this project
// ============================================================
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useFarmContext } from "@/context/FarmContext";
import { useCattleList, useCreateCattle } from "@/hooks/useCattleList";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { CattleTable } from "@/components/cattle/CattleTable";
import { Pagination } from "@/components/common/Pagination";
import type { CreateCattleDto } from "@/types/cattle";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";
import { EMISSION_LEVEL_OPTIONS } from "@/utils/emissionLevel";

export default function CattleList() {
    const { farmId } = useFarmContext();
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("");
    const [page, setPage] = useState(1);
    const [showAddForm, setShowAddForm] = useState(false);

    // cattleResult is the paged response from the backend:
    // { items, totalCount, page, pageSize } — not a raw array
    const { data: cattleResult, isLoading, isError, error } = useCattleList({
        farmId: farmId as number,
        search: search || undefined,
        level: level || undefined,
        page,
    });

    const createCattle = useCreateCattle();

    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [weight, setWeight] = useState("");
    const [sex, setSex] = useState<"1" | "2">("2");
    const [metabolicStatus, setMetabolicStatus] = useState<"Lactating" | "Growing" | "Dry">(
        "Lactating"
    );
    const [dim, setDim] = useState("");
    const [milkKgDay, setMilkKgDay] = useState("");
    const [milkFatPct, setMilkFatPct] = useState("");
    const [milkLactosePct, setMilkLactosePct] = useState("");

    // Submit the new-cattle form, then reset and close it
    function handleAddCattle(e: FormEvent) {
        e.preventDefault();
        const payload: CreateCattleDto = {
            farmId: farmId as number,
            breed,
            age: Number(age),
            weight: Number(weight),
            sex: Number(sex) as CreateCattleDto["sex"],
            metabolicStatus,
            dim: Number(dim),
            milkKgDay: Number(milkKgDay),
            milkFatPct: Number(milkFatPct),
            milkLactosePct: Number(milkLactosePct),
        };
        createCattle.mutate(payload, {
            onSuccess: () => {
                setBreed("");
                setAge("");
                setWeight("");
                setSex("2");
                setMetabolicStatus("Lactating");
                setDim("");
                setMilkKgDay("");
                setMilkFatPct("");
                setMilkLactosePct("");
                setShowAddForm(false);
            },
        });
    }

    // Reset to page 1 whenever a filter changes, so results stay predictable
    function handleSearchChange(value: string) {
        setSearch(value);
        setPage(1);
    }

    function handleLevelChange(value: string) {
        setLevel(value);
        setPage(1);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-semibold text-on-surface">Cattle</h1>
                    <p className="mt-1 text-sm text-on-surface-variant">
                        Manage your herd and view each animal's latest emission level.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddForm((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-container"
                >
                    <Plus className="h-4 w-4" />
                    Add cattle
                </button>
            </div>

            {showAddForm && (
                <form
                    onSubmit={handleAddCattle}
                    className="grid grid-cols-1 gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-5 sm:grid-cols-4"
                >
                    <input
                        type="text"
                        placeholder="Breed"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        placeholder="Age (months)"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Weight (kg)"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value as "1" | "2")}
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="2">Female</option>
                        <option value="1">Male</option>
                    </select>
                    <select
                        value={metabolicStatus}
                        onChange={(e) =>
                            setMetabolicStatus(e.target.value as "Lactating" | "Growing" | "Dry")
                        }
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="Lactating">Lactating</option>
                        <option value="Growing">Growing</option>
                        <option value="Dry">Dry</option>
                    </select>
                    <input
                        type="number"
                        placeholder="DIM (days)"
                        value={dim}
                        onChange={(e) => setDim(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Milk yield (kg/day)"
                        value={milkKgDay}
                        onChange={(e) => setMilkKgDay(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Milk fat %"
                        value={milkFatPct}
                        onChange={(e) => setMilkFatPct(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Milk lactose %"
                        value={milkLactosePct}
                        onChange={(e) => setMilkLactosePct(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm tabular-nums text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        disabled={createCattle.isPending}
                        className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-4 sm:w-fit"
                    >
                        {createCattle.isPending ? "Adding..." : "Save animal"}
                    </button>

                    {createCattle.isError && (
                        <p className="text-sm text-error sm:col-span-4" role="alert">
                            {getFriendlyErrorMessage(
                                createCattle.error,
                                "Could not add the animal. Please try again."
                            )}
                        </p>
                    )}
                </form>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchBar value={search} onChange={handleSearchChange} placeholder="Search by breed..." className="sm:w-72" />
                <FilterDropdown
                    value={level}
                    onChange={handleLevelChange}
                    options={EMISSION_LEVEL_OPTIONS}
                    placeholder="All emission levels"
                    className="sm:w-56"
                />
            </div>

            {isLoading && <p className="text-sm text-on-surface-variant">Loading cattle...</p>}

            {isError && (
                <p className="text-sm text-error" role="alert">
                    {getFriendlyErrorMessage(error, "Could not load the cattle list. Please try again shortly.")}
                </p>
            )}

            {cattleResult && (
                <>
                    <CattleTable cattle={cattleResult.items} />
                    <Pagination
                        currentPage={cattleResult.page}
                        totalPages={Math.max(1, Math.ceil(cattleResult.totalCount / cattleResult.pageSize))}
                        onPageChange={setPage}
                    />
                </>
            )}
        </div>
    );
}