"use client";

import { useState } from "react";
import { useClubEdit } from "@/context/ClubEditContext";
import {
  useUploadClubImage,
  useRemoveClubImage,
  type ClubMediaGroup,
} from "@/lib/clubImages";
import { FieldLabel, Divider, ImageUploadRow, inputCls } from "../shared";

/**
 * Step 2 - logo, cover, and the club's contact/social links.
 *
 * Images upload immediately on pick (they go straight to Cloudflare via
 * the app's chunked endpoint and are saved server-side), so they're
 * independent of the wizard's Update Club save. The local object-URL
 * preview shows instantly; the stored Cloudflare URL replaces it when
 * the club record refetches.
 */
export function ClubProfilePanel() {
  const { club, setField } = useClubEdit();
  const upload = useUploadClubImage();
  const remove = useRemoveClubImage();

  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleRemove = async (group: ClubMediaGroup) => {
    setErrors((e) => ({ ...e, [group]: null }));
    // Clear the preview optimistically, remembering it for rollback.
    const prev = group === "logo" ? club.logo : club.coverImage;
    if (group === "logo") setField("logo", null);
    else setField("coverImage", null);

    try {
      await remove.mutateAsync({
        clubId: club.encrypted_id,
        mediaGroup: group,
      });
    } catch (err) {
      // Restore the preview if the remove failed.
      if (group === "logo") setField("logo", prev);
      else setField("coverImage", prev);
      setErrors((e) => ({
        ...e,
        [group]:
          err instanceof Error ? err.message : "Couldn't remove that image.",
      }));
    }
  };

  const handlePick = async (
    group: ClubMediaGroup,
    file: File,
    previewUrl: string,
  ) => {
    // Show the local preview straight away.
    setField(group === "logo" ? "logo" : "coverImage", {
      id: null,
      url: previewUrl,
    });
    setErrors((e) => ({ ...e, [group]: null }));
    setProgress((p) => ({ ...p, [group]: 0 }));

    try {
      await upload.mutateAsync({
        clubId: club.encrypted_id,
        file,
        mediaGroup: group,
        onProgress: (percent) =>
          setProgress((p) => ({ ...p, [group]: percent })),
      });
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [group]:
          err instanceof Error ? err.message : "Couldn't upload that image.",
      }));
    } finally {
      setProgress((p) => {
        const next = { ...p };
        delete next[group];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <ImageUploadRow
          title="Club Logo"
          hint="Ideal size: 800px x 800px"
          previewUrl={club.logo?.url ?? null}
          onPick={(file, url) => handlePick("logo", file, url)}
        />
        <UploadStatus percent={progress.logo} error={errors.logo} />
        {club.logo?.url && progress.logo === undefined && (
          <RemoveImageButton
            onRemove={() => handleRemove("logo")}
            busy={remove.isPending}
          />
        )}
      </div>

      <div>
        <ImageUploadRow
          title="Club Cover Image"
          description="Add an image that best represents your club."
          hint="Ideal size: 1100px (width) x 500px (height)"
          previewUrl={club.coverImage?.url ?? null}
          onPick={(file, url) => handlePick("cover", file, url)}
        />
        <UploadStatus percent={progress.cover} error={errors.cover} />
        {club.coverImage?.url && progress.cover === undefined && (
          <RemoveImageButton
            onRemove={() => handleRemove("cover")}
            busy={remove.isPending}
          />
        )}
      </div>

      <Divider />

      <div>
        <FieldLabel hint="In case anyone wants to contact the club directly">
          Club Email Address
        </FieldLabel>
        <input
          className={inputCls}
          type="email"
          value={club.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Club Website</FieldLabel>
        <input
          className={inputCls}
          value={club.website}
          onChange={(e) => setField("website", e.target.value)}
          placeholder="example.com"
        />
      </div>
      <div>
        <FieldLabel>Facebook Page</FieldLabel>
        <input
          className={inputCls}
          value={club.facebook}
          onChange={(e) => setField("facebook", e.target.value)}
          placeholder="facebook.com/yourclub"
        />
      </div>
      <div>
        <FieldLabel>Instagram Username</FieldLabel>
        <input
          className={inputCls}
          value={club.instagram}
          onChange={(e) => setField("instagram", e.target.value)}
          placeholder="yourclub"
        />
      </div>
      <div>
        <FieldLabel hint="If you sell club clothing or merch online, enter the link here">
          Club Merchandise Link
        </FieldLabel>
        <input
          className={inputCls}
          value={club.merchandiseLink}
          onChange={(e) => setField("merchandiseLink", e.target.value)}
        />
      </div>
    </div>
  );
}

/** Progress bar / error line under an image row. */
function UploadStatus({
  percent,
  error,
}: {
  percent?: number;
  error?: string | null;
}) {
  if (error) {
    return <p className="mt-2 text-xs text-red-500">{error}</p>;
  }
  if (percent === undefined) return null;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-400">Uploading… {percent}%</p>
    </div>
  );
}

function RemoveImageButton({
  onRemove,
  busy,
}: {
  onRemove: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={busy}
      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 underline underline-offset-4 hover:text-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <i
        className={`text-xs ${busy ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}`}
        aria-hidden
      />
      {busy ? "Removing…" : "Remove image"}
    </button>
  );
}
