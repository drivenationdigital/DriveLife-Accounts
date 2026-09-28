"use client";

import { useBusinessEdit } from "@/context/BusinessEditContext";
import { LocationAutocomplete } from "@/components/event-create/LocationAutocomplete";
import { MapPreview } from "@/components/event-create/MapPreview";
import {
  FieldLabel,
  ImageUploadRow,
  TextField,
  UploadStatus,
  inputCls,
} from "../shared";

/**
 * Step 2 - logo, cover, address (with the "don't display" option) and
 * contact / social details.
 *
 * Images upload immediately on pick (Cloudflare direct upload, recorded
 * server-side), so they're independent of the Update Business save.
 */
export function BusinessProfilePanel() {
  const { business, set, pickImage, uploadProgress, uploadError } =
    useBusinessEdit();

  const coords =
    business.latitude && business.longitude
      ? { lat: Number(business.latitude), lng: Number(business.longitude) }
      : null;

  return (
    <div>
      <div className="mb-6">
        <ImageUploadRow
          title="Business logo"
          hint="Square works best. Ideal size: 800px x 800px"
          previewUrl={business.logo}
          onPick={(file, url) => pickImage("logo", file, url)}
          contain
        />
        <UploadStatus percent={uploadProgress.logo} error={uploadError.logo} />
      </div>

      <div className="mb-8">
        <ImageUploadRow
          title="Cover image"
          description="A wide image that best represents your business - your premises, your work, your stand."
          hint="Ideal size: 1100px (width) x 500px (height)"
          previewUrl={business.cover}
          onPick={(file, url) => pickImage("cover", file, url)}
        />
        <UploadStatus percent={uploadProgress.cover} error={uploadError.cover} />
      </div>

      {/* Address */}
      <div className="mb-8">
        <FieldLabel hint="Search for your premises. Mobile or home-based? Add your town and tick the box below.">
          Address
        </FieldLabel>
        <LocationAutocomplete
          value={business.address}
          countries={business.country ? business.country.toLowerCase() : ["gb", "us"]}
          onValueChange={(text) => set("address", text)}
          onPlacePicked={(place) => {
            set("address", place.address || place.name);
            set("latitude", String(place.coords.lat));
            set("longitude", String(place.coords.lng));
          }}
          placeholder="Search for the business address"
        />
        <MapPreview coords={coords} />

        <label className="cb-label mt-3">
          <input
            type="checkbox"
            checked={business.hideAddress}
            onChange={(e) => set("hideAddress", e.target.checked)}
          />
          <span className="cb-box" />
          <span className="cb-text">
            Don&apos;t display the address on the website
          </span>
        </label>
        <p className="text-xs text-ink-500 -mt-1">
          Your country is still shown, and the address helps place you in
          local searches.
        </p>
      </div>

      <TextField
        field="email"
        label="Business email address"
        hint="Shown on your profile so customers can get in touch"
        type="email"
      />

      <div className="mb-8">
        <FieldLabel>Business phone number</FieldLabel>
        <input
          className={inputCls}
          value={business.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
        />
      </div>

      <TextField field="website" label="Website" placeholder="example.com" />

      <TextField
        field="facebook"
        label="Facebook page URL"
        placeholder="facebook.com/yourbusiness"
      />

      <TextField
        field="instagram"
        label="Instagram username"
        placeholder="yourbusiness"
        onBlur={() => {
          const cleaned = business.instagram.trim().replace(/^@+/, "");
          if (cleaned !== business.instagram) set("instagram", cleaned);
        }}
      />

      <TextField
        field="tiktok"
        label="TikTok username"
        placeholder="yourbusiness"
        onBlur={() => {
          const cleaned = business.tiktok.trim().replace(/^@+/, "");
          if (cleaned !== business.tiktok) set("tiktok", cleaned);
        }}
      />

      <TextField
        field="youtube"
        label="YouTube channel URL"
        placeholder="youtube.com/@yourbusiness"
      />
    </div>
  );
}
