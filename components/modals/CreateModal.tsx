"use client";

import { useUI } from "@/context/UIContext";
import {
  CalendarIcon,
  CarIcon,
  BuildingIcon,
  XIcon,
  ChevRightIcon,
} from "@/components/ui/Icons";
import { useRouter } from "next/navigation";

type CreateType = "event" | "club" | "venue";

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
];

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
    }

    closeCreateModal();
  };

  return (
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
  );
}
