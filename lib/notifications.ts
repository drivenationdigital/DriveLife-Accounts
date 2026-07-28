/**
 * Notifications — API.
 *
 *   GET  /notifications                → list + unread count
 *   GET  /notifications/unread-count   → badge count (cheap poll)
 *   POST /notifications/read           → mark one, or all, read
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  date: string;
  date_iso: string;
}

interface NotificationsPage {
  success: true;
  notifications: NotificationItem[];
  unread_count: number;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

interface UnreadCountResponse {
  success: true;
  unread_count: number;
}

interface MarkReadResponse {
  success: true;
  marked: number;
  unread_count: number;
}

const PER_PAGE = 20;

/**
 * Paginated notifications (infinite scroll). Page 1 also carries the
 * unread count, which the screen uses for its header.
 *
 * Pass `{ enabled: false }` to defer fetching (e.g. the bell dropdown
 * only loads the list once it's opened).
 */
export function useNotifications(opts: { enabled?: boolean } = {}) {
  return useInfiniteQuery<NotificationsPage, Error>({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<NotificationsPage>(
        `/notifications?page=${pageParam}&per_page=${PER_PAGE}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.has_more ? last.pagination.page + 1 : undefined,
    enabled: opts.enabled ?? true,
  });
}

/**
 * Just the unread count, for the header bell badge. Polls periodically
 * so the badge stays roughly live without opening the panel.
 */
export function useUnreadCount() {
  return useQuery<UnreadCountResponse, Error>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiGet<UnreadCountResponse>("/notifications/unread-count"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Mark notifications read. Pass an id for one, or nothing for all.
 * Invalidates both the list and the badge count.
 */
export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<MarkReadResponse, Error, { id?: number } | void>({
    mutationFn: (vars) =>
      apiPost<MarkReadResponse, { id?: number }>(
        "/notifications/read",
        vars && vars.id ? { id: vars.id } : {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
