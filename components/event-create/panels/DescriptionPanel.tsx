"use client";

import { useEventSteps, useEventRegion } from "@/lib/useEventSteps";
import { useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";

import { pushStepUrl } from "@/lib/stepNav";

import { useEventCreate, type EditorImage } from "@/context/EventCreateContext";
import {
  imageSrc,
  makeLocalImage,
  needsServerDelete,
  revokeIfLocal,
} from "@/lib/editorImage";
import { useUploadEventImage, useRemoveEventImage } from "@/lib/imageMutations";
import { ApiError } from "@/lib/apiClient";

import { PanelHeader } from "../PanelHeader";
import { EditorTextarea } from "../EditorTextarea";

/**
 * Step 3 of the wizard.
 *
 * Three sections:
 *   1. Cover image - placeholder hover-card. Replace/Remove buttons
 *      surface an upload UI later (when we wire image upload). For
 *      now, Replace prompts a URL paste, Remove clears the field.
 *      The full upload flow lives in the Gallery panel.
 *
 *   2. About text - textarea with a decorative formatting toolbar.
 *      The toolbar buttons don't do anything; rich-text editing would
 *      need a library like TipTap or ProseMirror, which is out of
 *      scope for the initial port. We keep the visual chrome so the
 *      design isn't compromised, and a future swap to a real editor
 *      can keep the same outer styling.
 *
 *   3. Contact & links - six labelled URL/email/tel inputs (website,
 *      email, phone, Facebook, Instagram, TikTok), each with a leading
 *      brand/icon. All optional.
 *
 * The "Generate with AI" button is also decorative for now.
 */
export function DescriptionPanel() {
  const { state, dispatch } = useEventCreate();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { stepCount, adjacent, stepNumber } = useEventSteps();

  const { prev, next } = adjacent("description");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    pushStepUrl(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cover image is picked from the device. The hidden <input> is
  // triggered by the Replace/Add buttons. Selected files become
  // `local` immediately for instant preview, then upload to
  // Cloudflare in the background and get replaced with `remote {
  // url, cloudflareId }` on success. The server-side
  // /event-image-confirm deletes the previous cover from CF + DB as
  // part of the same call, so we don't have to chain a delete here.
  const coverInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadEventImage();
  const remover = useRemoveEventImage();
  const eid = state.encryptedId;
  // The region the eid resolves against. The image confirm step
  // writes this to the DB, so it has to match the event.
  const site = useEventRegion().key;
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  const errorText = (err: unknown): string =>
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Couldn't upload that image.";

  const onPickCover = () => {
    coverInputRef.current?.click();
  };

  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input value so picking the same file twice still
    // triggers onChange.
    e.target.value = "";
    if (!file) return;
    setCoverError(null);

    // Revoke the previous local previewUrl (if any) before swapping
    // so we don't leak the blob.
    revokeIfLocal(state.coverImage);
    const local = makeLocalImage(file);
    dispatch({ type: "SET_FIELD", key: "coverImage", value: local });

    if (!eid) {
      setCoverError(
        "Save the event basics first so we know where to attach the cover image.",
      );
      revokeIfLocal(local);
      dispatch({ type: "SET_FIELD", key: "coverImage", value: null });
      return;
    }

    setCoverBusy(true);
    try {
      const image = await upload.mutateAsync({
        eid,
        site,
        file,
        mediaGroup: "cover",
      });
      const remote: EditorImage = {
        kind: "remote",
        url: image.url,
        cloudflareId: image.id,
      };
      dispatch({ type: "SET_FIELD", key: "coverImage", value: remote });
      revokeIfLocal(local);
    } catch (err) {
      setCoverError(errorText(err));
      revokeIfLocal(local);
      dispatch({ type: "SET_FIELD", key: "coverImage", value: null });
    } finally {
      setCoverBusy(false);
    }
  };

  const onCoverRemove = async () => {
    const current = state.coverImage;
    if (!current) return;
    setCoverError(null);

    // Server-side delete only matters for CF-backed covers. Legacy
    // remote covers without a cloudflareId, and WordPress-sourced
    // ones, just drop from local state.
    if (needsServerDelete(current) && eid) {
      setCoverBusy(true);
      try {
        await remover.mutateAsync({ eid, site, mediaId: current.cloudflareId });
      } catch (err) {
        setCoverError(`Couldn't remove image: ${errorText(err)}`);
        setCoverBusy(false);
        return;
      }
      setCoverBusy(false);
    }

    revokeIfLocal(current);
    dispatch({ type: "SET_FIELD", key: "coverImage", value: null });
  };

  return (
    <section
      className="panel is-active"
      data-panel="description"
      role="tabpanel"
    >
      <PanelHeader
        stepNumber={stepNumber("description")}
        totalSteps={stepCount}
        title="Describe your event"
        subtitle="Sell the experience. Great events start with a great story."
      />

      {/* ---- Cover image ---- */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-ink-900 mb-2">
          Cover image
        </label>
        <p className="text-xs text-ink-500 mb-3">
          This is the first thing attendees see. Ideal size 1100 × 500px.
        </p>

        <div className="relative rounded-2xl overflow-hidden border border-ink-200 bg-ink-100 aspect-[11/5] group">
          {state.coverImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element --
                  Local blob URLs and remote URLs both work with a plain
                  img tag; Next/Image isn't well-suited to either case
                  here (no known dimensions, no CDN routing). */}
              <img
                src={imageSrc(state.coverImage)}
                alt="Event cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={onPickCover}
                  className="px-3 py-2 text-xs font-semibold text-ink-900 bg-white/95 hover:bg-white rounded-lg transition"
                >
                  <i className="fa-solid fa-upload mr-1.5" aria-hidden />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onCoverRemove}
                  className="px-3 py-2 text-xs font-semibold text-white bg-red-500/90 hover:bg-red-600 rounded-lg transition"
                >
                  <i className="fa-solid fa-trash mr-1.5" aria-hidden />
                  Remove
                </button>
              </div>
              {coverBusy && (
                <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center pointer-events-none">
                  <i
                    className="fa-solid fa-spinner fa-spin text-white text-2xl"
                    aria-hidden
                  />
                </div>
              )}
              {/* "Pending upload" pill - only shown for locals so the
                  user knows the image isn't on the server yet. */}
              {state.coverImage.kind === "local" && !coverBusy && (
                <span className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase tracking-wider font-semibold bg-ink-900/80 text-white rounded">
                  Pending upload
                </span>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onPickCover}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-500 hover:bg-gold-50 hover:text-gold-700 transition"
            >
              <i className="fa-solid fa-image text-3xl" aria-hidden />
              <span className="text-sm font-semibold">Add cover image</span>
              <span className="text-xs">Recommended 1100 × 500px</span>
            </button>
          )}
        </div>

        {/* Hidden file input shared by the Add and Replace buttons. */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onCoverFile}
        />

        {coverError && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {coverError}
          </p>
        )}
      </div>

      {/* ---- Description with toolbar ---- */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-2 gap-3">
          <label
            htmlFor="f-desc"
            className="block text-sm font-semibold text-ink-900"
          >
            About this event
          </label>
          {/* <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 border border-gold-200 rounded-lg transition shrink-0"
            // Decorative for now - AI generation comes later.
            disabled
            title="AI generation - coming soon"
          >
            <span className="ai-sparkle">✨</span>
            Generate with AI
          </button> */}
        </div>

        {/* WYSIWYG editor for the description. The shared
            EditorTextarea component handles the toolbar + content
            area + state sync. */}
        <EditorTextarea
          id="f-desc"
          value={state.description}
          onChange={(value) =>
            dispatch({
              type: "SET_FIELD",
              key: "description",
              value,
            })
          }
          placeholder="Tell attendees what makes this event special…"
          minHeight={170}
        />
      </div>

      {/* ---- Contact & links ---- */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-ink-900 mb-1">
          Contact &amp; links
        </h3>
        <p className="text-xs text-ink-500 mb-4">
          Public contact info and social profiles for this event.
        </p>

        <div className="space-y-3">
          <IconInput
            icon="fa-solid fa-globe"
            type="url"
            placeholder="Website URL"
            value={state.websiteUrl}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "websiteUrl", value })
            }
          />
          <IconInput
            icon="fa-regular fa-envelope"
            type="email"
            placeholder="Public email address"
            value={state.publicEmail}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "publicEmail", value })
            }
          />
          <IconInput
            icon="fa-solid fa-phone"
            type="tel"
            placeholder="Public phone number"
            value={state.publicPhone}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "publicPhone", value })
            }
          />
          <IconInput
            icon="fa-brands fa-facebook-f"
            type="url"
            placeholder="Facebook page URL"
            value={state.facebookUrl}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "facebookUrl", value })
            }
          />
          <IconInput
            icon="fa-brands fa-instagram"
            type="url"
            placeholder="Instagram profile URL"
            value={state.instagramUrl}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "instagramUrl", value })
            }
          />
          <IconInput
            icon="fa-brands fa-tiktok"
            type="url"
            placeholder="TikTok profile URL"
            value={state.tiktokUrl}
            onChange={(value) =>
              dispatch({ type: "SET_FIELD", key: "tiktokUrl", value })
            }
          />
        </div>
      </div>

      {/* ---- Desktop nav row. Mobile uses the sticky bottom bar. ---- */}
      <div className="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button
          type="button"
          onClick={() => prev && goTo(prev)}
          className="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden /> Back
        </button>
        <button
          type="button"
          onClick={() => next && goTo(next)}
          className="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2"
        >
          Continue <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
        </button>
      </div>
    </section>
  );
}

// ============================================================
// Internal: input with a leading icon. Used 6× in this panel.
// ============================================================

function IconInput({
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  icon: string;
  type: "url" | "email" | "tel";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <i
        className={`${icon} absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center pointer-events-none`}
        aria-hidden
      />
      <input
        type={type}
        className="input"
        style={{ paddingLeft: 44 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
