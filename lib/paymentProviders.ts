"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "./apiClient";

/**
 * Organiser-owned payment providers (PayPal and Square).
 *
 * Stripe deliberately lives elsewhere (lib/account.ts,
 * useDisconnectStripe): it is a Connect relationship the platform sets
 * up so it can take an application fee on every charge. PayPal and
 * Square have no split - the organiser's own merchant account takes
 * the whole amount - so all the backend stores is a set of API
 * credentials the organiser pastes in from their provider dashboard.
 *
 * Secrets are write-only across this boundary. The read endpoint
 * returns connectedness plus a masked hint and never the value, so a
 * saved credential can be replaced but never read back.
 */

export type PaymentProviderKey = "paypal" | "square" | "mollie";

/**
 * Which processor sits behind the buyer's single "Card" button.
 * Stripe is the fallback when no other card processor is connected.
 */
export type CardProcessor = "stripe" | "square" | "mollie";

export interface PaypalStatus {
  provider: "paypal";
  connected: boolean;
  /**
   * True when linked through PayPal's onboarding rather than pasted
   * credentials. Connected accounts store no secret at all - only a
   * merchant id - because the platform's own credentials authenticate
   * and the organiser is named as the payee.
   */
  connect: boolean;
  merchant_id: string;
  /** Onboarded, but PayPal can't pay them yet - they must finish. */
  needs_attention: boolean;
  environment: "sandbox" | "live";
  /** Last four characters of the stored client id, or "". */
  client_id_hint: string;
}

export interface SquareStatus {
  provider: "square";
  connected: boolean;
  /**
   * True when linked through the Square connect flow rather than
   * pasted credentials. Decides whether Settings offers a Connect
   * button or the manual credential form.
   */
  oauth: boolean;
  merchant_id: string;
  environment: "sandbox" | "production";
  application_id_hint: string;
  /** Not a secret - Square location ids are public identifiers. */
  location_id: string;
}

export interface MollieStatus {
  provider: "mollie";
  connected: boolean;
  /** True when linked through Mollie Connect rather than an API key. */
  oauth: boolean;
  /** The website profile payments are created against. */
  profile_id: string;
  /**
   * For an API key this comes from its test_/live_ prefix. For OAuth
   * the credential says nothing about it, so the platform's own
   * testmode setting decides.
   */
  environment: "test" | "live";
  api_key_hint: string;
}

export interface PaymentProvidersResponse {
  status: "success";
  providers: {
    paypal: PaypalStatus;
    square: SquareStatus;
    mollie: MollieStatus;
  };
  /** What the buyer's "Card" button will actually use. */
  card_processor: CardProcessor;
  /** True when a Stripe Connect account is linked. */
  stripe_connected: boolean;
}

export interface SavePaypalBody {
  provider: "paypal";
  environment: "sandbox" | "live";
  client_id: string;
  /** Blank means "keep the stored secret" - see the PHP route. */
  client_secret: string;
}

export interface SaveSquareBody {
  provider: "square";
  environment: "sandbox" | "production";
  application_id: string;
  location_id: string;
  /** Blank means "keep the stored token". */
  access_token: string;
}

export interface SaveMollieBody {
  provider: "mollie";
  /** Blank means "keep the stored key". */
  api_key: string;
}

export type SaveProviderBody =
  | SavePaypalBody
  | SaveSquareBody
  | SaveMollieBody;

export interface SaveProviderResponse {
  status: "success";
  provider: PaypalStatus | SquareStatus | MollieStatus;
  card_processor: CardProcessor;
}

export function usePaymentProviders() {
  return useQuery<PaymentProvidersResponse, Error>({
    queryKey: ["payment-providers"],
    queryFn: () =>
      apiPost<PaymentProvidersResponse, Record<string, never>>(
        "/payment-providers",
        {},
      ),
    staleTime: 30_000,
  });
}

/**
 * Save one provider's credentials. The server checks them against
 * PayPal/Square before storing, so a rejected promise here means the
 * credentials themselves are wrong - show its message rather than a
 * generic failure.
 */
export function useSavePaymentProvider() {
  const qc = useQueryClient();
  return useMutation<SaveProviderResponse, Error, SaveProviderBody>({
    mutationFn: (body) =>
      apiPost<SaveProviderResponse, SaveProviderBody>(
        "/payment-providers/save",
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-providers"] });
    },
  });
}

/**
 * Start a Square connection.
 *
 * The server mints the authorize URL, including the one-time `state`
 * bound to this user, so the browser only ever receives a URL to
 * visit. The organiser approves on Square's own page and is returned
 * to `return_to` with `?square=connected|cancelled|error`.
 */
export function useSquareConnectUrl() {
  return useMutation<
    { status: "success"; url: string },
    Error,
    { return_to: string }
  >({
    mutationFn: (body) =>
      apiPost<{ status: "success"; url: string }, { return_to: string }>(
        "/payment-providers/square/connect-url",
        body,
      ),
  });
}

/**
 * Start PayPal onboarding.
 *
 * The URL PayPal returns EXPIRES AFTER ONE USE, so this is called per
 * attempt and the result must never be cached or reused.
 */
export function usePaypalConnectUrl() {
  return useMutation<
    { status: "success"; url: string },
    Error,
    { return_to: string }
  >({
    mutationFn: (body) =>
      apiPost<{ status: "success"; url: string }, { return_to: string }>(
        "/payment-providers/paypal/connect-url",
        body,
      ),
  });
}

/** Start a Mollie connection. */
export function useMollieConnectUrl() {
  return useMutation<
    { status: "success"; url: string },
    Error,
    { return_to: string }
  >({
    mutationFn: (body) =>
      apiPost<{ status: "success"; url: string }, { return_to: string }>(
        "/payment-providers/mollie/connect-url",
        body,
      ),
  });
}

export function useDisconnectPaymentProvider() {
  const qc = useQueryClient();
  return useMutation<
    SaveProviderResponse,
    Error,
    { provider: PaymentProviderKey }
  >({
    mutationFn: (body) =>
      apiPost<SaveProviderResponse, { provider: PaymentProviderKey }>(
        "/payment-providers/disconnect",
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-providers"] });
    },
  });
}
