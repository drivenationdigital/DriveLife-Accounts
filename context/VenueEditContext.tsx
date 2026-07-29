"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  useUpdateVenue,
  useUploadVenueImage,
  type VenueEditData,
  type VenueMediaGroup,
} from "@/lib/myVenues";
import type { VenueEditStepKey } from "@/lib/venueEditSteps";

/**
 * Venue edit state + save controller.
 *
 * Clubs split this across ClubEditContext (record) and ClubSaveContext
 * (mutation). Venues keep both in one provider: the record is a single
 * flat form with no collection helpers, so the split would be two files
 * of ceremony around a dozen fields. What matters — and what's the same
 * as clubs — is that the chrome (topbar, bottombar, panel footer) all
 * read ONE save mutation, so the status pill and every button agree
 * about whether a save is in flight.
 *
 * Validation lives here too, because the wizard gates on it: "Continue"
 * won't advance past a step with invalid fields, and saving jumps back to
 * the first step with a missing required field.
 */

export interface VenueForm {
  /** Encrypted id — the save payload's `vid`. */
  vid: string;
  /** Raw post id — the image upload endpoint wants this one. */
  rawId: number;
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  logo: string | null;
  cover: string | null;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  status: "publish" | "draft";
}

export type VenueFieldKey = keyof VenueForm;

const EMPTY_VENUE: VenueForm = {
  vid: "",
  rawId: 0,
  title: "",
  location: "",
  latitude: "",
  longitude: "",
  logo: null,
  cover: null,
  email: "",
  phone: "",
  website: "",
  facebook: "",
  instagram: "",
  description: "",
  status: "draft",
};

/** Fields each step validates, for gating "Continue". */
const STEP_FIELDS: Record<VenueEditStepKey, VenueFieldKey[]> = {
  basic: ["title", "location"],
  profile: ["email", "website", "facebook", "instagram"],
  description: [],
  publish: [],
};

/** Every field that gets validated, in step order. */
const VALIDATED_FIELDS = [
  "title",
  "location",
  "email",
  "website",
  "facebook",
  "instagram",
] as const;

export type VenueSavePhase = "idle" | "saving" | "saved" | "error";

interface VenueEditContextValue {
  venue: VenueForm;
  set: <K extends VenueFieldKey>(key: K, value: VenueForm[K]) => void;
  /** Replace state from a load response (also resets the dirty baseline). */
  hydrate: (venue: VenueEditData) => void;
  isDirty: boolean;

  // Validation
  errors: Partial<Record<VenueFieldKey, string | null>>;
  touched: Partial<Record<VenueFieldKey, boolean>>;
  markTouched: (key: VenueFieldKey) => void;
  /**
   * True when the step's fields all pass. When they don't, reveals their
   * errors as a side effect so the user sees why nothing happened.
   */
  validateStep: (step: VenueEditStepKey) => boolean;

  // Save
  /**
   * Persist the venue. Returns the step key to jump to when a required
   * field blocked the save, or null when the save was attempted. Never
   * throws — read `saveError` instead.
   */
  save: () => Promise<VenueEditStepKey | null>;
  phase: VenueSavePhase;
  isSaving: boolean;
  saveError: string | null;

  // Images — upload starts on pick and is independent of `save`.
  pickImage: (group: VenueMediaGroup, file: File, previewUrl: string) => void;
  uploadProgress: Record<string, number>;
  uploadError: Record<string, string | null>;
}

const VenueEditContext = createContext<VenueEditContextValue | null>(null);

export function VenueEditProvider({ children }: { children: ReactNode }) {
  const [venue, setVenue] = useState<VenueForm>(EMPTY_VENUE);
  const [baseline, setBaseline] = useState<string>(
    JSON.stringify(EMPTY_VENUE),
  );
  const [touched, setTouched] = useState<
    Partial<Record<VenueFieldKey, boolean>>
  >({});
  const [justSaved, setJustSaved] = useState(false);

  const updateVenue = useUpdateVenue();
  const uploadImage = useUploadVenueImage();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadError, setUploadError] = useState<Record<string, string | null>>(
    {},
  );

  // The "Saved" flash is on a timer; clear it if the user navigates away
  // mid-flash so we don't setState on an unmounted provider.
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const set = useCallback(
    <K extends VenueFieldKey>(key: K, value: VenueForm[K]) => {
      setVenue((v) => ({ ...v, [key]: value }));
    },
    [],
  );

  const hydrate = useCallback((data: VenueEditData) => {
    const next: VenueForm = {
      vid: data.encrypted_id,
      rawId: data.id,
      title: data.title,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      logo: data.logo?.url ?? null,
      cover: data.coverImage?.url ?? null,
      email: data.email,
      phone: data.phone,
      website: data.website,
      facebook: data.facebook,
      instagram: data.instagram,
      description: data.description,
      status: data.status,
    };
    setVenue(next);
    setBaseline(JSON.stringify(next));
  }, []);

  const markTouched = useCallback((key: VenueFieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<VenueFieldKey, string | null>> = {};
    VALIDATED_FIELDS.forEach((k) => {
      e[k] = validateField(k, String(venue[k] ?? ""));
    });
    return e;
  }, [venue]);

  const validateStep = useCallback(
    (step: VenueEditStepKey) => {
      const fields = STEP_FIELDS[step];
      const ok = fields.every((f) => !errors[f]);
      if (!ok) {
        setTouched((t) => {
          const next = { ...t };
          fields.forEach((f) => (next[f] = true));
          return next;
        });
      }
      return ok;
    },
    [errors],
  );

  const { mutateAsync: saveVenue } = updateVenue;

  const save = useCallback(async (): Promise<VenueEditStepKey | null> => {
    // Required fields block the save wherever the user happens to be —
    // reveal them and hand the caller the step to jump to.
    if (errors.title || errors.location) {
      setTouched((t) => ({ ...t, title: true, location: true }));
      return "basic";
    }

    setJustSaved(false);
    try {
      await saveVenue({
        vid: venue.vid,
        post_title: venue.title.trim(),
        venue_location: venue.location,
        latitude: venue.latitude,
        longitude: venue.longitude,
        description: venue.description,
        venue_email: venue.email,
        venue_phone: venue.phone,
        website: venue.website,
        facebook: venue.facebook,
        instagram: venue.instagram,
        post_status: venue.status,
      });
      setBaseline(JSON.stringify(venue));
      setJustSaved(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustSaved(false), 2500);
    } catch {
      // Surfaced through `saveError` / `phase` on the status pill.
    }
    return null;
  }, [errors.title, errors.location, saveVenue, venue]);

  const { mutateAsync: runUpload } = uploadImage;

  const pickImage = useCallback(
    async (group: VenueMediaGroup, file: File, previewUrl: string) => {
      // Show the local preview straight away.
      setVenue((v) => ({
        ...v,
        [group === "logo" ? "logo" : "cover"]: previewUrl,
      }));
      setUploadError((e) => ({ ...e, [group]: null }));
      setUploadProgress((p) => ({ ...p, [group]: 0 }));

      if (!venue.rawId) {
        setUploadError((e) => ({ ...e, [group]: "Venue not loaded yet." }));
        setUploadProgress((p) => {
          const next = { ...p };
          delete next[group];
          return next;
        });
        return;
      }

      try {
        await runUpload({
          venueId: venue.rawId,
          encryptedId: venue.vid,
          file,
          mediaGroup: group,
          onProgress: (percent) =>
            setUploadProgress((p) => ({ ...p, [group]: percent })),
        });
      } catch (err) {
        setUploadError((e) => ({
          ...e,
          [group]:
            err instanceof Error ? err.message : "Couldn't upload that image.",
        }));
      } finally {
        setUploadProgress((p) => {
          const next = { ...p };
          delete next[group];
          return next;
        });
      }
    },
    [runUpload, venue.rawId, venue.vid],
  );

  const isDirty = useMemo(
    () => JSON.stringify(venue) !== baseline,
    [venue, baseline],
  );

  // `justSaved` (not mutation.isSuccess) drives the saved state, so the
  // pill flashes "Saved" and settles back to idle rather than claiming
  // "Saved" forever after one successful write.
  const phase: VenueSavePhase = updateVenue.isPending
    ? "saving"
    : updateVenue.isError
      ? "error"
      : justSaved
        ? "saved"
        : "idle";

  const value = useMemo<VenueEditContextValue>(
    () => ({
      venue,
      set,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      isSaving: updateVenue.isPending,
      saveError: updateVenue.error?.message ?? null,
      pickImage,
      uploadProgress,
      uploadError,
    }),
    [
      venue,
      set,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      updateVenue.isPending,
      updateVenue.error,
      pickImage,
      uploadProgress,
      uploadError,
    ],
  );

  return (
    <VenueEditContext.Provider value={value}>
      {children}
    </VenueEditContext.Provider>
  );
}

export function useVenueEdit(): VenueEditContextValue {
  const ctx = useContext(VenueEditContext);
  if (!ctx) {
    throw new Error("useVenueEdit must be used inside <VenueEditProvider>");
  }
  return ctx;
}

// ─── Validation ───────────────────────────────────────────────────────

/** A URL is valid with or without the protocol (we prepend https:// to
 *  test), as long as it has a dotted hostname. */
function isValidUrl(raw: string): boolean {
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const u = new URL(candidate);
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Returns an error message for a field, or null if valid. Optional
 *  fields pass when empty; title/location are required. */
function validateField(key: VenueFieldKey, value: string): string | null {
  const v = (value ?? "").trim();

  if (!v) {
    if (key === "title" || key === "location") return "This field is required.";
    return null; // optional fields are fine when blank
  }

  switch (key) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : "Enter a valid email address.";
    case "website":
      return isValidUrl(v) ? null : "Enter a valid website URL.";
    case "facebook":
      return isValidUrl(v) ? null : "Enter a valid Facebook page URL.";
    case "instagram": {
      const handle = v.replace(/^@+/, "");
      return /^[a-zA-Z0-9._]{1,30}$/.test(handle)
        ? null
        : "Use letters, numbers, periods and underscores only.";
    }
    default:
      return null;
  }
}
