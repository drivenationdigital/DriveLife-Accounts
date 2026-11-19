"use client";

import { useVenueEdit } from "@/context/VenueEditContext";
import { CoverImageField, IconTextField, LogoImageField } from "../shared";

/**
 * Step 2 - cover, logo, and the venue's contact/social details.
 *
 * Laid out like the event editor's Description step: a large cover
 * preview at the shape the public page uses, the logo card under it,
 * then a "Contact & links" block of icon-led inputs.
 *
 * Images upload immediately on pick (straight to Cloudflare via the app's
 * chunked endpoint, saved server-side), so they're independent of the
 * venue save. The local object-URL preview shows instantly; the stored
 * Cloudflare URL replaces it when the record refetches.
 */
export function VenueProfilePanel() {
  const { venue, set, pickImage, uploadProgress, uploadError } = useVenueEdit();

  return (
    <div>
      <CoverImageField
        label="Cover image"
        hint="This is the first thing visitors see. Ideal size 1100 × 500px."
        previewUrl={venue.cover}
        percent={uploadProgress.cover}
        error={uploadError.cover}
        onPick={(file, url) => pickImage("cover", file, url)}
      />

      <LogoImageField
        label="Venue logo"
        hint="Shown beside the venue name on its page and in listings. A square logo works best - ideal size 800 × 800px."
        uploadLabel="Upload venue logo"
        previewUrl={venue.logo}
        percent={uploadProgress.logo}
        error={uploadError.logo}
        onPick={(file, url) => pickImage("logo", file, url)}
      />

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-ink-900 mb-1">
          Contact &amp; links
        </h3>
        <p className="text-xs text-ink-500 mb-4">
          Public contact details and social profiles for this venue. All
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
            placeholder="Venue email address"
            type="email"
          />
          <IconTextField
            field="phone"
            icon="fa-solid fa-phone"
            placeholder="Venue phone number"
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
              const cleaned = venue.instagram.trim().replace(/^@+/, "");
              if (cleaned !== venue.instagram) set("instagram", cleaned);
            }}
          />
        </div>
      </div>
    </div>
  );
}
