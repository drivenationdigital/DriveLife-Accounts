/**
 * Club edit - data shapes.
 *
 * Mirrors the WP club ACF fields so the eventual load/save endpoints map
 * 1:1 with no translation layer:
 *
 *   basic    → post_title, club_category[], club_location_type,
 *              club_location, latitude, longitude
 *   profile  → logo, cover_image, club_email, website, facebook,
 *              instagram, merchandise_link
 *   about    → description (wysiwyg)
 *   joining  → membership_questions[] (repeater of { question })
 *   terms    → club_terms (wysiwyg)
 *   admins   → club_administrators[] (user ids)
 *   publish  → post_status, club_type
 *
 * Images are modelled as { id, url } so a freshly-picked local file
 * (id: null + object URL) and a saved attachment both fit one shape.
 */

/** ACF select: '1' = Private, '2' = Public. */
export type ClubTypeValue = "1" | "2";

/** ACF select: '1' = National, '2' = Local/Regional. */
export type ClubLocationType = "1" | "2";

export type ClubPostStatus = "publish" | "draft";

export interface ClubImage {
  /** Attachment id once saved; null while it's a local pick. */
  id: number | null;
  /** Display URL - remote src, or an object URL before upload. */
  url: string;
}

export interface ClubCategory {
  id: number;
  name: string;
}

export interface MembershipQuestion {
  /** Client-side row key; not persisted. */
  key: string;
  question: string;
}

export interface ClubAdministrator {
  id: number;
  name: string;
  email: string;
}

/** The full editable club record. */
export interface ClubEditData {
  id: number;
  encrypted_id: string;
  /** Region the club lives on, carried in from the `?site=` param on
   *  the edit route. Not part of the /club-edit payload - the editor
   *  folds it in on hydration so saving can send it back up. Empty
   *  when unknown, which lets the API fall back to its default. */
  site: string;

  // ── Basic details ──────────────────────────────────────────────
  title: string;
  /** Selected club_category term ids. */
  categoryIds: number[];
  locationType: ClubLocationType;
  location: string;
  latitude: string;
  longitude: string;

  // ── Club profile ───────────────────────────────────────────────
  logo: ClubImage | null;
  coverImage: ClubImage | null;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  merchandiseLink: string;

  // ── Description / terms ────────────────────────────────────────
  description: string;
  terms: string;

  // ── Membership ─────────────────────────────────────────────────
  membershipQuestions: MembershipQuestion[];
  administrators: ClubAdministrator[];

  // ── Publish ────────────────────────────────────────────────────
  status: ClubPostStatus;
  clubType: ClubTypeValue;
}

/**
 * Options the edit screen needs but doesn't own - supplied by the load
 * endpoint alongside the record (so the category list stays server-driven).
 */
export interface ClubEditOptions {
  categories: ClubCategory[];
}

/** GET /club-edit?cid=… */
export interface ClubEditResponse {
  success: true;
  club: ClubEditData;
  options: ClubEditOptions;
}

/**
 * POST /club-update body. Flat + ACF-named so the WP side can write
 * fields without remapping. Images send ids (null clears the field).
 */
export interface ClubUpdateBody {
  cid: string; // encrypted club id
  /** Multisite blog the club lives on ("uk" | "us"). Part of the
   *  club's identity, not a filter: cids repeat across regions, so
   *  without it a US club saves over whatever UK club shares its id.
   *  Stripped from the body and sent as a client option, where the
   *  guard in apiClient enforces it. */
  site: string;
  post_title: string;
  post_status: ClubPostStatus;
  club_type: ClubTypeValue;
  club_category: number[];
  club_location_type: ClubLocationType;
  club_location: string;
  latitude: string;
  longitude: string;
  logo: number | null;
  cover_image: number | null;
  club_email: string;
  website: string;
  facebook: string;
  instagram: string;
  merchandise_link: string;
  description: string;
  club_terms: string;
  membership_questions: { question: string }[];
  /**
   * Not sent by the wizard: administrators are managed by invitation
   * (app/v1 …/invite-admin) and become admins on acceptance. Resending
   * the loaded list here could revert an acceptance that happened
   * between load and save. Kept optional for other callers.
   */
  club_administrators?: number[];
}

/** An empty club, used before hydration and as a reset baseline. */
export const EMPTY_CLUB: ClubEditData = {
  id: 0,
  encrypted_id: "",
  site: "",
  title: "",
  categoryIds: [],
  locationType: "1",
  location: "",
  latitude: "",
  longitude: "",
  logo: null,
  coverImage: null,
  email: "",
  website: "",
  facebook: "",
  instagram: "",
  merchandiseLink: "",
  description: "",
  terms: "",
  membershipQuestions: [],
  administrators: [],
  status: "draft",
  clubType: "1",
};

/** Map the in-memory record to the save payload. */
export function toClubUpdateBody(club: ClubEditData): ClubUpdateBody {
  return {
    cid: club.encrypted_id,
    // Falls back to the default region rather than omitting: the
    // API client requires a concrete region on /club-update.
    site: club.site || "uk",
    post_title: club.title,
    post_status: club.status,
    club_type: club.clubType,
    club_category: club.categoryIds,
    club_location_type: club.locationType,
    club_location: club.location,
    latitude: club.latitude,
    longitude: club.longitude,
    logo: club.logo?.id ?? null,
    cover_image: club.coverImage?.id ?? null,
    club_email: club.email,
    website: club.website,
    facebook: club.facebook,
    instagram: club.instagram,
    merchandise_link: club.merchandiseLink,
    description: club.description,
    club_terms: club.terms,
    // Drop blank rows and the client-side keys.
    membership_questions: club.membershipQuestions
      .filter((q) => q.question.trim() !== "")
      .map((q) => ({ question: q.question.trim() })),
    // club_administrators intentionally omitted - see the type note.
  };
}

/**
 * Default club terms, personalised with the club name.
 *
 * Applied when a club has no terms yet (see the edit page's load step)
 * so new clubs start with sensible defaults rather than a blank box.
 * Once saved these are just normal content - renaming the club later
 * won't rewrite them, since by then they may have been edited.
 *
 * Returns HTML, matching the WYSIWYG field it populates.
 */
export function defaultClubTerms(title: string): string {
  const name = title.trim() || "this club";
  const q = (s: string) => `&lsquo;${s}&rsquo;`;
  return [
    `<p>By joining ${q(name)} you agree to the following:</p>`,
    `<p>All members shall join events entirely at their own risk and should be fully insured for any activity that they attend.</p>`,
    `<p>You must respect your fellow club/group members. Any bullying, disrespecting a fellow member or belittling a members car (or type of car) in public, or on social media (including any club/group or chat platforms), will not be tolerated.</p>`,
    `<p>${q(name)} forbids reckless driving or any action that puts peoples safety or cars at risk. Any such activity may result in your membership being terminated without notice. Joining ${q(name)} is deemed as acceptance of any of our terms and conditions of membership.</p>`,
  ].join("\n");
}
