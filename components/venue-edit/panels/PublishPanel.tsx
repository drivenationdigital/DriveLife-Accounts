"use client";

import { useVenueEdit, type VenueForm } from "@/context/VenueEditContext";
import { FieldLabel, selectCls } from "../shared";

/** Step 4 - visibility (publish status). */
export function PublishPanel() {
  const { venue, set } = useVenueEdit();
  const isPublished = venue.status === "publish";

  return (
    <div>
      <div className="mb-8">
        <FieldLabel>Venue status</FieldLabel>
        <select
          className={selectCls}
          value={venue.status}
          onChange={(e) => set("status", e.target.value as VenueForm["status"])}
        >
          <option value="draft">Unpublished</option>
          <option value="publish">Published</option>
        </select>
      </div>

      <ul className="mb-8 space-y-2.5 rounded-xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "Your venue is live and visible to everyone."
            : "Your venue is currently unpublished."}
        </li>
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "You can share it anywhere."
            : "You will be able to view and share it once it’s live."}
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
