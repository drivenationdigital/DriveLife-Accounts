"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * My Account — read-only profile view for the signed-in user.
 *
 * Source of truth is whatever's in AuthContext (hydrated from the
 * cookie on mount, refreshed on /next-dash-login). No edit endpoint
 * exists yet, so this page is intentionally read-only: it displays
 * the AuthUser fields (id, display_name, email, roles) and offers a
 * sign-out action.
 *
 * When a profile-update route lands on the WP side, this page is the
 * obvious place to grow an edit form. The layout is already set up
 * for label/value rows.
 */
export default function AccountPage() {
  const { user, signOut } = useAuth();

  // Defensive — dashboard layout sits behind middleware so user
  // should always be present, but render a small placeholder rather
  // than blowing up if the cookie was cleared mid-session before
  // the unauthorizedHandler kicked in.
  if (!user) {
    return (
      <div className="section">
        <div className="section-header">
          <div>
            <div className="section-title">My Account</div>
            <div className="section-subtitle">Loading your details…</div>
          </div>
        </div>
      </div>
    );
  }

  const initials = initialsOf(user.display_name, user.email);

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">My Account</div>
          <div className="section-subtitle">
            Your profile and sign-in details.
          </div>
        </div>
      </div>

      <div className="section-body">
        {/* ── Profile card ───────────────────────────────────────── */}
        <div style={profileStyle}>
          <div className="avatar" style={avatarStyle}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={nameStyle}>{user.display_name || "Signed in"}</div>
            <div style={emailStyle}>{user.email}</div>
          </div>
        </div>

        {/* ── Detail rows ────────────────────────────────────────── */}
        <dl style={detailListStyle}>
          <DetailRow label="User ID" value={String(user.id)} mono />
          <DetailRow label="Display name" value={user.display_name || "—"} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow
            label="Roles"
            value={
              user.roles.length === 0 ? (
                "—"
              ) : (
                <div style={chipRowStyle}>
                  {user.roles.map((role) => (
                    <span key={role} style={chipStyle}>
                      {role}
                    </span>
                  ))}
                </div>
              )
            }
          />
        </dl>

        {/* ── Actions ────────────────────────────────────────────── */}
        <div style={actionsStyle}>
          <button type="button" className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
          <p style={hintStyle}>
            Editing your profile isn’t available yet — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Small bits
// ============================================================

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div style={rowStyle}>
      <dt style={dtStyle}>{label}</dt>
      <dd
        style={{
          ...ddStyle,
          ...(mono
            ? { fontFamily: "var(--font-mono, ui-monospace, monospace)" }
            : null),
        }}
      >
        {value}
      </dd>
    </div>
  );
}

/** Same logic as UserMenu's initials helper — inlined here to avoid
 *  exporting from a component file. Two-letter result, uppercase. */
function initialsOf(
  name: string | undefined,
  email: string | undefined,
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

// ============================================================
// Styles — inline to match login/page.tsx convention; the dashboard
// section chrome above uses the global .section / .btn classes.
// ============================================================

const profileStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  paddingBottom: 20,
  marginBottom: 20,
  borderBottom: "1px solid var(--border)",
};

const avatarStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  fontSize: 18,
  flexShrink: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "var(--ink)",
  marginBottom: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emailStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const detailListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 180px) 1fr",
  gap: 16,
  padding: "12px 0",
  borderBottom: "1px solid var(--border)",
  alignItems: "baseline",
};

const dtStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const ddStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "var(--ink)",
  wordBreak: "break-word",
};

const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--gold-deep)",
  background: "var(--gold-soft)",
  borderRadius: 999,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginTop: 24,
  flexWrap: "wrap",
};

const hintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  color: "var(--muted)",
};
