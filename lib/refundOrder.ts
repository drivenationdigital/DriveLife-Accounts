/**
 * Stripe refund - full refund of an order.
 *
 * Posts to the standalone get-tickets endpoint (NOT the WP REST
 * namespace), which has the Stripe SDK bootstrapped. Sends the
 * dashboard JWT so the endpoint can verify admin/organiser access.
 *
 * Endpoint base: NEXT_PUBLIC_GET_TICKETS_URL (e.g.
 *   https://carevents.com/uk/get-tickets) - falls back to the live path.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readTokenClient } from "./authCookies";

interface RefundResponse {
  success: boolean;
  refund_id?: string;
  amount?: number;
  currency?: string;
  order_status?: string;
  error?: string;
  code?: string;
}

function refundEndpoint(): string {
  const base = (
    process.env.NEXT_PUBLIC_GET_TICKETS_URL ||
    "https://www.carevents.com/uk/get-tickets"
  ).replace(/\/$/, "");
  return `${base}/refund-order.php`;
}

/**
 * Issue a full Stripe refund for an order. On success, refreshes the
 * orders list + this order's detail so the new "refunded" status shows.
 */
export function useRefundOrder() {
  const qc = useQueryClient();
  return useMutation<RefundResponse, Error, { oid: string }>({
    mutationFn: async ({ oid }) => {
      const token = readTokenClient();

      let res: Response;
      try {
        res = await fetch(refundEndpoint(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ oid, token }),
        });
      } catch {
        // fetch() only throws for network-layer failures (offline, DNS,
        // CORS block, cert error) - never for a 4xx/5xx, which resolve
        // normally. So this is not a refund error the server reported.
        throw new Error(
          "Couldn't reach the refund service. Check your connection and try again.",
        );
      }

      // Parse the body; tolerate a non-JSON error page (e.g. a PHP fatal
      // or an HTML 500) so we don't surface a JSON-parse error instead of
      // something readable.
      let data: RefundResponse | null = null;
      try {
        data = (await res.json()) as RefundResponse;
      } catch {
        data = null;
      }

      if (!res.ok || !data || !data.success) {
        // Prefer the server's own message; fall back to a status-based one.
        const serverMessage = data?.error;
        throw new Error(
          serverMessage ||
            `Refund failed (${res.status}${res.statusText ? " " + res.statusText : ""}).`,
        );
      }

      return data;
    },
    onSuccess: async (_d, { oid }) => {
      await qc.invalidateQueries({
        queryKey: ["event-orders"],
        refetchType: "active",
      });
      await qc.invalidateQueries({ queryKey: ["order-detail", oid] });
    },
  });
}
