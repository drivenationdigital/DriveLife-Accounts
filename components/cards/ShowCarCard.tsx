"use client";

import { useUI } from "@/context/UIContext";
import { EyeIcon, CheckIcon, XIcon, TrashIcon } from "@/components/ui/Icons";
import type { ShowCar } from "@/context/types";

interface ShowCarCardProps {
  car: ShowCar;
  /** Which action buttons to show — pending cars get approve/reject, others get delete. */
  actions?: "pending" | "managed";
}

export function ShowCarCard({ car, actions = "pending" }: ShowCarCardProps) {
  const { openDetail } = useUI();

  const openView = () => openDetail({ type: "showcar", data: car });

  const stopThen = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      className="showcar-card"
      onClick={openView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openView();
        }
      }}
    >
      <div className={`showcar-photo ${car.photoClass}`}>
        <span className={`showcar-category ${car.category}`}>
          {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
        </span>
      </div>
      <div className="showcar-model">{car.model}</div>
      <span className="showcar-reg">{car.reg}</span>
      <div className="showcar-owner">
        {car.ownerFirstName} {car.ownerLastName}
      </div>
      <div className="showcar-email">{car.ownerEmail}</div>

      <div className="showcar-date">
        <span>{car.appliedLabel}</span>
        <div className="showcar-actions">
          <button
            type="button"
            className="showcar-action-btn view"
            title="View details"
            onClick={stopThen(openView)}
          >
            <EyeIcon />
          </button>

          {actions === "pending" ? (
            <>
              <button
                type="button"
                className="showcar-action-btn approve"
                title="Approve"
                onClick={stopThen(() => console.log("approve", car.id))}
              >
                <CheckIcon />
              </button>
              <button
                type="button"
                className="showcar-action-btn reject"
                title="Reject"
                onClick={stopThen(() => console.log("reject", car.id))}
              >
                <XIcon />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="showcar-action-btn delete"
              title="Delete"
              onClick={stopThen(() => {
                if (confirm("Delete this entry? This action cannot be undone.")) {
                  console.log("delete", car.id);
                }
              })}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
