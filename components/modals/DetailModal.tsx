"use client";

import { useUI } from "@/context/UIContext";
import { statusPillClass } from "@/lib/utils";
import { XIcon, CheckIcon } from "@/components/ui/Icons";
import type { ShowCar, Club, Trader } from "@/context/types";

function statusLabel(status: string) {
  return status
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ShowCarDetail({ car }: { car: ShowCar }) {
  return (
    <>
      <div className={`detail-photo ${car.photoClass}`}>
        <span className={`showcar-category ${car.category}`}>
          {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
        </span>
      </div>
      <div className="detail-header">
        <div className="detail-title">{car.model}</div>
        <span className="detail-title-reg">{car.reg}</span>
      </div>
      <div className="detail-meta-row">
        <div>
          <span className={`pill ${statusPillClass(car.status)}`}>
            {statusLabel(car.status)}
          </span>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Applicant Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">First name</div>
            <div className="detail-value">{car.ownerFirstName || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Last name</div>
            <div className="detail-value">{car.ownerLastName || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Email</div>
            <div className="detail-value">
              <a href={`mailto:${car.ownerEmail}`}>{car.ownerEmail}</a>
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Phone</div>
            <div className="detail-value mono">{car.ownerPhone}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Instagram</div>
            <div className="detail-value">{car.instagram}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">TikTok</div>
            <div className="detail-value">{car.tiktok}</div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Vehicle Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Category applied</div>
            <div className="detail-value">
              {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Year</div>
            <div className="detail-value mono">{car.year}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Make</div>
            <div className="detail-value">{car.make}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Model</div>
            <div className="detail-value">{car.modelName}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Registration</div>
            <div className="detail-value mono">{car.reg}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Car club member</div>
            <div
              className={`detail-value${car.club === "No" ? " muted" : ""}`}
            >
              {car.club}
            </div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Additional Information</div>
        <div className="detail-description">{car.description}</div>
      </div>
    </>
  );
}

function ClubDetail({ club }: { club: Club }) {
  return (
    <>
      <div className="detail-header no-photo">
        <div className="detail-title">{club.name}</div>
      </div>
      <div className="detail-meta-row">
        <div>
          <span className={`pill ${statusPillClass(club.status)}`}>
            {statusLabel(club.status)}
          </span>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Club Details</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Club name</div>
            <div className="detail-value">{club.name}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Spaces requested</div>
            <div className="detail-value mono">{club.membersAttending}</div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Contact Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Contact name</div>
            <div className="detail-value">{club.contactName}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Phone</div>
            <div className="detail-value mono">{club.contactPhone}</div>
          </div>
          <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
            <div className="detail-label">Email</div>
            <div className="detail-value">
              <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a>
            </div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Additional Information</div>
        <div className="detail-description">{club.description}</div>
      </div>
    </>
  );
}

function TraderDetail({ trader }: { trader: Trader }) {
  return (
    <>
      <div className="detail-header no-photo">
        <div className="detail-title">{trader.name}</div>
      </div>
      <div className="detail-meta-row">
        <div>
          <span className={`pill ${statusPillClass(trader.status)}`}>
            {statusLabel(trader.status)}
          </span>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Trader Details</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Category applied</div>
            <div className="detail-value">{trader.category}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Space required</div>
            <div className="detail-value mono">{trader.pitch}</div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Applicant Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">First name</div>
            <div className="detail-value">
              {trader.contactName.split(" ")[0] || "—"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Last name</div>
            <div className="detail-value">
              {trader.contactName.split(" ").slice(1).join(" ") || "—"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Email</div>
            <div className="detail-value">
              <a href={`mailto:${trader.contactEmail}`}>{trader.contactEmail}</a>
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Phone</div>
            <div className="detail-value mono">{trader.contactPhone}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Instagram</div>
            <div className="detail-value">{trader.instagram}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">TikTok</div>
            <div className="detail-value">{trader.tiktok}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export function DetailModal() {
  const { detail, closeDetail } = useUI();

  if (!detail) return null;

  const isPending =
    (detail.type === "showcar" && detail.data.status === "pending") ||
    (detail.type === "club" && detail.data.status === "pending") ||
    (detail.type === "trader" && detail.data.status === "pending");

  const handleAction = (action: "approve" | "reject") => {
    console.log("Detail action:", action, detail);
    closeDetail();
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDetail();
      }}
    >
      <div
        className="modal detail-modal"
        role="dialog"
        aria-labelledby="detailModalTitle"
        aria-modal="true"
      >
        <button
          type="button"
          className="detail-modal-close"
          onClick={closeDetail}
          aria-label="Close"
        >
          <XIcon />
        </button>

        <div className="detail-scroll">
          {detail.type === "showcar" && <ShowCarDetail car={detail.data} />}
          {detail.type === "club" && <ClubDetail club={detail.data} />}
          {detail.type === "trader" && <TraderDetail trader={detail.data} />}
        </div>

        <div className={`detail-footer${isPending ? "" : " hidden"}`}>
          <button
            type="button"
            className="btn btn-reject"
            onClick={() => handleAction("reject")}
          >
            <XIcon /> Reject
          </button>
          <button
            type="button"
            className="btn btn-approve"
            onClick={() => handleAction("approve")}
          >
            <CheckIcon /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}
