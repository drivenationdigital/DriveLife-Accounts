"use client";

import { useUI } from "@/context/UIContext";
import { statusPillClass } from "@/lib/utils";
import { XIcon, CheckIcon } from "@/components/ui/Icons";
import type { ShowCar, Club, Trader } from "@/context/types";
import { useApproveShowCarApplication, useRejectShowCarApplication } from "@/lib/showCarApplications";
import { useApproveClubApplication, useRejectClubApplication } from "@/lib/clubApplications";

function statusLabel(status: string) {
  return status
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ShowCarDetail({ car }: { car: ShowCar }) {
  return (
    <>
      <div
        className={`detail-photo ${car.photoUrl ? "" : car.photoClass}`}
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
            <div className="detail-value">{car.category || "—"}</div>
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
            <div className={`detail-value${car.club === "No" ? " muted" : ""}`}>
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

export function DetailModal() {
  const { detail, closeDetail } = useUI();

  // Mutations — instantiated unconditionally (hooks rule). The active
  // pair is picked by detail.type below. Trader still falls through
  // to the legacy stub.
  const showCarApprove = useApproveShowCarApplication();
  const showCarReject = useRejectShowCarApplication();
  const clubApprove = useApproveClubApplication();
  const clubReject = useRejectClubApplication();

  if (!detail) return null;

  const isShowCar = detail.type === "showcar";
  const isClub = detail.type === "club";
  const isActionable = isShowCar || isClub; // has real approve/reject wired
  const isPending =
    (isShowCar && detail.data.status === "pending") ||
    (isClub && detail.data.status === "pending") ||
    (detail.type === "trader" && detail.data.status === "pending");

  // Pick the active mutation pair for the current detail type.
  const approver = isClub ? clubApprove : showCarApprove;
  const rejecter = isClub ? clubReject : showCarReject;

  const isApproving = isActionable && approver.isPending;
  const isRejecting = isActionable && rejecter.isPending;
  const isMutating = isApproving || isRejecting;

  // Success copy differs by type + outcome. Both flows distinguish
  // the paid/awaiting-purchase branch ("emailed a link") from the
  // auto-confirmed branch.
  const successMessage = (() => {
    if (!isActionable) return null;
    if (approver.isSuccess) {
      if (isClub) {
        // Clubs have one outcome now: confirmed. Every approved club
        // is emailed the unique member link to share.
        return "Club confirmed. They've been emailed a unique link to share with their members.";
      }
      const status = approver.data.status; // "approved" | "paid"
      return status === "paid"
        ? "Application approved and auto-confirmed."
        : "Application approved. The applicant has been emailed a ticket link.";
    }
    if (rejecter.isSuccess) {
      return isClub ? "Club application rejected." : "Application rejected.";
    }
    return null;
  })();

  const mutationError = isActionable
    ? (approver.error ?? rejecter.error)
    : null;

  const handleClose = () => {
    // Reset whichever pair might be dirty so reopening starts clean.
    showCarApprove.reset();
    showCarReject.reset();
    clubApprove.reset();
    clubReject.reset();
    closeDetail();
  };

  const handleApprove = () => {
    if (isActionable) {
      approver.mutate({ applicationId: Number(detail.data.id) });
    } else {
      // Trader stub — unchanged from before.
      console.log("Detail action: approve", detail);
      closeDetail();
    }
  };

  const handleReject = () => {
    if (isActionable) {
      rejecter.mutate({ applicationId: Number(detail.data.id) });
    } else {
      console.log("Detail action: reject", detail);
      closeDetail();
    }
  };

  // Footer renders one of three states: success banner, action
  // buttons (for pending applications), or hidden.
  const renderFooter = () => {
    if (successMessage) {
      return (
        <div className="detail-footer">
          <div
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              background: "color-mix(in srgb, var(--success) 12%, transparent)",
              color: "var(--success)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            role="status"
          >
            <CheckIcon />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      );
    }

    if (!isPending) return null;

    return (
      <div
        className="detail-footer"
        style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}
      >
        {mutationError && (
          <div
            style={{
              fontSize: 13,
              color: "var(--danger, #c62828)",
              padding: "6px 4px",
            }}
            role="alert"
          >
            {mutationError.message || "Something went wrong. Try again."}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-reject"
            onClick={handleReject}
            disabled={isMutating}
          >
            {isRejecting ? (
              <>
                <i
                  className="fa-solid fa-spinner fa-spin"
                  aria-hidden
                  style={{ marginRight: 6 }}
                />
                Rejecting…
              </>
            ) : (
              <>
                <XIcon /> Reject
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-approve"
            onClick={handleApprove}
            disabled={isMutating}
          >
            {isApproving ? (
              <>
                <i
                  className="fa-solid fa-spinner fa-spin"
                  aria-hidden
                  style={{ marginRight: 6 }}
                />
                Approving…
              </>
            ) : (
              <>
                <CheckIcon /> Accept
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isMutating) handleClose();
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
          onClick={handleClose}
          aria-label="Close"
          disabled={isMutating}
        >
          <XIcon />
        </button>

        <div className="detail-scroll">
          {detail.type === "showcar" && <ShowCarDetail car={detail.data} />}
          {detail.type === "club" && <ClubDetail club={detail.data} />}
          {detail.type === "trader" && <TraderDetail trader={detail.data} />}
        </div>

        {renderFooter()}
      </div>
    </div>
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

