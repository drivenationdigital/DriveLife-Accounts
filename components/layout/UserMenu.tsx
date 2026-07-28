"use client";

import { useAuth } from "@/context/AuthContext";
import { useAccount } from "@/lib/account";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
} from "@/components/ui/Dropdown";
import {
  UserIcon,
  SettingsIcon,
  HelpIcon,
  LogoutIcon,
} from "@/components/ui/Icons";

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

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { data } = useAccount();
  const account = data?.account;

  // Prefer the richer account profile; fall back to auth while it loads.
  const fullName =
    account && (account.first_name || account.last_name)
      ? `${account.first_name} ${account.last_name}`.trim()
      : undefined;
  // The dropdown's primary line is the username (e.g. "keshanj").
  const username = account?.username || user?.display_name || "Signed in";
  const email = account?.email ?? user?.email ?? "";
  const profileImage = account?.profile_image || "";
  const initials = initialsOf(fullName ?? user?.display_name, email);

  return (
    <Dropdown>
      <DropdownTrigger className="avatar-btn" ariaLabel="Account menu">
        {profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImage}
            alt=""
            className="avatar"
            style={{
              width: 36,
              height: 36,
              borderRadius: "9999px",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div className="avatar">{initials}</div>
        )}
      </DropdownTrigger>
      <DropdownMenu className="user-menu">
        <div className="user-info">
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{username}</div>
            <div className="user-email">{email}</div>
          </div>
        </div>
        <DropdownItem as="a" href="/account">
          <UserIcon /> My Account
        </DropdownItem>
        <DropdownItem as="a" href="/settings">
          <SettingsIcon /> Settings
        </DropdownItem>
        <DropdownItem as="a" href="#">
          <HelpIcon /> Help &amp; Support
        </DropdownItem>
        <DropdownItem danger onClick={signOut}>
          <LogoutIcon /> Log out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
