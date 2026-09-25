"use client";

import { useRef, useState } from "react";

import { useEventCreate } from "@/context/EventCreateContext";
import { useEventRegion } from "@/lib/useEventSteps";
import {
  imageSrc,
  makeLocalImage,
  needsServerDelete,
  revokeIfLocal,
} from "@/lib/editorImage";
import { useUploadEventImage, useRemoveEventImage } from "@/lib/imageMutations";
import { ApiError } from "@/lib/apiClient";

/**
 * Event logo - optional. Printed at the top of every ticket and shown at
 * the top of the checkout and the show car / car club / trader
 * application forms. Lives on the Description step, under the cover
 * image, so every event can have one (it used to be a Tickets-step
 * field that only CarEvents-ticketed events saw).
 *
 * Stored as the event's `ticket_logo` media slot - the name the API and
 * ticket PDFs already use - so nothing server-side changed when it moved.
 *
 * Uploads on pick (rather than deferring to the event save) so the
 * panel can show the real hosted image straight away, matching how
 * the gallery behaves. Needs a saved event first: the upload endpoint
 * attaches the image to an event id, so before the draft exists there
 * is nothing to attach to.
 */
export function EventLogoField() {
  const { state, dispatch } = useEventCreate();
  const upload = useUploadEventImage();
  const remove = useRemoveEventImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const eid = state.encryptedId;
  // The region the eid resolves against. The image confirm step writes
  // this to the DB, so it has to match the event.
  const site = useEventRegion().key;
  const logo = state.ticketLogo;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!eid) {
      setError(
        "Save the event basics first so we know which event to attach the logo to.",
      );
      return;
    }

    // Show the local preview immediately, then swap in the hosted
    // image once Cloudflare confirms.
    const local = makeLocalImage(file);
    dispatch({ type: "SET_FIELD", key: "ticketLogo", value: local });

    try {
      const image = await upload.mutateAsync({
        eid,
        site,
        file,
        mediaGroup: "ticket_logo",
      });
      dispatch({
        type: "SET_FIELD",
        key: "ticketLogo",
        value: { kind: "remote", url: image.url, cloudflareId: image.id },
      });
    } catch (err) {
      dispatch({ type: "SET_FIELD", key: "ticketLogo", value: null });
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed.",
      );
    } finally {
      revokeIfLocal(local);
    }
  };

  const handleRemove = async () => {
    setError(null);
    const current = logo;
    dispatch({ type: "SET_FIELD", key: "ticketLogo", value: null });
    revokeIfLocal(current);
    // Only Cloudflare-backed images need a server-side delete; a local
    // one that never uploaded is gone the moment we drop it, and a
    // WordPress attachment isn't ours to delete.
    if (eid && current && needsServerDelete(current)) {
      try {
        await remove.mutateAsync({ eid, site, mediaId: current.cloudflareId });
      } catch {
        // The logo is already detached in the editor; a failed cleanup
        // just leaves an orphan in Cloudflare, which isn't worth
        // interrupting the user for.
      }
    }
  };

  return (
    <div className="bg-white border border-ink-200 rounded-xl p-4 mb-4">
      <label className="block text-sm font-semibold text-ink-900 mb-2">
        Event logo{" "}
        <span className="text-ink-400 font-normal">(optional)</span>
      </label>
      <p className="text-xs text-ink-500 mb-3">
        Shown at the top of your tickets, the checkout and the show car,
        car club and trader application forms. A square or wide logo on a
        transparent background works best.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handlePick(e.target.files?.[0]);
          // Reset so picking the same file twice still fires onChange.
          e.target.value = "";
        }}
      />

      {logo ? (
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 shrink-0 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(logo)}
              alt="Event logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="px-4 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 disabled:opacity-50 rounded-lg transition"
            >
              {upload.isPending ? "Uploading..." : "Replace logo"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={upload.isPending}
              className="px-4 py-2 text-sm font-semibold text-ink-500 hover:text-red-600 disabled:opacity-50 transition text-left"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full py-6 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 disabled:opacity-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex flex-col items-center justify-center gap-2"
        >
          <i className="fa-solid fa-image text-lg" aria-hidden />
          {upload.isPending ? "Uploading..." : "Upload event logo"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
