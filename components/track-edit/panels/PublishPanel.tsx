"use client";

import { useTrackEdit, type TrackForm } from "@/context/TrackEditContext";
import { FieldLabel, selectCls } from "../shared";

/** Step 4 - visibility (publish status). */
export function PublishPanel() {
  const { track, set } = useTrackEdit();
  const isPublished = track.status === "publish";

  return (
    <div>
      <div className="mb-8">
        <FieldLabel>Track status</FieldLabel>
        <select
          className={selectCls}
          value={track.status}
          onChange={(e) => set("status", e.target.value as TrackForm["status"])}
        >
          <option value="draft">Unpublished</option>
          <option value="publish">Published</option>
        </select>
      </div>

      <ul className="mb-8 space-y-2.5 rounded-xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "Your track is live in the Tracks & Circuits directory."
            : "Your track is currently unpublished."}
        </li>
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "You can pick it as the host when you create an event."
            : "Once it's live you can pick it as the host when you create an event."}
        </li>
        {isPublished && track.permalink && (
          <li className="flex items-center gap-2.5">
            <CheckDot />
            <a
              href={track.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold-700 underline underline-offset-2"
            >
              View the public track page
            </a>
          </li>
        )}
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
