"use client";

import { useEffect, useRef, useState } from "react";

import { useUI } from "@/context/UIContext";
import { statusPillClass } from "@/lib/utils";
import { XIcon, CheckIcon, EditIcon } from "@/components/ui/Icons";
import type { ShowCar, Club, Trader } from "@/context/types";
import { useApproveShowCarApplication, useRejectShowCarApplication } from "@/lib/showCarApplications";
import { useApproveClubApplication, useRejectClubApplication, useUpdateClubSpaces } from "@/lib/clubApplications";
import { useApproveTraderApplication, useConfirmTraderApplication, useRejectTraderApplication } from "@/lib/traderApplications";
import { useAction } from "@/context/ActionContext";

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
            <div className="detail-value">{car.ownerFirstName || "-"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Last name</div>
            <div className="detail-value">{car.ownerLastName || "-"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Email</div>
            <div className="detail-value">
              <a href={`mailto:${car.ownerEmail}`}>{car.ownerEmail}</a>
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Phone</div>
            <div className="detail-value mono">
              {car.ownerPhone ? (
                <a href={`tel:${car.ownerPhone.replace(/\s+/g, "")}`}>
                  {car.ownerPhone}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Vehicle Information</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Category applied</div>
            <div className="detail-value">{car.category || "-"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Year</div>
            <div className={`detail-value mono${car.year ? "" : " muted"}`}>
              {car.year || "-"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Make</div>
            <div className="detail-value">{car.make || "-"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Model</div>
            <div className="detail-value">{car.modelName || "-"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Registration</div>
            <div className={`detail-value mono${car.reg ? "" : " muted"}`}>
              {car.reg || "-"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Colour</div>
            <div className={`detail-value${car.color ? "" : " muted"}`}>
              {car.color || "-"}
            </div>
          </div>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-section-title">Car Club</div>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Attending with a club</div>
            <div className={`detail-value${car.clubAttending ? "" : " muted"}`}>
              {car.clubAttending ? "Yes" : "No"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Club name</div>
            <div className={`detail-value${car.club ? "" : " muted"}`}>
              {car.club || "-"}
            </div>
          </div>
          <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
            <div className="detail-label">Instagram</div>
            <div className={`detail-value${car.clubInstagram ? "" : " muted"}`}>
              {car.clubInstagram ? (
                <a
                  href={`https://instagram.com/${car.clubInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{car.clubInstagram}
                </a>
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>
      </div>
      {car.description && (
        <div className="detail-section">
          <div className="detail-section-title">Additional Information</div>
          <div className="detail-description">{car.description}</div>
        </div>
      )}
    </>
  );
}

export function DetailModal() {
  const { detail, closeDetail } = useUI();

  // Mutations - instantiated unconditionally (hooks rule). The active
  // pair is picked by detail.type below. Trader still falls through
  // to the legacy stub.
  const showCarApprove = useApproveShowCarApplication();
  const showCarReject = useRejectShowCarApplication();
  const clubApprove = useApproveClubApplication();
  const clubReject = useRejectClubApplication();
  const traderApprove = useApproveTraderApplication();
  const traderReject = useRejectTraderApplication();
  const traderConfirm = useConfirmTraderApplication();
  const runAction = useAction();

  if (!detail) return null;

  const isShowCar = detail.type === "showcar";
  const isClub = detail.type === "club";
  const isTrader = detail.type === "trader";
  const isActionable = isShowCar || isClub || isTrader;
  const isPending =
    (isShowCar && detail.data.status === "pending") ||
    (isClub && detail.data.status === "pending") ||
    (isTrader && detail.data.status === "pending");

  // An approved trader can be marked confirmed (mainly in_person,
  // after payment clears). Only traders expose this extra action.
  const canConfirm = isTrader && detail.data.status === "approved";

  // Pick the active mutation pair for the current detail type.
  const approver = isClub
    ? clubApprove
    : isTrader
      ? traderApprove
      : showCarApprove;
  const rejecter = isClub
    ? clubReject
    : isTrader
      ? traderReject
      : showCarReject;

  const isApproving = isActionable && approver.isPending;
  const isRejecting = isActionable && rejecter.isPending;
  const isConfirming = isTrader && traderConfirm.isPending;
  const isMutating = isApproving || isRejecting || isConfirming;

  /** What this record is, in copy: "club" / "trader" / "application". */
  const noun = isClub ? "club" : isTrader ? "trader" : "application";

  const handleClose = () => {
    // Reset whichever pair might be dirty so reopening starts clean.
    showCarApprove.reset();
    showCarReject.reset();
    clubApprove.reset();
    clubReject.reset();
    traderApprove.reset();
    traderReject.reset();
    traderConfirm.reset();
    closeDetail();
  };

  const applicationId = Number(detail.data.id);

  const handleApprove = async () => {
    if (!isActionable) {
      closeDetail();
      return;
    }
    const res = await runAction({
      confirm: {
        title: `Approve this ${noun}?`,
        message: isClub
          ? "The club will be emailed a unique link to share with their members."
          : isTrader
            ? "The trader will be emailed payment details."
            : "The applicant will be emailed a link to book their space.",
        confirmLabel: "Approve",
        cancelLabel: "Not yet",
      },
      loadingLabel: "Approving application...",
      successTitle: isClub
        ? "Club confirmed"
        : isTrader
          ? "Trader approved"
          : "Application approved",
      successMessage: isClub
        ? "They've been emailed a unique link to share with their members."
        : isTrader
          ? "They've been emailed payment details."
          : "The applicant has been emailed a ticket link.",
      errorTitle: "Couldn't approve the application",
      run: async () => {
        await approver.mutateAsync({ applicationId });
        return true;
      },
    });
    if (res) handleClose();
  };

  const handleReject = async () => {
    if (!isActionable) {
      closeDetail();
      return;
    }
    const res = await runAction({
      confirm: {
        title: `Reject this ${noun}?`,
        message: "They'll be notified that they haven't been accepted.",
        confirmLabel: "Reject",
        cancelLabel: "Keep pending",
        danger: true,
      },
      loadingLabel: "Rejecting application...",
      successTitle: "Application rejected",
      successMessage: "They've been notified.",
      errorTitle: "Couldn't reject the application",
      run: async () => {
        await rejecter.mutateAsync({ applicationId });
        return true;
      },
    });
    if (res) handleClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    const res = await runAction({
      confirm: {
        title: "Mark this trader as confirmed?",
        message:
          "Use this once their payment has cleared. Their space will be treated as booked.",
        confirmLabel: "Mark as confirmed",
        cancelLabel: "Cancel",
      },
      loadingLabel: "Confirming trader...",
      successTitle: "Trader confirmed",
      successMessage: "Their space is now booked.",
      errorTitle: "Couldn't confirm the trader",
      run: () => traderConfirm.mutateAsync({ applicationId }),
    });
    if (res) handleClose();
  };

  // Footer renders the actions for this record, or nothing. Progress
  // and outcome are handled by the shared action flow (full-screen
  // loader, then a centred notification), so there's no inline
  // spinner or success/error banner to render here.
  const renderFooter = () => {
    // Approved trader -> "Mark as confirmed" instead of the pending
    // approve/reject pair.
    if (canConfirm) {
      return (
        <div className="detail-footer">
          <button
            type="button"
            className="btn btn-approve"
            onClick={handleConfirm}
            disabled={isMutating}
            style={{ flex: 1 }}
          >
            <CheckIcon /> Mark as confirmed
          </button>
        </div>
      );
    }

    if (!isPending) return null;

    return (
      <div className="detail-footer" style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-reject"
          onClick={handleReject}
          disabled={isMutating}
        >
          <XIcon /> Reject
        </button>
        <button
          type="button"
          className="btn btn-approve"
          onClick={handleApprove}
          disabled={isMutating}
        >
          <CheckIcon /> Accept
        </button>
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
          {/* Full width so the allocated / sold pair sits together on
              its own row - they read as a comparison. */}
          <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
            <div className="detail-label">Club name</div>
            <div className="detail-value">{club.name}</div>
          </div>
          <ClubSpacesField club={club} />
          <div className="detail-field">
            <div className="detail-label">Spaces sold</div>
            <div className="detail-value mono">{club.ticketsSold}</div>
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

function ClubSpacesField({ club }: { club: Club }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(String(club.membersAttending));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateSpaces = useUpdateClubSpaces();
  const saving = updateSpaces.isPending;

  const current = Number(club.membersAttending) || 0;

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraft(String(current));
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = () => {
    const parsed = parseInt(draft, 10);
    if (isNaN(parsed) || parsed < 0) {
      setError("Enter a valid number");
      return;
    }
    if (parsed === current) {
      setEditing(false);
      return;
    }
    if (parsed < club.ticketsSold) {
      setError(`Can't go below ${club.ticketsSold} sold`);
      return;
    }

    setError(null);
    updateSpaces.mutate(
      { applicationId: Number(club.id), spaces: parsed },
      {
        onSuccess: () => setEditing(false),
        onError: (e) => setError(e.message || "Save failed"),
      },
    );
  };

  return (
    <div className="detail-field">
      <div className="detail-label">Spaces allocated</div>

      {!editing ? (
        <div className="detail-value mono spaces-view">
          {current}
          <button
            type="button"
            className="icon-btn"
            title="Edit allocated spaces"
            onClick={startEdit}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="spaces-edit">
          <input
            ref={inputRef}
            className="spaces-input mono"
            type="number"
            min={0}
            value={draft}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
          />
          <button
            type="button"
            className="icon-btn confirm"
            onClick={save}
            disabled={saving}
            title="Save"
          >
            {saving ? <span className="spinner-xs" /> : "✓"}
          </button>
          <button
            type="button"
            className="icon-btn cancel"
            onClick={cancel}
            disabled={saving}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      )}

      {error && <div className="field-error">{error}</div>}
    </div>
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
              {trader.contactName.split(" ")[0] || "-"}
            </div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Last name</div>
            <div className="detail-value">
              {trader.contactName.split(" ").slice(1).join(" ") || "-"}
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

