"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import type { DetailPayload, TabKey } from "./types";

interface UIContextValue {
  // Sidebar
  sidebarMobileOpen: boolean;
  sidebarDesktopHidden: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Tabs
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;

  // Create modal
  createModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Detail modal
  detail: DetailPayload | null;
  openDetail: (payload: DetailPayload) => void;
  closeDetail: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarDesktopHidden, setSidebarDesktopHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);

  const isMobile = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 900px)").matches,
    []
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile()) {
      setSidebarMobileOpen((v) => !v);
    } else {
      setSidebarDesktopHidden((v) => !v);
    }
  }, [isMobile]);

  const closeSidebar = useCallback(() => setSidebarMobileOpen(false), []);
  const openCreateModal = useCallback(() => setCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setCreateModalOpen(false), []);
  const openDetail = useCallback((p: DetailPayload) => setDetail(p), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  // Close mobile drawer when resizing up to desktop
  useEffect(() => {
    const onResize = () => {
      if (!window.matchMedia("(max-width: 900px)").matches) {
        setSidebarMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close everything on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarMobileOpen(false);
        setCreateModalOpen(false);
        setDetail(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Body-lock when any modal is open. Ref-counted so the shared action
  // loader, which locks too, can't fight this one on the way out.
  useEffect(() => {
    if (!createModalOpen && detail === null) return;
    return lockBodyScroll();
  }, [createModalOpen, detail]);

  // Reflect sidebar state on <body> to match original global CSS selectors.
  useEffect(() => {
    document.body.classList.toggle("sidebar-mobile-open", sidebarMobileOpen);
    document.body.classList.toggle(
      "sidebar-desktop-hidden",
      sidebarDesktopHidden
    );
  }, [sidebarMobileOpen, sidebarDesktopHidden]);

  const value = useMemo<UIContextValue>(
    () => ({
      sidebarMobileOpen,
      sidebarDesktopHidden,
      toggleSidebar,
      closeSidebar,
      activeTab,
      setActiveTab,
      createModalOpen,
      openCreateModal,
      closeCreateModal,
      detail,
      openDetail,
      closeDetail,
    }),
    [
      sidebarMobileOpen,
      sidebarDesktopHidden,
      toggleSidebar,
      closeSidebar,
      activeTab,
      createModalOpen,
      openCreateModal,
      closeCreateModal,
      detail,
      openDetail,
      closeDetail,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within <UIProvider>");
  return ctx;
}
