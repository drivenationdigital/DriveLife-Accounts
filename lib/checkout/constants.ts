/**
 * Checkout constants shared by BOTH the client and the server.
 *
 * Deliberately has no "use client" directive, and must not gain one.
 *
 * lib/checkout/api.ts is a client module, so importing a value from it
 * into a server file (the /api/checkout route handler) does not yield
 * the value - Next hands back a client-reference proxy instead. That
 * proxy stringifies into an error-throwing function stub, so
 * interpolating it into a template literal silently produces garbage
 * rather than failing loudly:
 *
 *   `?${MOLLIE_RETURN_PARAM}=1`
 *     -> "?function() { throw new Error(\"Attempted to call
 *         MOLLIE_RETURN_PARAM() from the server...\"); }=1"
 *
 * That is exactly what happened to the Mollie return URL, and it
 * surfaced only as a confusing "no valid return URL" from PHP. Anything
 * needed on both sides of the boundary belongs here.
 */

/** Query-string marker the checkout page looks for when Mollie returns. */
export const MOLLIE_RETURN_PARAM = "mollie_return";
