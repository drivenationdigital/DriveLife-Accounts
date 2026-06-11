"use client";

import { useUI } from "@/context/UIContext";
import { EyeIcon, TrashIcon } from "@/components/ui/Icons";
import type { ShowCar } from "@/context/types";

interface ShowCarCardProps {
  car: ShowCar;
  /** Variant: pending cards used to surface approve/reject inline,
   *  but those actions live in the detail modal now — the card just
   *  opens it. Managed cards keep the delete affordance. */
  actions?: "pending" | "managed";
}

/**
 * Application card. Clicking anywhere on the card opens the detail
 * modal, which is where approve / reject happens.
 *
 * Photo behaviour: when the applicant uploaded a car photo we render
 * it as a background image. When they didn't, we fall back to the
 * deterministic gradient placeholder driven by `photoClass` (one of
 * `car-1` … `car-7` depending on application id).
 *
 * Category pill: the text is now the actual ticket name the organiser
 * set (e.g. "Modified", "Concours"). The per-category colour CSS
 * classes (`.classic`, `.retro`, etc.) no longer match — base
 * `.showcar-category` styling still applies.
 */
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
      <div
        className={`showcar-photo ${car.photoUrl ? "" : car.photoClass}`}
        style={
          car.photoUrl
            ? {
                backgroundImage: `url("${car.photoUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {car.category && (
          <span className="showcar-category">{car.category}</span>
        )}
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

          {actions === "managed" && (
            <button
              type="button"
              className="showcar-action-btn delete"
              title="Delete"
              onClick={stopThen(() => {
                if (
                  confirm("Delete this entry? This action cannot be undone.")
                ) {
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
