"use client";

import { useUI } from "@/context/UIContext";
import {
  CalendarIcon,
  CarIcon,
  BuildingIcon,
  StoreIcon,
  XIcon,
  ChevRightIcon,
} from "@/components/ui/Icons";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type CreateType = "event" | "club" | "venue" | "business";

const options: Array<{
  type: CreateType;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    type: "event",
    title: "Create Event",
    desc: "Set up a new show, meet or rally",
    icon: <CalendarIcon />,
  },
  {
    type: "club",
    title: "Create Car Club",
    desc: "Register a new club page and invite members",
    icon: <CarIcon />,
  },
  {
    type: "venue",
    title: "Create Venue",
    desc: "Add a new venue for events and meets",
    icon: <BuildingIcon />,
  },
  {
    type: "business",
    title: "Create Business",
    desc: "List a trader, service or specialist in the directory",
    icon: <StoreIcon />,
  },
];

/**
 * Opens the create popup when the page is loaded with `?create` on the
 * query string (e.g. `/?create=1`), so marketing links and the main site
 * can deep-link straight to "What would you like to create?". The flag
 * is dropped from the URL once consumed so a refresh, Back, or a shared
 * link copied afterwards doesn't reopen it. Sits under Suspense because
 * useSearchParams needs a boundary in a layout-level client component.
 */
function CreateModalUrlTrigger() {
  const search = useSearchParams();
  const { openCreateModal } = useUI();
  const wantsCreate = search?.has("create") ?? false;

  useEffect(() => {
    if (!wantsCreate) return;
    openCreateModal();
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash
    );
  }, [wantsCreate, openCreateModal]);

  return null;
}

export function CreateModal() {
  const router = useRouter();
  const { createModalOpen, closeCreateModal } = useUI();

  const handleCreate = (type: CreateType) => {
    switch (type) {
      case "event":
        router.push("/events/create");
        break;
      case "club":
        router.push("/club/create");
        break;
      case "venue":
        router.push("/venue/create");
        break;
      case "business":
        router.push("/business/create");
        break;
    }

    closeCreateModal();
  };

  return (
    <>
    <Suspense fallback={null}>
      <CreateModalUrlTrigger />
    </Suspense>
    <div
      className={`modal-backdrop${createModalOpen ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCreateModal();
      }}
    >
      <div className="modal" role="dialog" aria-labelledby="createModalTitle" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title" id="createModalTitle">
            What would you like to create?
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={closeCreateModal}
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        <div className="modal-body">
          <div className="create-options">
            {options.map((opt) => (
              <button
                key={opt.type}
                type="button"
                className="create-option"
                onClick={() => handleCreate(opt.type)}
              >
                <div className="create-option-icon">{opt.icon}</div>
                <div className="create-option-text">
                  <div className="create-option-title">{opt.title}</div>
                  <div className="create-option-desc">{opt.desc}</div>
                </div>
                <span className="create-option-chev">
                  <ChevRightIcon />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
