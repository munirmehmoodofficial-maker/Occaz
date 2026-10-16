import { Users, Mail, Plus } from "lucide-react";

/**
 * Section 10 — Team & Staff (Phase 3)
 * Schema is in place. UI is staged.
 */
export function Section10Team() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Team & staff</h2>
        <p className="text-xs text-zinc-500">
          Invite event managers, check-in staff, and finance admins
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-zinc-600" />
        <h3 className="mt-3 text-base font-semibold text-white">
          Team management — coming soon
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          The data model is in place. The full UI — invitations, role-based
          permissions, check-in staff accounts, activity history — will
          arrive in a later release. Higher-tier feature.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Event managers
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Check-in staff
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Finance admins
          </span>
        </div>
      </div>
    </div>
  );
}
