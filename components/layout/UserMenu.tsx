"use client";

import { useAuth } from "@/context/AuthContext";
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

  const name = user?.display_name ?? "Signed in";
  const email = user?.email ?? "";
  const initials = initialsOf(user?.display_name, user?.email);

  return (
    <Dropdown>
      <DropdownTrigger className="avatar-btn" ariaLabel="Account menu">
        <div className="avatar">{initials}</div>
      </DropdownTrigger>
      <DropdownMenu className="user-menu">
        <div className="user-info">
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{name}</div>
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
