"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import {
  useEventCreate,
  type EditorImage,
} from "@/context/EventCreateContext";
import {
  EVENT_CREATE_STEP_COUNT,
  adjacentSteps,
} from "@/lib/eventCreateSteps";
import {
  imageSrc,
  makeLocalImage,
  revokeIfLocal,
} from "@/lib/editorImage";
import {
  useUploadEventImage,
  useRemoveEventImage,
} from "@/lib/imageMutations";
import { ApiError } from "@/lib/apiClient";

import { PanelHeader } from "../PanelHeader";

/**
 * Step 4 of the wizard.
 *
 * Three pieces:
 *
 *   1. Tile grid - gallery images at 3 cols (mobile/tablet) → 4 cols
 *      (lg+). Each tile has hover overlays:
 *        · keyboard chevrons for reorder
 *        · red X to remove
 *      A "Pending" pill marks tiles whose files haven't been
 *      uploaded to the server yet (kind === "local"). The save flow
 *      handles the upload step.
 *
 *   2. Dropzone - accepts both clicks (opens file picker) and
 *      file-drag drops. Selected files become local EditorImages.
 *
 *   3. Drag-to-reorder for tile reordering - uses native HTML5 DnD.
 *      Distinct from the file-drag drop on the dropzone.
 *
 * Lifecycle: local images carry a blob URL that needs revoking when
 * the image is removed or replaced. We revoke individually on
 * remove and bulk-revoke on unmount.
 */
export function GalleryPanel() {
  const { state, dispatch } = useEventCreate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { prev, next } = adjacentSteps("gallery");

  const goTo = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // Upload + remove plumbing.
  //
  // When files are picked, they enter state as `local` immediately
  // (instant preview). For each one we kick off the three-step CF
  // direct upload in the background; on success the local entry is
  // swapped for `remote { url, cloudflareId }` in place. On failure
  // the local is removed and an error message is surfaced inline.
  //
  // We track per-tile upload state in a Map keyed by previewUrl -
  // the blob URL is unique per local image so it's a stable id even
  // as the gallery array gets re-spliced for reorders.
  // ============================================================
  const upload = useUploadEventImage();
  const remover = useRemoveEventImage();
  const eid = state.encryptedId;

  const [uploadingKeys, setUploadingKeys] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // galleryRef captures the latest gallery so async upload callbacks
  // can mutate against current state instead of the snapshot captured
  // when the upload was kicked off. Mirrors the cleanup ref further
  // down.
  const liveGalleryRef = useRef(state.gallery);
  liveGalleryRef.current = state.gallery;

  const markUploading = (key: string, on: boolean) => {
    setUploadingKeys((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const errorText = (err: unknown): string =>
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : "Upload failed.";

  const startUpload = async (local: EditorImage & { kind: "local" }) => {
    if (!eid) {
      setUploadErrors((p) => [
        ...p,
        `${local.file.name}: save the event basics first so we know where to attach the image.`,
      ]);
      // Drop the local entry - leaving it would imply success.
      dispatch({
        type: "SET_GALLERY",
        items: liveGalleryRef.current.filter((i) => i !== local),
      });
      revokeIfLocal(local);
      return;
    }
    markUploading(local.previewUrl, true);
    try {
      const image = await upload.mutateAsync({
        eid,
        file: local.file,
        mediaGroup: "gallery",
      });
      // Swap this specific local for the returned remote. Find by
      // identity (the local object itself), not index - the gallery
      // may have been reordered while the upload was in flight.
      const remote: EditorImage = {
        kind: "remote",
        url: image.url,
        cloudflareId: image.id,
      };
      dispatch({
        type: "SET_GALLERY",
        items: liveGalleryRef.current.map((i) => (i === local ? remote : i)),
      });
      revokeIfLocal(local);
    } catch (err) {
      // Remove the failed local + surface the error so the user
      // knows it didn't take.
      dispatch({
        type: "SET_GALLERY",
        items: liveGalleryRef.current.filter((i) => i !== local),
      });
      revokeIfLocal(local);
      setUploadErrors((p) => [...p, `${local.file.name}: ${errorText(err)}`]);
    } finally {
      markUploading(local.previewUrl, false);
    }
  };

  // ---- File input plumbing ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverDropzone, setDragOverDropzone] = useState(false);

  const acceptFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const images = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map(makeLocalImage);
    if (images.length === 0) return;
    dispatch({
      type: "SET_GALLERY",
      items: [...state.gallery, ...images],
    });
    // Kick off the upload pipeline for each new local. Each call
    // resolves independently so a slow one doesn't block the others.
    for (const img of images) {
      if (img.kind === "local") startUpload(img);
    }
  };

  const onPick = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
    e.target.value = "";
  };

  const onDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDropzone(false);
    acceptFiles(e.dataTransfer.files);
  };
  const onDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOverDropzone) setDragOverDropzone(true);
  };
  const onDropzoneDragLeave = () => setDragOverDropzone(false);

  // ---- Tile DnD reorder (separate from the file-drop above) ----
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const onTileDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/x-gallery-reorder", String(idx));
  };
  const onTileDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropIdx !== idx) setDropIdx(idx);
  };
  const onTileDragEnd = () => {
    setDragIdx(null);
    setDropIdx(null);
  };
  const onTileDrop = (targetIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      onTileDragEnd();
      return;
    }
    const next = [...state.gallery];
    const [moved] = next.splice(dragIdx, 1);
    if (moved !== undefined) {
      next.splice(targetIdx, 0, moved);
      dispatch({ type: "SET_GALLERY", items: next });
    }
    onTileDragEnd();
  };

  // ---- Mutations ----
  const removeTile = async (idx: number) => {
    const removed = state.gallery[idx];
    if (!removed) return;

    // For CF-backed images (uploaded through this flow), delete from
    // server first and only remove from local state on success - so a
    // server-side failure leaves the tile visible with an error
    // message rather than silently vanishing.
    if (removed.kind === "remote" && removed.cloudflareId && eid) {
      try {
        await remover.mutateAsync({ eid, mediaId: removed.cloudflareId });
      } catch (err) {
        setUploadErrors((p) => [...p, `Couldn't remove image: ${errorText(err)}`]);
        return;
      }
    }

    revokeIfLocal(removed); // free the blob URL if it was local
    dispatch({
      type: "SET_GALLERY",
      items: liveGalleryRef.current.filter((_, i) => i !== idx),
    });
  };
  const moveTile = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= state.gallery.length) return;
    const next = [...state.gallery];
    const a = next[idx];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[idx] = b;
    next[target] = a;
    dispatch({ type: "SET_GALLERY", items: next });
  };

  // ---- Cleanup on unmount ----
  // Revoke any local blob URLs still in state when the panel
  // unmounts. The galleryRef captured here is intentionally
  // mutable - we want whatever's in state at unmount, not the
  // value at first render.
  const galleryRef = useRef(state.gallery);
  galleryRef.current = state.gallery;
  useEffect(() => {
    return () => {
      for (const img of galleryRef.current) {
        revokeIfLocal(img);
      }
    };
  }, []);

  return (
    <section className="panel is-active" data-panel="gallery" role="tabpanel">
      <PanelHeader
        stepNumber={4}
        totalSteps={EVENT_CREATE_STEP_COUNT}
        title="Event gallery"
        subtitle="Showcase previous years or the atmosphere. Drag to reorder, click to remove."
      />

      {uploadErrors.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <ul className="flex-1 text-xs text-red-700 space-y-0.5">
              {uploadErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setUploadErrors([])}
              className="text-xs font-semibold text-red-700 hover:text-red-900 shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ---- Tile grid ---- */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {state.gallery.map((img, idx) => {
          const isDragging = dragIdx === idx;
          const isDropTarget = dropIdx === idx && dragIdx !== idx;
          const isUploading =
            img.kind === "local" && uploadingKeys.has(img.previewUrl);
          const tileClasses = [
            "gallery-tile border border-ink-200 cursor-grab",
            isDragging && "opacity-40",
            isDropTarget && "ring-2 ring-gold-500",
          ]
            .filter(Boolean)
            .join(" ");
          const stableKey =
            img.kind === "remote" ? img.url : img.previewUrl;
          return (
            <div
              key={stableKey}
              className={tileClasses}
              draggable
              onDragStart={onTileDragStart(idx)}
              onDragOver={onTileDragOver(idx)}
              onDragEnd={onTileDragEnd}
              onDrop={onTileDrop(idx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element --
                  Both blob URLs (locals) and remote URLs work fine
                  with a plain <img>. */}
              <img
                src={imageSrc(img)}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center pointer-events-none">
                  <i
                    className="fa-solid fa-spinner fa-spin text-white text-lg"
                    aria-hidden
                  />
                </div>
              )}
              {img.kind === "local" && !isUploading && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-ink-900/80 text-white rounded">
                  Pending
                </span>
              )}
              <div className="tile-actions flex gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveTile(idx, -1)}
                    aria-label="Move left"
                    className="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden />
                  </button>
                )}
                {idx < state.gallery.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveTile(idx, 1)}
                    aria-label="Move right"
                    className="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeTile(idx)}
                  aria-label="Remove image"
                  className="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add tile - quick way to add more without scrolling. */}
        <button
          type="button"
          onClick={onPick}
          className="dropzone flex flex-col items-center justify-center text-center p-4 gap-2 aspect-square"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-ink-200 flex items-center justify-center text-gold-600">
            <i className="fa-solid fa-plus" aria-hidden />
          </div>
          <p className="text-xs font-medium text-ink-700">Add photos</p>
        </button>
      </div>

      {/* ---- Dropzone (click or drag-and-drop files) ---- */}
      <button
        type="button"
        onClick={onPick}
        onDragOver={onDropzoneDragOver}
        onDragLeave={onDropzoneDragLeave}
        onDrop={onDropFiles}
        className={[
          "dropzone w-full flex flex-col items-center justify-center text-center py-10 px-6 cursor-pointer",
          dragOverDropzone && "border-gold-500 bg-gold-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="w-14 h-14 rounded-full bg-white border border-ink-200 flex items-center justify-center text-gold-600 mb-3">
          <i className="fa-solid fa-cloud-arrow-up text-lg" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-ink-900 mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-ink-500">JPG, PNG or GIF · Max 10MB each</p>
      </button>

      {/* Hidden multi-select file input. accept="image/*" lets mobile
          show camera + photo library options on iOS/Android. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

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
