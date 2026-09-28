"use client";

import { useUI } from "@/context/UIContext";
import { ApplicationActionsMenu } from "@/components/applications/ApplicationActionsMenu";
import type { Club, Trader, DetailPayload } from "@/context/types";
import {
  useApproveClubApplication,
  useRejectClubApplication,
} from "@/lib/clubApplications";
import {
  useApproveTraderApplication,
  useRejectTraderApplication,
} from "@/lib/traderApplications";
import { useAction } from "@/context/ActionContext";

type AppCardProps =
  | { kind: "club"; entity: Club }
  | { kind: "trader"; entity: Trader };

export function AppCard(props: AppCardProps) {
  const { openDetail } = useUI();
  const runAction = useAction();

  // Approve / reject mutations - the pair is picked by kind below.
  const clubApprove = useApproveClubApplication();
  const clubReject = useRejectClubApplication();
  const traderApprove = useApproveTraderApplication();
  const traderReject = useRejectTraderApplication();

  const approver = props.kind === "club" ? clubApprove : traderApprove;
  const rejecter = props.kind === "club" ? clubReject : traderReject;
  const isBusy = approver.isPending || rejecter.isPending;

  const payload: DetailPayload =
    props.kind === "club"
      ? { type: "club", data: props.entity }
      : { type: "trader", data: props.entity };

  const openView = () => openDetail(payload);

  const stopThen = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const kindLabel = props.kind === "club" ? "car club" : "trader";

  const handleApprove = () =>
    runAction({
      confirm: {
        title: "Approve this application?",
        message: `The ${kindLabel} will be notified that they've been accepted for this event.`,
        confirmLabel: "Approve",
        cancelLabel: "Not yet",
      },
      loadingLabel: "Approving application...",
      successTitle: "Application approved",
      successMessage: `The ${kindLabel} has been notified.`,
      errorTitle: "Couldn't approve the application",
      // Awaited inside an async wrapper: `approver` is a union of the
      // club and trader mutations, whose response shapes differ, and
      // the caller doesn't read the response either way.
      run: async () => {
        await approver.mutateAsync({ applicationId: Number(props.entity.id) });
        return true;
      },
    });

  const handleReject = () =>
    runAction({
      confirm: {
        title: "Reject this application?",
        message: `The ${kindLabel} will be notified that they haven't been accepted for this event.`,
        confirmLabel: "Reject",
        cancelLabel: "Keep pending",
        danger: true,
      },
      loadingLabel: "Rejecting application...",
      successTitle: "Application rejected",
      successMessage: `The ${kindLabel} has been notified.`,
      errorTitle: "Couldn't reject the application",
      run: async () => {
        await rejecter.mutateAsync({ applicationId: Number(props.entity.id) });
        return true;
      },
    });

  const isPending = props.entity.status === "pending";

  // Header content differs between clubs and traders
  const { name, subtitle, body } = (() => {
    if (props.kind === "club") {
      const c = props.entity;
      return {
        name: c.name,
        subtitle: `${c.membersAttending} members attending`,
        body: (
          <>
            <strong>Members attending:</strong> {c.membersAttending}
            <br />
            <strong>
              {c.status === "pending"
                ? "Applied:"
                : c.status === "approved"
                  ? "Approved:"
                  : "Rejected:"}
            </strong>{" "}
            {c.updatedLabel.replace(/^(Applied|Approved|Rejected)\s*/i, "")}
            <br />
            <strong>Contact:</strong> {c.contactName}, {c.contactEmail}
          </>
        ),
      };
    }
    const t = props.entity;
    return {
      name: t.name,
      subtitle: t.category,
      body: (
        <>
          <strong>Category:</strong> {t.category}
          <br />
          <strong>Pitch:</strong> {t.pitch}
          <br />
          <strong>Power:</strong> {t.power}
          <br />
          <strong>Contact:</strong> {t.contactName}, {t.contactEmail}
          <br />
          <strong>Applied:</strong> {t.appliedLabel.replace(/^Applied\s*/i, "")}
        </>
      ),
    };
  })();

  return (
    <div
      className="app-card"
      data-detail-type={props.kind}
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
      <div className="app-card-top">
        <div>
          <div className="app-card-name">{name}</div>
          <div className="app-card-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="app-card-body">{body}</div>

      <div className="app-card-actions">
        {isPending && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isBusy}
              onClick={stopThen(handleApprove)}
            >
              {approver.isPending ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-danger-outline"
              disabled={isBusy}
              onClick={stopThen(handleReject)}
            >
              {rejecter.isPending ? "Rejecting…" : "Reject"}
            </button>
          </>
        )}
        {/* View / Resend confirmation / Delete. The card itself also
            opens the detail modal on click. */}
        {props.kind === "club" ? (
          <ApplicationActionsMenu kind="club" entity={props.entity} />
        ) : (
          <ApplicationActionsMenu kind="trader" entity={props.entity} />
        )}
      </div>
    </div>
  );
}
