/**
 * Ref-counted body scroll lock.
 *
 * More than one overlay can be up at a time - the welcome modal with an
 * action loader over the top of it, or a detail modal whose approve
 * button opens the shared confirm/loader flow. When each one captures
 * and restores `document.body.style.overflow` on its own, whichever
 * tears down last wins, and the page can be left locked after
 * everything has closed.
 *
 * Counting instead means the page unlocks exactly when the last holder
 * lets go:
 *
 *   useEffect(() => {
 *     if (!open) return;
 *     return lockBodyScroll();
 *   }, [open]);
 */

let locks = 0;
let previousOverflow = "";

/** Lock the page. Call the returned function to release; safe to call twice. */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (locks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.body.style.overflow = previousOverflow;
    }
  };
}
