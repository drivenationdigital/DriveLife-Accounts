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

import { useUpdateTrack, type TrackEditData } from "@/lib/myTracks";
import {
  useUploadTrackImage,
  type TrackMediaGroup,
} from "@/lib/uploadTrackImage";
import type { TrackEditStepKey } from "@/lib/trackEditSteps";

/**
 * Track edit state + save controller.
 *
 * Same shape as VenueEditContext: one provider holds the record, the
 * validation and the single save mutation, so the chrome (topbar,
 * bottombar, panel footer) all agree about what's dirty, what's invalid
 * and whether a save is in flight.
 *
 * Images upload on pick (Cloudflare direct upload via
 * lib/uploadTrackImage.ts) and are independent of `save`.
 */

export interface TrackForm {
  /** Encrypted id - the save payload's `tid`. */
  tid: string;
  /** Region the tid belongs to ("uk" | "us"). */
  site: string;
  /** Raw post id. */
  rawId: number;
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  /** Track type VALUES (keys). */
  trackTypes: string[];
  trackLength: string;
  noiseLimit: string;
  logo: string | null;
  cover: string | null;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  description: string;
  status: "publish" | "draft";
  permalink: string;
}

export type TrackFieldKey = keyof TrackForm;

const EMPTY_TRACK: TrackForm = {
  tid: "",
  site: "uk",
  rawId: 0,
  title: "",
  location: "",
  latitude: "",
  longitude: "",
  trackTypes: [],
  trackLength: "",
  noiseLimit: "",
  logo: null,
  cover: null,
  email: "",
  phone: "",
  website: "",
  facebook: "",
  instagram: "",
  description: "",
  status: "draft",
  permalink: "",
};

/** Fields each step validates, for gating "Continue". */
const STEP_FIELDS: Record<TrackEditStepKey, TrackFieldKey[]> = {
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

export type TrackSavePhase = "idle" | "saving" | "saved" | "error";

interface TrackEditContextValue {
  track: TrackForm;
  set: <K extends TrackFieldKey>(key: K, value: TrackForm[K]) => void;
  toggleType: (value: string) => void;
  /** Replace state from a load response (also resets the dirty baseline). */
  hydrate: (track: TrackEditData) => void;
  isDirty: boolean;

  // Validation
  errors: Partial<Record<TrackFieldKey, string | null>>;
  touched: Partial<Record<TrackFieldKey, boolean>>;
  markTouched: (key: TrackFieldKey) => void;
  validateStep: (step: TrackEditStepKey) => boolean;

  // Save
  save: () => Promise<TrackEditStepKey | null>;
  phase: TrackSavePhase;
  isSaving: boolean;
  saveError: string | null;

  // Images - upload starts on pick and is independent of `save`.
  pickImage: (group: TrackMediaGroup, file: File, previewUrl: string) => void;
  uploadProgress: Record<string, number>;
  uploadError: Record<string, string | null>;
}

const TrackEditContext = createContext<TrackEditContextValue | null>(null);

export function TrackEditProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<TrackForm>(EMPTY_TRACK);
  const [baseline, setBaseline] = useState<string>(
    JSON.stringify(EMPTY_TRACK),
  );
  const [touched, setTouched] = useState<
    Partial<Record<TrackFieldKey, boolean>>
  >({});
  const [justSaved, setJustSaved] = useState(false);

  const updateTrack = useUpdateTrack();
  const uploadImage = useUploadTrackImage();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadError, setUploadError] = useState<Record<string, string | null>>(
    {},
  );

  // Latest form for async callbacks (uploads) without re-creating them.
  const liveRef = useRef(track);
  liveRef.current = track;

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
    <K extends TrackFieldKey>(key: K, value: TrackForm[K]) => {
      setTrack((t) => ({ ...t, [key]: value }));
    },
    [],
  );

  const toggleType = useCallback((value: string) => {
    setTrack((t) => ({
      ...t,
      trackTypes: t.trackTypes.includes(value)
        ? t.trackTypes.filter((v) => v !== value)
        : [...t.trackTypes, value],
    }));
  }, []);

  const hydrate = useCallback((data: TrackEditData) => {
    const next: TrackForm = {
      tid: data.encrypted_id,
      site: data.site,
      rawId: data.id,
      title: data.title,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      trackTypes: Array.isArray(data.trackTypes) ? data.trackTypes : [],
      trackLength: data.trackLength ?? "",
      noiseLimit: data.noiseLimit ?? "",
      logo: data.logo?.url ?? null,
      cover: data.coverImage?.url ?? null,
      email: data.email,
      phone: data.phone,
      website: data.website,
      facebook: data.facebook,
      instagram: data.instagram,
      description: data.description,
      status: data.status,
      permalink: data.permalink ?? "",
    };
    setTrack(next);
    setBaseline(JSON.stringify(next));
  }, []);

  const markTouched = useCallback((key: TrackFieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<TrackFieldKey, string | null>> = {};
    VALIDATED_FIELDS.forEach((k) => {
      e[k] = validateField(k, String(track[k] ?? ""));
    });
    return e;
  }, [track]);

  const validateStep = useCallback(
    (step: TrackEditStepKey) => {
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

  const { mutateAsync: saveTrack } = updateTrack;

  const save = useCallback(async (): Promise<TrackEditStepKey | null> => {
    if (errors.title || errors.location) {
      setTouched((t) => ({ ...t, title: true, location: true }));
      return "basic";
    }

    setJustSaved(false);
    try {
      const res = await saveTrack({
        tid: track.tid,
        site: track.site,
        post_title: track.title.trim(),
        track_location: track.location,
        latitude: track.latitude,
        longitude: track.longitude,
        track_types: track.trackTypes,
        track_length: track.trackLength,
        noise_limit: track.noiseLimit,
        description: track.description,
        track_email: track.email,
        track_phone: track.phone,
        website: track.website,
        facebook: track.facebook,
        instagram: track.instagram,
        post_status: track.status,
      });
      // The permalink can change with the title; keep it current for the
      // "View track" link without a refetch.
      const saved = { ...track, permalink: res.permalink || track.permalink };
      setTrack(saved);
      setBaseline(JSON.stringify(saved));
      setJustSaved(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustSaved(false), 2500);
    } catch {
      // Surfaced through `saveError` / `phase` on the status pill.
    }
    return null;
  }, [errors.title, errors.location, saveTrack, track]);

  const { mutateAsync: runUpload } = uploadImage;

  const pickImage = useCallback(
    async (group: TrackMediaGroup, file: File, previewUrl: string) => {
      // Show the local preview straight away.
      setTrack((t) => ({ ...t, [group]: previewUrl }));
      setUploadError((e) => ({ ...e, [group]: null }));
      setUploadProgress((p) => ({ ...p, [group]: 10 }));

      const current = liveRef.current;
      if (!current.tid) {
        setUploadError((e) => ({ ...e, [group]: "Track not loaded yet." }));
        setUploadProgress((p) => {
          const next = { ...p };
          delete next[group];
          return next;
        });
        return;
      }

      try {
        const image = await runUpload({
          tid: current.tid,
          site: current.site,
          file,
          mediaGroup: group,
        });
        setUploadProgress((p) => ({ ...p, [group]: 100 }));
        // Swap the object URL for the stored Cloudflare URL. Images are
        // not part of the save payload, so keep the baseline in step and
        // the form doesn't read as dirty just because a photo landed.
        setTrack((cur) => {
          const next = { ...cur, [group]: image.url };
          setBaseline((prev) => {
            try {
              const parsed = JSON.parse(prev) as TrackForm;
              return JSON.stringify({ ...parsed, [group]: image.url });
            } catch {
              return prev;
            }
          });
          return next;
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
    [runUpload],
  );

  // Dirty = anything other than the image previews differs from the
  // baseline (previews are swapped for stored URLs as uploads complete).
  const isDirty = useMemo(() => {
    const strip = (f: TrackForm) => ({ ...f, logo: null, cover: null });
    try {
      return (
        JSON.stringify(strip(track)) !==
        JSON.stringify(strip(JSON.parse(baseline) as TrackForm))
      );
    } catch {
      return true;
    }
  }, [track, baseline]);

  const phase: TrackSavePhase = updateTrack.isPending
    ? "saving"
    : updateTrack.isError
      ? "error"
      : justSaved
        ? "saved"
        : "idle";

  const value = useMemo<TrackEditContextValue>(
    () => ({
      track,
      set,
      toggleType,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      isSaving: updateTrack.isPending,
      saveError: updateTrack.error?.message ?? null,
      pickImage,
      uploadProgress,
      uploadError,
    }),
    [
      track,
      set,
      toggleType,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      updateTrack.isPending,
      updateTrack.error,
      pickImage,
      uploadProgress,
      uploadError,
    ],
  );

  return (
    <TrackEditContext.Provider value={value}>
      {children}
    </TrackEditContext.Provider>
  );
}

export function useTrackEdit(): TrackEditContextValue {
  const ctx = useContext(TrackEditContext);
  if (!ctx) {
    throw new Error("useTrackEdit must be used inside <TrackEditProvider>");
  }
  return ctx;
}

// ─── Validation ───────────────────────────────────────────────────────

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
function validateField(key: TrackFieldKey, value: string): string | null {
  const v = (value ?? "").trim();

  if (!v) {
    if (key === "title" || key === "location") return "This field is required.";
    return null;
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
