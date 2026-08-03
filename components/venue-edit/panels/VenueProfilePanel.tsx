"use client";

import { useVenueEdit } from "@/context/VenueEditContext";
import {
  FieldLabel,
  ImageUploadRow,
  TextField,
  UploadStatus,
  inputCls,
} from "../shared";

/**
 * Step 2 - logo, cover, and the venue's contact/social details.
 *
 * Images upload immediately on pick (straight to Cloudflare via the app's
 * chunked endpoint, saved server-side), so they're independent of the
 * Update Venue save. The local object-URL preview shows instantly; the
 * stored Cloudflare URL replaces it when the record refetches.
 */
export function VenueProfilePanel() {
  const { venue, set, pickImage, uploadProgress, uploadError } = useVenueEdit();

  return (
    <div>
      <div className="mb-6">
        <ImageUploadRow
          title="Venue logo"
          hint="Ideal size: 800px x 800px"
          previewUrl={venue.logo}
          onPick={(file, url) => pickImage("logo", file, url)}
        />
        <UploadStatus percent={uploadProgress.logo} error={uploadError.logo} />
      </div>

      <div className="mb-8">
        <ImageUploadRow
          title="Venue cover image"
          description="Add an image that best represents your venue."
          hint="Ideal size: 1100px (width) x 500px (height)"
          previewUrl={venue.cover}
          onPick={(file, url) => pickImage("cover", file, url)}
        />
        <UploadStatus
          percent={uploadProgress.cover}
          error={uploadError.cover}
        />
      </div>

      <TextField
        field="email"
        label="Venue email address"
        hint="In case anyone wants to contact the venue directly"
        type="email"
      />

      {/* Phone has no validation rule, so it doesn't need TextField's
          touched/error plumbing. */}
      <div className="mb-8">
        <FieldLabel>Venue phone number</FieldLabel>
        <input
          className={inputCls}
          value={venue.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
        />
      </div>

      <TextField field="website" label="Venue website" placeholder="example.com" />

      <TextField
        field="facebook"
        label="Facebook page URL"
        placeholder="facebook.com/yourvenue"
      />

      <TextField
        field="instagram"
        label="Instagram username"
        placeholder="yourvenue"
        onBlur={() => {
          // Normalise the handle on blur: drop any leading @.
          const cleaned = venue.instagram.trim().replace(/^@+/, "");
          if (cleaned !== venue.instagram) set("instagram", cleaned);
        }}
      />
    </div>
  );
}
