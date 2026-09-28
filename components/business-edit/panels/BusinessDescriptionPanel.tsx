"use client";

import { useRef, useState } from "react";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import { EditorTextarea } from "@/components/event-create/EditorTextarea";
import { FieldLabel, textareaCls } from "../shared";

/**
 * Step 3 - description (WYSIWYG), opening hours and the gallery.
 *
 * Gallery tiles follow the event editor's GalleryPanel: uploads start
 * the moment files are picked, chevrons reorder, the red X removes
 * (server-side first for uploaded images). The order is persisted with
 * the next Update Business save.
 */
export function BusinessDescriptionPanel() {
  const {
    business,
    set,
    addGalleryFiles,
    removeGalleryItem,
    moveGalleryItem,
    galleryUploading,
    galleryErrors,
    dismissGalleryErrors,
  } = useBusinessEdit();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addGalleryFiles(Array.from(files));
  };

  return (
    <div>
      <div className="mb-8">
        <FieldLabel>Tell customers about your business</FieldLabel>
        <EditorTextarea
          value={business.description}
          onChange={(value) => set("description", value)}
          placeholder="What you do, how long you've been doing it, the cars you specialise in, what to expect…"
        />
      </div>

      <div className="mb-10">
        <FieldLabel hint="One line per day, e.g. “Mon – Fri: 9am – 5:30pm”. Leave blank if it doesn't apply.">
          Opening hours
        </FieldLabel>
        <textarea
          className={textareaCls}
          rows={4}
          value={business.openingHours}
          onChange={(e) => set("openingHours", e.target.value)}
          placeholder={"Mon – Fri: 9am – 5:30pm\nSat: 9am – 1pm\nSun: Closed"}
        />
      </div>

      <div className="mb-4">
        <FieldLabel hint="Show off your work, your premises or your event stand. Drag the chevrons to reorder.">
          Gallery
        </FieldLabel>
      </div>

      {galleryErrors.length > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <ul className="flex-1 text-xs text-red-700 space-y-0.5">
              {galleryErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={dismissGalleryErrors}
              className="text-xs font-semibold text-red-700 hover:text-red-900 shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {business.gallery.map((img, idx) => {
          const isUploading =
            img.kind === "local" && galleryUploading.has(img.previewUrl);
          const key = img.kind === "remote" ? img.id : img.previewUrl;
          return (
            <div key={key} className="gallery-tile border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.kind === "remote" ? img.url : img.previewUrl}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center pointer-events-none">
                  <i className="fa-solid fa-spinner fa-spin text-white text-lg" aria-hidden />
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
                    onClick={() => moveGalleryItem(idx, -1)}
                    aria-label="Move left"
                    className="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden />
                  </button>
                )}
                {idx < business.gallery.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveGalleryItem(idx, 1)}
                    aria-label="Move right"
                    className="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removeGalleryItem(idx)}
                  aria-label="Remove image"
                  className="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"
                >
                  <i className="fa-solid fa-xmark" aria-hidden />
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="dropzone flex flex-col items-center justify-center text-center p-4 gap-2 aspect-square"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-ink-200 flex items-center justify-center text-gold-600">
            <i className="fa-solid fa-plus" aria-hidden />
          </div>
          <p className="text-xs font-medium text-ink-700">Add photos</p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptFiles(e.dataTransfer.files);
        }}
        className={[
          "dropzone w-full flex flex-col items-center justify-center text-center py-10 px-6 cursor-pointer mb-8",
          dragOver && "border-gold-500 bg-gold-50",
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          acceptFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
