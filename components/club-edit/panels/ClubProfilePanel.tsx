"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { FieldLabel, Divider, ImageUploadRow, inputCls } from "../shared";

/** Step 2 — logo, cover, and the club's contact/social links. */
export function ClubProfilePanel() {
  const { club, setField } = useClubEdit();

  return (
    <div className="space-y-6">
      <ImageUploadRow
        title="Club Logo"
        hint="Ideal size: 800px x 800px"
        previewUrl={club.logo?.url ?? null}
        onPick={(_file, url) => setField("logo", { id: null, url })}
      />
      <ImageUploadRow
        title="Club Cover Image"
        description="Add an image that best represents your club."
        hint="Ideal size: 1100px (width) x 500px (height)"
        previewUrl={club.coverImage?.url ?? null}
        onPick={(_file, url) => setField("coverImage", { id: null, url })}
      />

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
