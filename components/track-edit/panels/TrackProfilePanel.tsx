"use client";

import { useTrackEdit } from "@/context/TrackEditContext";
import {
  FieldLabel,
  ImageUploadRow,
  TextField,
  UploadStatus,
  inputCls,
} from "../shared";

/**
 * Step 2 - logo, cover, and the track's contact/social details.
 *
 * Images upload immediately on pick (Cloudflare direct upload, recorded
 * server-side), so they're independent of the Update Track save.
 */
export function TrackProfilePanel() {
  const { track, set, pickImage, uploadProgress, uploadError } = useTrackEdit();

  return (
    <div>
      <div className="mb-6">
        <ImageUploadRow
          title="Track logo"
          hint="Ideal size: 800px x 800px"
          previewUrl={track.logo}
          onPick={(file, url) => pickImage("logo", file, url)}
        />
        <UploadStatus percent={uploadProgress.logo} error={uploadError.logo} />
      </div>

      <div className="mb-8">
        <ImageUploadRow
          title="Track cover image"
          description="Add an image that best represents the track."
          hint="Ideal size: 1100px (width) x 500px (height)"
          previewUrl={track.cover}
          onPick={(file, url) => pickImage("cover", file, url)}
        />
        <UploadStatus
          percent={uploadProgress.cover}
          error={uploadError.cover}
        />
      </div>

      <TextField
        field="email"
        label="Track email address"
        hint="Shown publicly, in case anyone wants to contact the track directly"
        type="email"
      />

      <div className="mb-8">
        <FieldLabel>Track phone number</FieldLabel>
        <input
          className={inputCls}
          value={track.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
        />
      </div>

      <TextField field="website" label="Track website" placeholder="example.com" />

      <TextField
        field="facebook"
        label="Facebook page URL"
        placeholder="facebook.com/yourtrack"
      />

      <TextField
        field="instagram"
        label="Instagram username"
        placeholder="yourtrack"
        onBlur={() => {
          const cleaned = track.instagram.trim().replace(/^@+/, "");
          if (cleaned !== track.instagram) set("instagram", cleaned);
        }}
      />
    </div>
  );
}
