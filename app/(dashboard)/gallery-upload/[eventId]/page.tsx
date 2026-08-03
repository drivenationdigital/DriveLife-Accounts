"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  uploadSingle,
  registerGalleryImages,
  type UploadItem,
} from "@/lib/galleryUpload";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
const MAX_CONCURRENT = 4; // parallel uploads - kind to the browser + CF

export default function GalleryUploadPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId ?? "";

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [registeredCount, setRegisteredCount] = useState<number | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    setRegisteredCount(null);
    setBatchError(null);
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued" as const,
      })),
    ]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    setItems([]);
    setRegisteredCount(null);
    setBatchError(null);
  }, [items]);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...next } : it)),
    );
  }, []);

  const counts = useMemo(() => {
    const done = items.filter((i) => i.status === "done").length;
    const errored = items.filter((i) => i.status === "error").length;
    const pending = items.filter(
      (i) => i.status === "queued" || i.status === "uploading",
    ).length;
    return { done, errored, pending, total: items.length };
  }, [items]);

  const startUpload = useCallback(async () => {
    if (!eventId || isUploading) return;
    const queue = items.filter(
      (i) => i.status === "queued" || i.status === "error",
    );
    if (queue.length === 0) return;

    setIsUploading(true);
    setBatchError(null);
    setRegisteredCount(null);

    // Upload with bounded concurrency, collecting CF ids as we go.
    const uploadedIds: string[] = [];
    let cursor = 0;

    const worker = async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        patch(item.id, { status: "uploading", error: undefined });
        try {
          const imageId = await uploadSingle(eventId, item.file);
          uploadedIds.push(imageId);
          patch(item.id, { status: "uploaded", imageId });
        } catch (err) {
          patch(item.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, worker),
    );

    // Register everything that made it to Cloudflare.
    if (uploadedIds.length > 0) {
      setItems((prev) =>
        prev.map((it) =>
          it.status === "uploaded" ? { ...it, status: "registering" } : it,
        ),
      );
      try {
        const res = await registerGalleryImages(eventId, uploadedIds);
        setRegisteredCount(res.count);
        setItems((prev) =>
          prev.map((it) =>
            it.status === "registering" ? { ...it, status: "done" } : it,
          ),
        );
      } catch (err) {
        setBatchError(
          err instanceof Error
            ? err.message
            : "Images uploaded but registration failed.",
        );
        // Roll back to uploaded so the user can retry registration.
        setItems((prev) =>
          prev.map((it) =>
            it.status === "registering" ? { ...it, status: "uploaded" } : it,
          ),
        );
      }
    }

    setIsUploading(false);
  }, [eventId, isUploading, items, patch]);

  const hasQueued = items.some(
    (i) => i.status === "queued" || i.status === "error",
  );

  return (
    <div className="gallery-upload">
      <header className="gu-header">
        <p className="gu-eyebrow">Photographer upload</p>
        <h1 className="gu-title">Add photos to the event gallery</h1>
        <p className="gu-lede">
          Drag in your shots or browse to select. Photos upload straight to our
          image host, then appear in the event’s community gallery.
        </p>
      </header>

      {/* Dropzone */}
      <div
        className={`gu-dropzone${dragActive ? " active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same files
          }}
        />
        <div className="gu-dropzone-icon" aria-hidden>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="gu-dropzone-text">
          <strong>Drop photos here</strong> or click to browse
        </div>
        <div className="gu-dropzone-hint">JPG, PNG, WebP or HEIC</div>
      </div>

      {/* Summary bar */}
      {items.length > 0 && (
        <div className="gu-summary">
          <div className="gu-summary-counts">
            {counts.total} selected
            {counts.done > 0 && ` · ${counts.done} done`}
            {counts.errored > 0 && ` · ${counts.errored} failed`}
          </div>
          <div className="gu-summary-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearAll}
              disabled={isUploading}
              style={{ justifyContent: "center" }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={startUpload}
              disabled={isUploading || !hasQueued || !eventId}
              style={{
                justifyContent: "center",
                background: "var(--gold-deep, #bd7420)",
                color: "#fff",
                border: "1px solid var(--gold-deep, #bd7420)",
              }}
            >
              {isUploading
                ? "Uploading…"
                : `Upload ${counts.pending + counts.errored} photo${
                    counts.pending + counts.errored === 1 ? "" : "s"
                  }`}
            </button>
          </div>
        </div>
      )}

      {registeredCount !== null && !batchError && (
        <div className="gu-banner success">
          {registeredCount} photo{registeredCount === 1 ? "" : "s"} added to the
          gallery.
        </div>
      )}
      {batchError && <div className="gu-banner error">{batchError}</div>}

      {/* Thumbnail grid */}
      {items.length > 0 && (
        <div className="gu-grid">
          {items.map((item) => (
            <div key={item.id} className={`gu-tile status-${item.status}`}>
              <img src={item.previewUrl} alt="" className="gu-tile-img" />
              <div className="gu-tile-overlay">
                <StatusBadge item={item} />
              </div>
              {(item.status === "queued" || item.status === "error") &&
                !isUploading && (
                  <button
                    type="button"
                    className="gu-tile-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ item }: { item: UploadItem }) {
  switch (item.status) {
    case "uploading":
    case "registering":
      return <span className="gu-badge working">●</span>;
    case "uploaded":
      return <span className="gu-badge working">◐</span>;
    case "done":
      return <span className="gu-badge done">✓</span>;
    case "error":
      return (
        <span className="gu-badge error" title={item.error}>
          !
        </span>
      );
    default:
      return null;
  }
}
