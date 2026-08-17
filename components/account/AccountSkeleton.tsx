"use client";

/**
 * Loading skeleton for My Account - mirrors the real page shapes (details
 * card with four field rows, password card, notification preferences
 * table, footer) so nothing jumps when the profile lands.
 *
 * Card chrome uses the same Tailwind classes as the page; the shimmer
 * bars are inline-styled with self-contained keyframes so they render
 * correctly regardless of which stylesheets are loaded.
 */
export default function AccountSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8 md:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <style>{`
        @keyframes accountSkelShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <span className="sr-only">Loading your details…</span>

      {/* ── Your details ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <div className="mb-6">
          <Bar w={130} h={20} />
        </div>

        <div className="space-y-5">
          <FieldRowSkeleton labelWidth={90} />
          <FieldRowSkeleton labelWidth={85} />
          <FieldRowSkeleton labelWidth={150} hint />
          <FieldRowSkeleton labelWidth={55} />
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <Bar w={100} h={40} r={8} />
        </div>
      </div>

      {/* ── Password ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <div className="flex items-center justify-between">
          <Bar w={95} h={20} />
          <Bar w={150} h={40} r={8} />
        </div>
      </div>

      {/* ── Notification Preferences ─────────────────────────────── */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-100 md:p-8">
        <div className="mb-6">
          <Bar w={200} h={20} />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 pb-3">
            <span />
            <div className="flex justify-center">
              <Bar w={44} h={14} />
            </div>
            <div className="flex justify-center">
              <Bar w={80} h={14} />
            </div>
          </div>

          <PrefRowSkeleton labelWidth="55%" />
          <PrefRowSkeleton labelWidth="40%" />
        </div>

        <div className="mt-6">
          <Bar w={100} h={40} r={8} />
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <Bar w={110} h={40} r={8} />
        <Bar w="70%" h={12} />
      </div>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────

function FieldRowSkeleton({
  labelWidth,
  hint = false,
}: {
  labelWidth: number;
  hint?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[minmax(160px,220px)_1fr] md:gap-6">
      <div>
        <Bar w={labelWidth} h={14} />
        {hint && (
          <div className="mt-1.5">
            <Bar w={170} h={11} />
          </div>
        )}
      </div>
      <Bar w="100%" h={42} r={8} />
    </div>
  );
}

function PrefRowSkeleton({ labelWidth }: { labelWidth: string }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-ink-100 py-4 last:border-0">
      <Bar w={labelWidth} h={14} />
      <div className="flex justify-center">
        <Bar w={16} h={16} r={4} />
      </div>
      <div className="flex justify-center">
        <Bar w={16} h={16} r={4} />
      </div>
    </div>
  );
}

function Bar({
  w,
  h,
  r = 6,
}: {
  w: number | string;
  h: number;
  r?: number;
}) {
  return (
    <div
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, #f2f1ec 25%, #e7e6e0 50%, #f2f1ec 75%)",
        backgroundSize: "200% 100%",
        animation: "accountSkelShimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}
