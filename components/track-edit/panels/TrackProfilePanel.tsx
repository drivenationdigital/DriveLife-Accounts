"use client";

import { useTrackEdit } from "@/context/TrackEditContext";
import { CoverImageField, IconTextField, LogoImageField } from "../shared";

/**
 * Step 2 - cover, logo, and the track's contact/social details.
 *
 * Laid out like the event editor's Description step: a large cover
 * preview at the shape the public page uses, the logo card under it,
 * then a "Contact & links" block of icon-led inputs.
 *
 * Images upload immediately on pick (Cloudflare direct upload, recorded
 * server-side), so they're independent of the track save.
 */
export function TrackProfilePanel() {
  const { track, set, pickImage, uploadProgress, uploadError } = useTrackEdit();

  return (
    <div>
      <CoverImageField
        label="Cover image"
        hint="This is the first thing visitors see. Ideal size 1100 × 500px."
        previewUrl={track.cover}
        percent={uploadProgress.cover}
        error={uploadError.cover}
        onPick={(file, url) => pickImage("cover", file, url)}
      />

      <LogoImageField
        label="Track logo"
        hint="Shown beside the track name on its page and in listings. A square logo works best - ideal size 800 × 800px."
        uploadLabel="Upload track logo"
        previewUrl={track.logo}
        percent={uploadProgress.logo}
        error={uploadError.logo}
        onPick={(file, url) => pickImage("logo", file, url)}
      />

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-ink-900 mb-1">
          Contact &amp; links
        </h3>
        <p className="text-xs text-ink-500 mb-4">
          Public contact details and social profiles for this track. All
          optional.
        </p>

        <div className="space-y-3">
          <IconTextField
            field="website"
            icon="fa-solid fa-globe"
            placeholder="Website URL"
          />
          <IconTextField
            field="email"
            icon="fa-regular fa-envelope"
            placeholder="Track email address"
            type="email"
          />
          <IconTextField
            field="phone"
            icon="fa-solid fa-phone"
            placeholder="Track phone number"
            type="tel"
          />
          <IconTextField
            field="facebook"
            icon="fa-brands fa-facebook-f"
            placeholder="Facebook page URL"
          />
          <IconTextField
            field="instagram"
            icon="fa-brands fa-instagram"
            placeholder="Instagram username"
            onBlur={() => {
              // Normalise the handle on blur: drop any leading @.
              const cleaned = track.instagram.trim().replace(/^@+/, "");
              if (cleaned !== track.instagram) set("instagram", cleaned);
            }}
          />
        </div>
      </div>
    </div>
  );
}
