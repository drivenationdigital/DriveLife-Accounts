"use client";

import { useEventData } from "@/context/EventContext";
import { formatNotification } from "@/lib/utils";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import {
  BellIcon,
  CarIcon,
  OrderIcon,
  UsersIcon,
  WarnIcon,
  CheckIcon,
} from "@/components/ui/Icons";
import type { Notification } from "@/context/types";

function iconFor(kind: Notification["kind"]) {
  switch (kind) {
    case "car":   return <CarIcon />;
    case "order": return kind === "order" ? <OrderIcon /> : <CheckIcon />;
    case "club":  return <UsersIcon />;
    case "warn":  return <WarnIcon />;
  }
}

export function NotificationsMenu() {
  const { notifications } = useEventData();
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <Dropdown>
      <DropdownTrigger className="icon-btn" ariaLabel="Notifications">
        <BellIcon />
        {hasUnread && <span className="dot" />}
      </DropdownTrigger>
      <DropdownMenu className="notif-menu">
        <div className="notif-header">
          <div className="notif-header-title">Notifications</div>
          <button className="notif-header-action">Mark all read</button>
        </div>
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item${n.unread ? " unread" : ""}`}
            >
              <div className={`notif-avatar ${n.kind}`}>{iconFor(n.kind)}</div>
              <div className="notif-body">
                <div
                  className="notif-text"
                  dangerouslySetInnerHTML={{ __html: formatNotification(n.message) }}
                />
                <div className="notif-time">{n.time}</div>
              </div>
              {n.unread && <div className="notif-unread-dot" />}
            </div>
          ))}
        </div>
        <a href="#" className="notif-footer">
          View all notifications
        </a>
      </DropdownMenu>
    </Dropdown>
  );
}
