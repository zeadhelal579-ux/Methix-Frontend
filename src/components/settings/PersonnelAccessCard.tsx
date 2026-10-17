// ============================================================
// File: src/components/settings/PersonnelAccessCard.tsx
// Purpose: Lists team members and their roles, with an "Add
//          member" action — Settings > Personnel Access section
// Logic:
//   - Purely presentational list + a controlled add-member form
//     shown/hidden via local "isAdding" state
//   - Add action is Admin-only on the backend ([Authorize(Roles =
//     "Admin")]); the button is still shown to all roles here,
//     the backend enforces the real restriction (defense stays
//     server-side, UI just reflects intent)
//   - handleSubmit passes an onSuccess callback down through onAdd,
//     so the form only resets/closes when the add actually
//     succeeds. On failure (duplicate email, non-Admin, network
//     error), the form stays open with the entered data intact,
//     and addError is rendered via the shared errorMessages util.
// ============================================================
import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import type { AddPersonnelDto, Personnel } from "@/types/farm";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

interface PersonnelAccessCardProps {
    personnel: Personnel[];
    // onSuccess is called only when the add actually succeeds, so the
    // form reset/close below never fires on failure
    onAdd: (payload: AddPersonnelDto, options: { onSuccess: () => void }) => void;
    isAdding?: boolean;
    addError?: unknown;
}

// Lists the farm's team and lets an Admin add a new member
export function PersonnelAccessCard({ personnel, onAdd, isAdding = false, addError }: PersonnelAccessCardProps) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"Farmer" | "Admin">("Farmer");

    // Submit the new-member form. Reset and close it ONLY on success,
    // so a failed add (duplicate email, non-Admin, network error)
    // leaves the form open with the entered data intact.
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        onAdd(
            { name, email, password, role },
            {
                onSuccess: () => {
                    setName("");
                    setEmail("");
                    setPassword("");
                    setRole("Farmer");
                    setShowForm(false);
                },
            }
        );
    }

    return (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-on-surface">Team access</h3>
                <button
                    type="button"
                    onClick={() => setShowForm((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container"
                >
                    <UserPlus className="h-4 w-4" />
                    Add member
                </button>
            </div>

            <div className="mt-4 flex flex-col divide-y divide-outline-variant">
                {personnel.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between py-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-on-surface">{member.name}</span>
                            <span className="text-xs text-on-surface-variant">{member.email}</span>
                        </div>
                        <span className="rounded-full bg-secondary-container px-2.5 py-1 text-xs font-medium text-on-secondary-container">
                            {member.role}
                        </span>
                    </div>
                ))}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border-t border-outline-variant pt-4">
                    <input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                        type="password"
                        placeholder="Temporary password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as "Farmer" | "Admin")}
                        className="h-10 rounded-md border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="Farmer">Farmer</option>
                        <option value="Admin">Admin</option>
                    </select>

                    <button
                        type="submit"
                        disabled={isAdding}
                        className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAdding ? "Adding..." : "Add member"}
                    </button>

                    {addError !== undefined && addError !== null && (
                        <p className="text-sm text-error" role="alert">
                            {getFriendlyErrorMessage(addError, "Could not add team member. Please try again.")}
                        </p>
                    )}
                </form>
            )}
        </div>
    );
}