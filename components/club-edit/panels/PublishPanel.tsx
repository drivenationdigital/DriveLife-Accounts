"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { FieldLabel, Divider, inputCls } from "../shared";
import type { ClubPostStatus, ClubTypeValue } from "@/lib/clubEditTypes";

/** Step 7 — visibility (publish status) and join policy (club type). */
export function PublishPanel() {
  const { club, setField } = useClubEdit();
  const isPublished = club.status === "publish";

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Club Status</FieldLabel>
        <div className="relative">
          <select
            className={`${inputCls} appearance-none pr-10`}
            value={club.status}
            onChange={(e) =>
              setField("status", e.target.value as ClubPostStatus)
            }
          >
            <option value="draft">Unpublished</option>
            <option value="publish">Published</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
            ▾
          </span>
        </div>
      </div>

      <div>
        <FieldLabel hint="Controls whether join requests need approval.">
          Join Policy
        </FieldLabel>
        <div className="relative">
          <select
            className={`${inputCls} appearance-none pr-10`}
            value={club.clubType}
            onChange={(e) =>
              setField("clubType", e.target.value as ClubTypeValue)
            }
          >
            <option value="1">Private Club — requests need approval</option>
            <option value="2">Public Club — anyone can join</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
            ▾
          </span>
        </div>
      </div>

      <Divider />

      <ul className="space-y-2.5 rounded-2xl border border-gold-100 bg-gradient-to-br from-gold-50/50 to-transparent p-5 text-sm text-ink-700">
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "Your club is live and visible to everyone."
            : "Your club is currently unpublished."}
        </li>
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "You can share it anywhere."
            : "You will be able to view and share it once it's live."}
        </li>
      </ul>
    </div>
  );
}

function CheckDot() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-[10px] font-bold text-white">
      ✓
    </span>
  );
}
