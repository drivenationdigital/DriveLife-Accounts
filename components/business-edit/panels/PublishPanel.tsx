"use client";

import { useBusinessEdit, type BusinessForm } from "@/context/BusinessEditContext";
import { FieldLabel, selectCls } from "../shared";

/** Step 6 - visibility (publish status). */
export function PublishPanel() {
  const { business, set } = useBusinessEdit();
  const isPublished = business.status === "publish";

  return (
    <div>
      <div className="mb-8">
        <FieldLabel>Business status</FieldLabel>
        <select
          className={selectCls}
          value={business.status}
          onChange={(e) => set("status", e.target.value as BusinessForm["status"])}
        >
          <option value="draft">Unpublished</option>
          <option value="publish">Published</option>
        </select>
      </div>

      <ul className="mb-8 space-y-2.5 rounded-xl border border-gold-200 bg-gold-50 p-5 text-sm text-ink-700">
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "Your business is live in the Businesses directory on CarEvents.com."
            : "Your business is currently unpublished and hidden from the directory."}
        </li>
        <li className="flex items-center gap-2.5">
          <CheckDot />
          {isPublished
            ? "You can share your profile page anywhere."
            : "Set it to Published and click Update Business to go live."}
        </li>
        {business.traders.member && (
          <li className="flex items-center gap-2.5">
            <CheckDot />
            {isPublished
              ? "Event organisers can find you in the Event Exhibitor Directory."
              : "Publish to appear in the Event Exhibitor Directory for organisers."}
          </li>
        )}
      </ul>

      {isPublished && business.permalink && (
        <p className="text-sm text-ink-600">
          Profile page:{" "}
          <a
            href={business.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold-600 hover:text-gold-700 underline underline-offset-2 break-all"
          >
            {business.permalink}
          </a>
        </p>
      )}
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
