/**
 * Businesses - hooks for the "My Businesses" list, the business editor
 * and the organisers' Event Exhibitor Directory.
 *
 * Backed by the dl-accounts `business-*` routes (theme:
 * drivelife-accounts-api/routes/businesses.php). Every detail route
 * carries `site`; the list routes take it as an optional filter, the
 * same split as venues (see SITE_REQUIRED_ROUTES in apiClient).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "./apiClient";
import type { EventSite, SiteKey } from "./apiTypes";

// ─── Shared shapes ────────────────────────────────────────────────────

export interface BusinessCategory {
  slug: string;
  name: string;
  count?: number;
}

export interface BusinessCountry {
  /** ISO 3166-1 alpha-2, e.g. "GB". */
  code: string;
  name: string;
}

export interface BusinessOwner {
  id: number;
  name: string;
  email: string;
  is_self: boolean;
}

export interface BusinessImage {
  /** Cloudflare media id, "wp:<attachment>" for wp-admin uploads, or
   *  null for a bare URL. */
  id: string | null;
  url: string;
}

/** The Stripe subscription behind a paid directory membership. */
export interface TradersSubscription {
  id: string;
  /** Stripe status: active, trialing, past_due, canceled, unpaid, … */
  status: string;
  /** "YYYY-MM-DD HH:MM:SS" UTC, or null. */
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  /** Minor units. */
  amount: number;
  currency: string;
  /** "£20.00" */
  amount_label: string;
  started_at: string | null;
  ended_at: string | null;
  subscriber_user_id: number | null;
}

export interface BusinessTradersDirectory {
  /** Legacy "please contact me" request (used when Stripe is off). */
  requested: boolean;
  requested_at: string | null;
  /** Listed in the directory right now (paid or comped). */
  member: boolean;
  /** "YYYY-MM-DD" the listing runs until, or null. */
  expires: string | null;
  /** "£20 per year" / "$20 per year" for the business's region. */
  price_label: string;
  /** "£20" / "$20" */
  amount_label: string;
  currency: string;
  amount: number;
  /** Stripe Checkout is available on this region. */
  stripe_enabled: boolean;
  portal_available: boolean;
  /** Listed by an admin without a subscription. */
  manual: boolean;
  subscription: TradersSubscription | null;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

// ─── My Businesses list ───────────────────────────────────────────────

export interface MyBusiness {
  id: number;
  encrypted_id: string;
  title: string;
  tagline: string;
  cover_image: string | null;
  logo: string | null;
  /** Address (unless hidden), else the country name. */
  location: string;
  country: string;
  categories: BusinessCategory[];
  role: "owner";
  role_label: string;
  post_status: string;
  is_published: boolean;
  badge: string;
  traders_directory: { requested: boolean; member: boolean };
  permalink: string;
  site?: EventSite;
}

export interface MyBusinessesResponse {
  success: true;
  businesses: MyBusiness[];
  sites?: EventSite[];
  pagination: Pagination;
}

/** `site` is a FILTER here; omit it to merge both regions. */
export function useMyBusinesses(page: number, perPage = 12, site?: SiteKey) {
  return useQuery<MyBusinessesResponse, Error>({
    queryKey: ["my-businesses", page, perPage, { site }],
    queryFn: () =>
      apiGet<MyBusinessesResponse>(
        `/my-businesses?page=${page}&per_page=${perPage}`,
        { site },
      ),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────

export interface CreateBusinessBody {
  post_title: string;
  business_categories?: string[];
}

export interface CreateBusinessResponse {
  success: true;
  business_id: number;
  encrypted_id: string;
  status: "draft";
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation<
    CreateBusinessResponse,
    Error,
    CreateBusinessBody & { site: SiteKey }
  >({
    mutationFn: ({ site, ...body }) =>
      apiPost<CreateBusinessResponse, CreateBusinessBody>(
        "/business-create",
        body,
        { site },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
  });
}

// ─── Edit (load + save) ───────────────────────────────────────────────

export interface BusinessEditData {
  id: number;
  encrypted_id: string;
  /** Folded in by useBusinessEditQuery - not part of the payload. */
  site: SiteKey;
  title: string;
  tagline: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Category slugs. */
  categories: string[];
  owners: BusinessOwner[];
  logo: BusinessImage | null;
  coverImage: BusinessImage | null;
  gallery: BusinessImage[];
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
  tradersDirectory: BusinessTradersDirectory;
}

export interface ApiBusinessEditResponse {
  success: true;
  business: Omit<BusinessEditData, "site">;
}

export interface BusinessEditResponse {
  success: true;
  business: BusinessEditData;
}

export function useBusinessEditQuery(bid: string, site: SiteKey) {
  return useQuery<BusinessEditResponse, Error>({
    queryKey: ["business-edit", bid, { site }],
    queryFn: async () => {
      const res = await apiGet<ApiBusinessEditResponse>(
        `/business-edit?bid=${encodeURIComponent(bid)}`,
        { site },
      );
      return { ...res, business: { ...res.business, site } };
    },
    enabled: Boolean(bid),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** POST body - ACF-named, partial-safe (only sent keys are written). */
export interface BusinessUpdateBody {
  bid: string;
  site: SiteKey;
  post_title?: string;
  tagline?: string;
  business_country?: string;
  business_categories?: string[];
  business_address?: string;
  latitude?: string;
  longitude?: string;
  hide_address?: boolean;
  business_email?: string;
  business_phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  opening_hours?: string;
  description?: string;
  /** Cloudflare gallery ids in display order. */
  gallery_order?: string[];
  traders_directory_requested?: boolean;
  post_status?: "publish" | "draft";
}

export interface BusinessUpdateResponse {
  success: true;
  business_id: number;
  encrypted_id: string;
  status: "publish" | "draft";
  permalink: string;
  business: Omit<BusinessEditData, "site">;
  traders_request_email_sent?: boolean;
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation<BusinessUpdateResponse, Error, BusinessUpdateBody>({
    mutationFn: ({ site, ...body }) =>
      apiPost<BusinessUpdateResponse, Omit<BusinessUpdateBody, "site">>(
        "/business-update",
        body,
        { site },
      ),
    onSuccess: (_d, body) => {
      qc.invalidateQueries({ queryKey: ["business-edit", body.bid] });
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────

export interface DeleteBusinessResponse {
  success: true;
  business_id: number;
  deleted: true;
}

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation<DeleteBusinessResponse, Error, { bid: string; site: SiteKey }>({
    mutationFn: ({ bid, site }) =>
      apiDelete<DeleteBusinessResponse>(
        `/business-delete?bid=${encodeURIComponent(bid)}`,
        { site },
      ),
    onSuccess: (_d, { bid }) => {
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
      qc.removeQueries({ queryKey: ["business-edit", bid] });
    },
  });
}

// ─── Owners ───────────────────────────────────────────────────────────

export interface BusinessOwnersResponse {
  success: true;
  owners: BusinessOwner[];
  removed_self?: boolean;
}

export function useAddBusinessOwner() {
  const qc = useQueryClient();
  return useMutation<
    BusinessOwnersResponse,
    Error,
    { bid: string; site: SiteKey; email: string }
  >({
    mutationFn: ({ site, ...body }) =>
      apiPost<BusinessOwnersResponse, { bid: string; email: string }>(
        "/business-owner-add",
        body,
        { site },
      ),
    onSuccess: (_d, { bid }) => {
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
    },
  });
}

export function useRemoveBusinessOwner() {
  const qc = useQueryClient();
  return useMutation<
    BusinessOwnersResponse,
    Error,
    { bid: string; site: SiteKey; userId: number }
  >({
    mutationFn: ({ site, bid, userId }) =>
      apiPost<BusinessOwnersResponse, { bid: string; user_id: number }>(
        "/business-owner-remove",
        { bid, user_id: userId },
        { site },
      ),
    onSuccess: (_d, { bid }) => {
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
  });
}

// ─── Options (categories + countries) ─────────────────────────────────

export interface BusinessOptionsResponse {
  success: true;
  categories: BusinessCategory[];
  countries: BusinessCountry[];
  default_country: string;
  traders_directory: { price_label: string };
  site: EventSite;
}

export function useBusinessOptions(site: SiteKey) {
  return useQuery<BusinessOptionsResponse, Error>({
    queryKey: ["business-options", { site }],
    queryFn: () => apiGet<BusinessOptionsResponse>("/business-options", { site }),
    staleTime: 10 * 60_000,
  });
}

// ─── Event Exhibitor Directory (organisers) ───────────────────────────

export interface ExhibitorContact {
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  address: string;
}

export interface ExhibitorBusiness {
  id: number;
  encrypted_id: string;
  title: string;
  tagline: string;
  cover_image: string | null;
  logo: string | null;
  location: string;
  country: string;
  categories: BusinessCategory[];
  post_status: string;
  is_published: boolean;
  traders_directory: { requested: boolean; member: boolean };
  permalink: string;
  contact: ExhibitorContact;
  description_excerpt: string;
}

export interface ExhibitorDirectoryResponse {
  success: true;
  businesses: ExhibitorBusiness[];
  categories: BusinessCategory[];
  site: EventSite;
  pagination: Pagination;
}

export interface ExhibitorDirectoryParams {
  site: SiteKey;
  q?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

export function useExhibitorDirectory(params: ExhibitorDirectoryParams) {
  const { site, q = "", category = "", page = 1, perPage = 24 } = params;
  return useQuery<ExhibitorDirectoryResponse, Error>({
    queryKey: ["exhibitor-directory", { site, q, category, page, perPage }],
    queryFn: () => {
      const search = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      if (q) search.set("q", q);
      if (category) search.set("category", category);
      return apiGet<ExhibitorDirectoryResponse>(
        `/exhibitor-directory?${search.toString()}`,
        { site },
      );
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// ─── Event Traders directory membership (Stripe) ──────────────────────
//
// Checkout is Stripe-hosted: /business-traders-checkout mints a session
// and the browser is sent to its url. Stripe returns the user to the
// editor's Event traders step with ?traders=success&session_id=…, where
// the panel calls /business-traders-sync to record the subscription.

export interface TradersCheckoutResponse {
  success: true;
  url: string;
  session_id: string;
}

export interface TradersMembershipResponse {
  success: true;
  tradersDirectory: BusinessTradersDirectory;
}

/** Where Stripe sends the user afterwards: the editor's Event traders
 *  step (default) or the public /join/traders landing page. */
export type TradersCheckoutReturn = "editor" | "join";

export function useTradersCheckout() {
  return useMutation<
    TradersCheckoutResponse,
    Error,
    { bid: string; site: SiteKey; returnTo?: TradersCheckoutReturn }
  >({
    mutationFn: ({ bid, site, returnTo }) =>
      apiPost<TradersCheckoutResponse, { bid: string; return_to?: TradersCheckoutReturn }>(
        "/business-traders-checkout",
        returnTo ? { bid, return_to: returnTo } : { bid },
        { site },
      ),
  });
}

export function useTradersSync() {
  const qc = useQueryClient();
  return useMutation<
    TradersMembershipResponse,
    Error,
    { bid: string; site: SiteKey; sessionId?: string }
  >({
    mutationFn: ({ bid, site, sessionId }) =>
      apiPost<TradersMembershipResponse, { bid: string; session_id?: string }>(
        "/business-traders-sync",
        sessionId ? { bid, session_id: sessionId } : { bid },
        { site },
      ),
    onSuccess: (_d, { bid }) => {
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
  });
}

function useTradersAction(route: "/business-traders-cancel" | "/business-traders-resume") {
  const qc = useQueryClient();
  return useMutation<TradersMembershipResponse, Error, { bid: string; site: SiteKey }>({
    mutationFn: ({ bid, site }) =>
      apiPost<TradersMembershipResponse, { bid: string }>(route, { bid }, { site }),
    onSuccess: (_d, { bid }) => {
      qc.invalidateQueries({ queryKey: ["business-edit", bid] });
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
    },
  });
}

/** Stop the membership renewing; the listing stays until the period ends. */
export function useTradersCancel() {
  return useTradersAction("/business-traders-cancel");
}

/** Undo a cancellation while the paid period is still running. */
export function useTradersResume() {
  return useTradersAction("/business-traders-resume");
}

/** Stripe's hosted billing portal: card updates, invoices. */
export function useTradersPortal() {
  return useMutation<{ success: true; url: string }, Error, { bid: string; site: SiteKey }>({
    mutationFn: ({ bid, site }) =>
      apiPost<{ success: true; url: string }, { bid: string }>(
        "/business-traders-portal",
        { bid },
        { site },
      ),
  });
}
