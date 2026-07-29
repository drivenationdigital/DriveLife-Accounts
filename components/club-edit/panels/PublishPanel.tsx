"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { FieldLabel, selectCls } from "../shared";
import type { ClubPostStatus, ClubTypeValue } from "@/lib/clubEditTypes";

/** Step 7 — visibility (publish status) and join policy (club type). */
export function PublishPanel() {
  const { club, setField } = useClubEdit();
  const isPublished = club.status === "publish";

  return (
    <div>
      <div className="mb-8">
        <FieldLabel>Club status</FieldLabel>
        <select
          className={selectCls}
          value={club.status}
          onChange={(e) => setField("status", e.target.value as ClubPostStatus)}
        >
          <option value="draft">Unpublished</option>
          <option value="publish">Published</option>
        </select>
      </div>

      <div className="mb-8">
        <FieldLabel hint="Controls whether join requests need approval.">
          Join policy
        </FieldLabel>
        <select
          className={selectCls}
          value={club.clubType}
          onChange={(e) => setField("clubType", e.target.value as ClubTypeValue)}
        >
          <option value="1">Private club — requests need approval</option>
          <option value="2">Public club — anyone can join</option>
        </select>
      </div>

      <ul className="mb-8 space-y-2.5 rounded-xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
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
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-white">
      <i className="fa-solid fa-check" aria-hidden />
    </span>
  );
}
