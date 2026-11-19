"use client";

import { useState } from "react";

import { useVenueEdit, type VenueForm } from "@/context/VenueEditContext";
import { useVenueStepNav, venueSaveCta } from "../shared";

/**
 * Step 4 - review and publish. Modelled on the event editor's Publish
 * step:
 *
 *   1. Venue status - two option cards (draft / published) rather than
 *      a select, each saying what it means for visibility.
 *   2. Summary card - recaps what has been entered, read live from
 *      state, plus the venue's public link once it is actually live.
 *   3. Big save button - same save as the topbar, worded for what the
 *      click will do (Publish venue / Save draft / Save).
 *
 * Venues have no scheduling and no private mode, so the event editor's
 * Schedule option and Visibility card have no counterpart here.
 */
export function PublishPanel() {
  const { venue, set, liveStatus, permalink, save, isSaving, saveError } =
    useVenueEdit();
  const { goToStep } = useVenueStepNav();

  const isLive = liveStatus === "publish";
  const cta = venueSaveCta(venue.status, liveStatus);

  const setStatus = (next: VenueForm["status"]) => set("status", next);

  const onSave = async () => {
    if (isSaving) return;
    // A missing required field sends the user to the step that holds it.
    const jumpTo = await save();
    if (jumpTo) goToStep(jumpTo);
  };

  // ---- Summary derivations ----
  const summaryImages =
    venue.logo && venue.cover
      ? "Logo and cover"
      : venue.cover
        ? "Cover only"
        : venue.logo
          ? "Logo only"
          : "None yet";
  const hasDescription =
    venue.description.replace(/<[^>]*>/g, "").trim().length > 0;

  // Only a live venue has a page to link to. A draft's permalink is a
  // ?p= address that 404s for visitors, so showing it invites copying a
  // dead link - the card holds it back until the venue is published.
  const showUrl = isLive && permalink !== "";

  const [copied, setCopied] = useState(false);
  const onCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write blocked - ignore.
    }
  };

  return (
    <div>
      {/* ---- Status ---- */}
      <div className="bg-white border border-ink-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <label className="block text-sm font-semibold text-ink-900">
            Venue status
          </label>
          {/* What the server holds right now - the cards below are a
              choice that only takes effect on save. */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isLive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-ink-100 text-ink-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? "bg-emerald-500" : "bg-ink-400"
              }`}
              aria-hidden
            />
            {isLive ? "Currently live" : "Currently a draft"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatusOption
            checked={venue.status === "draft"}
            onClick={() => setStatus("draft")}
            icon="fa-regular fa-file-lines"
            iconClass="text-ink-500"
            title="Draft"
            description="Only you can see it"
          />
          <StatusOption
            checked={venue.status === "publish"}
            onClick={() => setStatus("publish")}
            icon="fa-solid fa-rocket"
            iconClass="text-gold-600"
            title="Published"
            description="Visible to everyone"
          />
        </div>
      </div>

      {/* ---- Summary card ---- */}
      <div className="bg-ink-900 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        {/* Soft glow blob in the corner - purely decorative. */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-check text-white" aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg">
                {isLive ? "Your venue is live" : "Your venue is ready"}
              </p>
              <p className="text-xs text-ink-300">
                {isLive
                  ? "Saved changes show on the venue page straight away"
                  : "Review the details before publishing"}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
            <SummaryItem label="Venue" value={venue.title || "Untitled venue"} />
            <SummaryItem
              label="Location"
              value={venue.location || "Not set"}
            />
            <SummaryItem label="Images" value={summaryImages} />
            <SummaryItem
              label="Description"
              value={hasDescription ? "Added" : "Not added yet"}
            />
          </dl>
          {showUrl ? (
            <div className="p-3 bg-white/10 border border-white/10 rounded-lg flex items-center gap-2">
              <i
                className="fa-solid fa-link text-gold-400 text-xs"
                aria-hidden
              />
              <a
                href={permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-ink-200 hover:text-white hover:underline transition truncate min-w-0 flex-1"
              >
                {displayUrl(permalink, 28)}
              </a>
              <button
                type="button"
                onClick={onCopyUrl}
                className="text-xs text-gold-400 hover:text-gold-300 transition font-semibold shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-white/10 border border-white/10 rounded-lg flex items-center gap-2">
              <i
                className="fa-regular fa-eye-slash text-gold-400 text-xs"
                aria-hidden
              />
              <span className="text-xs text-ink-200">
                Your venue link will appear here once it&rsquo;s published.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ---- Big save / publish button ---- */}
      <button
        type="button"
        disabled={isSaving}
        className="w-full py-4 text-base font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={onSave}
      >
        <i
          className={isSaving ? "fa-solid fa-spinner fa-spin" : cta.icon}
          aria-hidden
        />
        {isSaving ? cta.busyLabel : cta.longLabel}
      </button>

      {/* Save error - only rendered on failure. */}
      {saveError && (
        <p className="mt-3 text-sm text-red-600 text-center">{saveError}</p>
      )}
    </div>
  );
}

// ============================================================
// Subcomponents - local; no need to export.
// ============================================================

/** One of the two status cards. A button with aria-pressed rather than
 *  a hidden radio - same pattern as the event editor's options. */
function StatusOption({
  checked,
  onClick,
  icon,
  iconClass,
  title,
  description,
}: {
  checked: boolean;
  onClick: () => void;
  icon: string;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition text-left ${
        checked
          ? "border-gold-500 bg-gold-50"
          : "border-ink-200 hover:border-ink-300 bg-white"
      }`}
    >
      <i className={`${icon} ${iconClass} text-lg w-5 text-center`} aria-hidden />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-400 mb-1">{label}</dt>
      <dd className="font-medium truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Strip the scheme (and a leading "www.") for display, then truncate
 * the final path segment so a long slug doesn't blow out the card. The
 * domain and region prefix stay fully visible; the href and the
 * clipboard both carry the full URL.
 */
function displayUrl(url: string, max: number): string {
  const bare = url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
  const cut = bare.lastIndexOf("/");
  if (cut === -1) return bare;
  const slug = bare.slice(cut + 1);
  return `${bare.slice(0, cut)}/${
    slug.length <= max ? slug : `${slug.slice(0, max - 1)}…`
  }`;
}
