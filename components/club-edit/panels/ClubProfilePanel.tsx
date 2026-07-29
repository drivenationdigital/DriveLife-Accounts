"use client";

import { useState } from "react";
import { useClubEdit } from "@/context/ClubEditContext";
import { useUploadClubImage, type ClubMediaGroup } from "@/lib/clubImages";
import { FieldLabel, Divider, ImageUploadRow, inputCls } from "../shared";

/**
 * Step 2 — logo, cover, and the club's contact/social links.
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

  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

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
    <div className="mb-8 space-y-6">
      <div>
        <ImageUploadRow
          title="Club logo"
          hint="Ideal size: 800px x 800px"
          previewUrl={club.logo?.url ?? null}
          onPick={(file, url) => handlePick("logo", file, url)}
        />
        <UploadStatus percent={progress.logo} error={errors.logo} />
      </div>

      <div>
        <ImageUploadRow
          title="Club cover image"
          description="Add an image that best represents your club."
          hint="Ideal size: 1100px (width) x 500px (height)"
          previewUrl={club.coverImage?.url ?? null}
          onPick={(file, url) => handlePick("cover", file, url)}
        />
        <UploadStatus percent={progress.cover} error={errors.cover} />
      </div>

      <Divider />

      <div>
        <FieldLabel hint="In case anyone wants to contact the club directly">
          Club email address
        </FieldLabel>
        <input
          className={inputCls}
          type="email"
          value={club.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </div>
      <div>
        <FieldLabel>Club website</FieldLabel>
        <input
          className={inputCls}
          value={club.website}
          onChange={(e) => setField("website", e.target.value)}
          placeholder="example.com"
        />
      </div>
      <div>
        <FieldLabel>Facebook page</FieldLabel>
        <input
          className={inputCls}
          value={club.facebook}
          onChange={(e) => setField("facebook", e.target.value)}
          placeholder="facebook.com/yourclub"
        />
      </div>
      <div>
        <FieldLabel>Instagram username</FieldLabel>
        <input
          className={inputCls}
          value={club.instagram}
          onChange={(e) => setField("instagram", e.target.value)}
          placeholder="yourclub"
        />
      </div>
      <div>
        <FieldLabel hint="If you sell club clothing or merch online, enter the link here">
          Club merchandise link
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
        <div
          className="h-full rounded-full bg-gold-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">Uploading… {percent}%</p>
    </div>
  );
}
