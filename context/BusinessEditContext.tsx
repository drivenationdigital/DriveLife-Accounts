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
  useUpdateBusiness,
  type BusinessEditData,
  type BusinessOwner,
  type BusinessTradersDirectory,
} from "@/lib/myBusinesses";
import {
  useRemoveBusinessImage,
  useUploadBusinessImage,
} from "@/lib/uploadBusinessImage";
import type { BusinessEditStepKey } from "@/lib/businessEditSteps";

/**
 * Business edit state + save controller. Same design as
 * VenueEditContext (one provider holds the record, validation and the
 * single save mutation) with three additions the venue editor doesn't
 * have:
 *
 *   - a gallery (uploads/removals hit the server straight away, the
 *     order rides with the next save as `gallery_order`)
 *   - co-owners (added/removed through their own endpoints, so they're
 *     stored on the form but never count towards "unsaved changes")
 *   - the Event Traders membership block, which is server-owned (Stripe)
 *     and refreshed by the panel's own calls, never by the Update save
 */

export type BusinessGalleryItem =
  | { kind: "remote"; id: string; url: string }
  | { kind: "local"; previewUrl: string; file: File };

export interface BusinessForm {
  /** Encrypted id - the save payload's `bid`. */
  bid: string;
  /** Region the bid belongs to ("uk" | "us"). */
  site: string;
  rawId: number;
  title: string;
  tagline: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Category slugs. */
  categories: string[];
  logo: string | null;
  cover: string | null;
  gallery: BusinessGalleryItem[];
  address: string;
  latitude: string;
  longitude: string;
  hideAddress: boolean;
  email: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  openingHours: string;
  description: string;
  status: "publish" | "draft";
  permalink: string;
  owners: BusinessOwner[];
  traders: BusinessTradersDirectory;
}

export type BusinessFieldKey = keyof BusinessForm;

export const EMPTY_TRADERS: BusinessTradersDirectory = {
  requested: false,
  requested_at: null,
  member: false,
  expires: null,
  price_label: "£20 per year",
  amount_label: "£20",
  currency: "gbp",
  amount: 2000,
  stripe_enabled: false,
  portal_available: false,
  manual: false,
  subscription: null,
};

const EMPTY_BUSINESS: BusinessForm = {
  bid: "",
  site: "uk",
  rawId: 0,
  title: "",
  tagline: "",
  country: "GB",
  categories: [],
  logo: null,
  cover: null,
  gallery: [],
  address: "",
  latitude: "",
  longitude: "",
  hideAddress: false,
  email: "",
  phone: "",
  website: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  openingHours: "",
  description: "",
  status: "draft",
  permalink: "",
  owners: [],
  traders: EMPTY_TRADERS,
};

/** Fields each step validates, for gating "Continue". */
const STEP_FIELDS: Record<BusinessEditStepKey, BusinessFieldKey[]> = {
  basic: ["title"],
  profile: ["email", "website", "facebook", "instagram", "tiktok", "youtube"],
  description: [],
  owners: [],
  traders: [],
  publish: [],
};

const VALIDATED_FIELDS = [
  "title",
  "email",
  "website",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
] as const;

export type BusinessSavePhase = "idle" | "saving" | "saved" | "error";

/**
 * The part of the form the Update button persists. Owners and the
 * traders block save through their own calls, and local gallery
 * entries are still uploading, so none of those count as "unsaved".
 */
function persistedSnapshot(b: BusinessForm): string {
  return JSON.stringify({
    title: b.title,
    tagline: b.tagline,
    country: b.country,
    categories: b.categories,
    address: b.address,
    latitude: b.latitude,
    longitude: b.longitude,
    hideAddress: b.hideAddress,
    email: b.email,
    phone: b.phone,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    tiktok: b.tiktok,
    youtube: b.youtube,
    openingHours: b.openingHours,
    description: b.description,
    status: b.status,
    galleryOrder: remoteGalleryIds(b.gallery),
  });
}

export function remoteGalleryIds(gallery: BusinessGalleryItem[]): string[] {
  return gallery.flatMap((g) => (g.kind === "remote" ? [g.id] : []));
}

interface BusinessEditContextValue {
  business: BusinessForm;
  set: <K extends BusinessFieldKey>(key: K, value: BusinessForm[K]) => void;
  hydrate: (business: BusinessEditData) => void;
  isDirty: boolean;

  errors: Partial<Record<BusinessFieldKey, string | null>>;
  touched: Partial<Record<BusinessFieldKey, boolean>>;
  markTouched: (key: BusinessFieldKey) => void;
  validateStep: (step: BusinessEditStepKey) => boolean;

  save: () => Promise<BusinessEditStepKey | null>;
  phase: BusinessSavePhase;
  isSaving: boolean;
  saveError: string | null;

  toggleCategory: (slug: string) => void;
  setCategories: (slugs: string[]) => void;

  pickImage: (group: "logo" | "cover", file: File, previewUrl: string) => void;
  uploadProgress: Record<string, number>;
  uploadError: Record<string, string | null>;

  addGalleryFiles: (files: File[]) => void;
  removeGalleryItem: (index: number) => Promise<void>;
  moveGalleryItem: (index: number, delta: -1 | 1) => void;
  galleryUploading: Set<string>;
  galleryErrors: string[];
  dismissGalleryErrors: () => void;

  /** Owners are server-persisted by their own endpoints; this just
   *  reflects the response. */
  setOwners: (owners: BusinessOwner[]) => void;

  /** Reflect a membership block the traders endpoints returned. */
  setTraders: (traders: BusinessTradersDirectory) => void;
  /** Fallback path when Stripe isn't configured: autosaves the
   *  "please contact me" request. Throws on failure. */
  saveTradersRequest: (requested: boolean) => Promise<void>;
  tradersSaving: boolean;
}

const BusinessEditContext = createContext<BusinessEditContextValue | null>(null);

export function BusinessEditProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessForm>(EMPTY_BUSINESS);
  const [baseline, setBaseline] = useState<string>(
    persistedSnapshot(EMPTY_BUSINESS),
  );
  const [touched, setTouched] = useState<
    Partial<Record<BusinessFieldKey, boolean>>
  >({});
  const [justSaved, setJustSaved] = useState(false);

  const updateBusiness = useUpdateBusiness();
  const tradersMutation = useUpdateBusiness();
  const uploadImage = useUploadBusinessImage();
  const removeImage = useRemoveBusinessImage();

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<Record<string, string | null>>({});
  const [galleryUploading, setGalleryUploading] = useState<Set<string>>(new Set());
  const [galleryErrors, setGalleryErrors] = useState<string[]>([]);

  // Latest form for async callbacks (uploads resolve after reorders).
  const liveRef = useRef(business);
  liveRef.current = business;

  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const set = useCallback(
    <K extends BusinessFieldKey>(key: K, value: BusinessForm[K]) => {
      setBusiness((b) => ({ ...b, [key]: value }));
    },
    [],
  );

  const hydrate = useCallback((data: BusinessEditData) => {
    const next: BusinessForm = {
      bid: data.encrypted_id,
      site: data.site,
      rawId: data.id,
      title: data.title,
      tagline: data.tagline ?? "",
      country: data.country || "GB",
      categories: data.categories ?? [],
      logo: data.logo?.url ?? null,
      cover: data.coverImage?.url ?? null,
      gallery: (data.gallery ?? []).map((g) => ({
        kind: "remote" as const,
        id: g.id ?? g.url,
        url: g.url,
      })),
      address: data.address ?? "",
      latitude: data.latitude ?? "",
      longitude: data.longitude ?? "",
      hideAddress: Boolean(data.hideAddress),
      email: data.email ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      facebook: data.facebook ?? "",
      instagram: data.instagram ?? "",
      tiktok: data.tiktok ?? "",
      youtube: data.youtube ?? "",
      openingHours: data.openingHours ?? "",
      description: data.description ?? "",
      status: data.status,
      permalink: data.permalink ?? "",
      owners: data.owners ?? [],
      traders: { ...EMPTY_TRADERS, ...(data.tradersDirectory ?? {}) },
    };
    setBusiness(next);
    setBaseline(persistedSnapshot(next));
  }, []);

  const markTouched = useCallback((key: BusinessFieldKey) => {
    setTouched((t) => ({ ...t, [key]: true }));
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<BusinessFieldKey, string | null>> = {};
    VALIDATED_FIELDS.forEach((k) => {
      e[k] = validateField(k, String(business[k] ?? ""));
    });
    return e;
  }, [business]);

  const validateStep = useCallback(
    (step: BusinessEditStepKey) => {
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

  const { mutateAsync: saveBusiness } = updateBusiness;

  const save = useCallback(async (): Promise<BusinessEditStepKey | null> => {
    if (errors.title) {
      setTouched((t) => ({ ...t, title: true }));
      return "basic";
    }
    const b = liveRef.current;
    setJustSaved(false);
    try {
      const res = await saveBusiness({
        bid: b.bid,
        site: b.site,
        post_title: b.title.trim(),
        tagline: b.tagline.trim(),
        business_country: b.country,
        business_categories: b.categories,
        business_address: b.address,
        latitude: b.latitude,
        longitude: b.longitude,
        hide_address: b.hideAddress,
        business_email: b.email,
        business_phone: b.phone,
        website: b.website,
        facebook: b.facebook,
        instagram: b.instagram,
        tiktok: b.tiktok,
        youtube: b.youtube,
        opening_hours: b.openingHours,
        description: b.description,
        gallery_order: remoteGalleryIds(b.gallery),
        post_status: b.status,
      });
      // The server normalises URLs/handles; reflect what it kept so the
      // form and the baseline agree.
      setBusiness((cur) => {
        const next: BusinessForm = {
          ...cur,
          website: res.business.website,
          facebook: res.business.facebook,
          instagram: res.business.instagram,
          tiktok: res.business.tiktok,
          youtube: res.business.youtube,
          status: res.status,
          permalink: res.permalink,
          traders: { ...cur.traders, ...(res.business.tradersDirectory ?? {}) },
        };
        setBaseline(persistedSnapshot(next));
        return next;
      });
      setJustSaved(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustSaved(false), 2500);
    } catch {
      // Surfaced through saveError / phase.
    }
    return null;
  }, [errors.title, saveBusiness]);

  // ── Categories ────────────────────────────────────────────────────
  const toggleCategory = useCallback((slug: string) => {
    setBusiness((b) => ({
      ...b,
      categories: b.categories.includes(slug)
        ? b.categories.filter((s) => s !== slug)
        : [...b.categories, slug],
    }));
  }, []);
  const setCategories = useCallback((slugs: string[]) => {
    setBusiness((b) => ({ ...b, categories: slugs }));
  }, []);

  // ── Logo / cover ──────────────────────────────────────────────────
  const { mutateAsync: runUpload } = uploadImage;

  const pickImage = useCallback(
    async (group: "logo" | "cover", file: File, previewUrl: string) => {
      setBusiness((b) => ({ ...b, [group]: previewUrl }));
      setUploadError((e) => ({ ...e, [group]: null }));
      setUploadProgress((p) => ({ ...p, [group]: 10 }));

      const b = liveRef.current;
      if (!b.bid) {
        setUploadError((e) => ({ ...e, [group]: "Business not loaded yet." }));
        setUploadProgress((p) => {
          const next = { ...p };
          delete next[group];
          return next;
        });
        return;
      }

      try {
        const image = await runUpload({
          bid: b.bid,
          site: b.site,
          file,
          mediaGroup: group,
        });
        setUploadProgress((p) => ({ ...p, [group]: 100 }));
        setBusiness((cur) => ({ ...cur, [group]: image.url }));
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

  // ── Gallery ───────────────────────────────────────────────────────
  const markGalleryUploading = (key: string, on: boolean) => {
    setGalleryUploading((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const patchBaselineGallery = (fn: (ids: string[]) => string[]) => {
    setBaseline((prev) => {
      try {
        const parsed = JSON.parse(prev) as { galleryOrder?: string[] };
        parsed.galleryOrder = fn(parsed.galleryOrder ?? []);
        return JSON.stringify(parsed);
      } catch {
        return prev;
      }
    });
  };

  const addGalleryFiles = useCallback(
    (files: File[]) => {
      const locals: BusinessGalleryItem[] = files
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({
          kind: "local" as const,
          previewUrl: URL.createObjectURL(file),
          file,
        }));
      if (locals.length === 0) return;
      setBusiness((b) => ({ ...b, gallery: [...b.gallery, ...locals] }));

      for (const local of locals) {
        if (local.kind !== "local") continue;
        const b = liveRef.current;
        if (!b.bid) {
          setGalleryErrors((p) => [...p, `${local.file.name}: business not loaded yet.`]);
          continue;
        }
        markGalleryUploading(local.previewUrl, true);
        runUpload({ bid: b.bid, site: b.site, file: local.file, mediaGroup: "gallery" })
          .then((image) => {
            const remote: BusinessGalleryItem = {
              kind: "remote",
              id: image.id,
              url: image.url,
            };
            setBusiness((cur) => ({
              ...cur,
              gallery: cur.gallery.map((g) => (g === local ? remote : g)),
            }));
            // The upload is persisted server-side, so the new id joins
            // the baseline too - only a reorder should read as unsaved.
            patchBaselineGallery((ids) => [...ids, image.id]);
            URL.revokeObjectURL(local.previewUrl);
          })
          .catch((err: unknown) => {
            setBusiness((cur) => ({
              ...cur,
              gallery: cur.gallery.filter((g) => g !== local),
            }));
            URL.revokeObjectURL(local.previewUrl);
            setGalleryErrors((p) => [
              ...p,
              `${local.file.name}: ${err instanceof Error ? err.message : "upload failed."}`,
            ]);
          })
          .finally(() => markGalleryUploading(local.previewUrl, false));
      }
    },
    [runUpload],
  );

  const { mutateAsync: runRemove } = removeImage;

  const removeGalleryItem = useCallback(
    async (index: number) => {
      const b = liveRef.current;
      const item = b.gallery[index];
      if (!item) return;
      if (item.kind === "remote") {
        try {
          await runRemove({ bid: b.bid, site: b.site, mediaId: item.id });
        } catch (err) {
          setGalleryErrors((p) => [
            ...p,
            `Couldn't remove image: ${err instanceof Error ? err.message : "unknown error"}`,
          ]);
          return;
        }
        patchBaselineGallery((ids) => ids.filter((id) => id !== item.id));
      } else {
        URL.revokeObjectURL(item.previewUrl);
      }
      setBusiness((cur) => ({
        ...cur,
        gallery: cur.gallery.filter((g) => g !== item),
      }));
    },
    [runRemove],
  );

  const moveGalleryItem = useCallback((index: number, delta: -1 | 1) => {
    setBusiness((b) => {
      const target = index + delta;
      if (target < 0 || target >= b.gallery.length) return b;
      const next = [...b.gallery];
      const a = next[index];
      const c = next[target];
      if (a === undefined || c === undefined) return b;
      next[index] = c;
      next[target] = a;
      return { ...b, gallery: next };
    });
  }, []);

  const dismissGalleryErrors = useCallback(() => setGalleryErrors([]), []);

  // ── Owners ────────────────────────────────────────────────────────
  const setOwners = useCallback((owners: BusinessOwner[]) => {
    setBusiness((b) => ({ ...b, owners }));
  }, []);

  // ── Event Traders membership ──────────────────────────────────────
  const setTraders = useCallback((traders: BusinessTradersDirectory) => {
    setBusiness((b) => ({ ...b, traders: { ...EMPTY_TRADERS, ...traders } }));
  }, []);

  const { mutateAsync: saveTraders } = tradersMutation;

  const saveTradersRequest = useCallback(
    async (requested: boolean) => {
      const b = liveRef.current;
      const res = await saveTraders({
        bid: b.bid,
        site: b.site,
        traders_directory_requested: requested,
      });
      if (res.business.tradersDirectory) {
        setTraders(res.business.tradersDirectory);
      }
    },
    [saveTraders, setTraders],
  );

  const isDirty = useMemo(
    () => persistedSnapshot(business) !== baseline,
    [business, baseline],
  );

  const phase: BusinessSavePhase = updateBusiness.isPending
    ? "saving"
    : updateBusiness.isError
      ? "error"
      : justSaved
        ? "saved"
        : "idle";

  const value = useMemo<BusinessEditContextValue>(
    () => ({
      business,
      set,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      isSaving: updateBusiness.isPending,
      saveError: updateBusiness.error?.message ?? null,
      toggleCategory,
      setCategories,
      pickImage,
      uploadProgress,
      uploadError,
      addGalleryFiles,
      removeGalleryItem,
      moveGalleryItem,
      galleryUploading,
      galleryErrors,
      dismissGalleryErrors,
      setOwners,
      setTraders,
      saveTradersRequest,
      tradersSaving: tradersMutation.isPending,
    }),
    [
      business,
      set,
      hydrate,
      isDirty,
      errors,
      touched,
      markTouched,
      validateStep,
      save,
      phase,
      updateBusiness.isPending,
      updateBusiness.error,
      toggleCategory,
      setCategories,
      pickImage,
      uploadProgress,
      uploadError,
      addGalleryFiles,
      removeGalleryItem,
      moveGalleryItem,
      galleryUploading,
      galleryErrors,
      dismissGalleryErrors,
      setOwners,
      setTraders,
      saveTradersRequest,
      tradersMutation.isPending,
    ],
  );

  return (
    <BusinessEditContext.Provider value={value}>
      {children}
    </BusinessEditContext.Provider>
  );
}

export function useBusinessEdit(): BusinessEditContextValue {
  const ctx = useContext(BusinessEditContext);
  if (!ctx) {
    throw new Error("useBusinessEdit must be used inside <BusinessEditProvider>");
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

function isValidHandle(raw: string): boolean {
  const v = raw.trim();
  // A pasted profile URL is accepted too - the server keeps the handle.
  if (/^https?:\/\//i.test(v)) return isValidUrl(v);
  return /^[a-zA-Z0-9._]{1,30}$/.test(v.replace(/^@+/, ""));
}

function validateField(key: BusinessFieldKey, value: string): string | null {
  const v = (value ?? "").trim();

  if (!v) {
    if (key === "title") return "This field is required.";
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
    case "youtube":
      return isValidUrl(v) ? null : "Enter a valid YouTube channel URL.";
    case "instagram":
    case "tiktok":
      return isValidHandle(v)
        ? null
        : "Use letters, numbers, periods and underscores only.";
    default:
      return null;
  }
}
