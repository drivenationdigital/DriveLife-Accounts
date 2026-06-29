"use client";

import { useUI } from "@/context/UIContext";
import { CarEventsEyeIcon, TrashIcon } from "@/components/ui/Icons";
import type { Club, Trader, DetailPayload } from "@/context/types";
  import { useConfirm } from "@/context/ConfirmContext";


type AppCardProps =
  | { kind: "club"; entity: Club }
  | { kind: "trader"; entity: Trader };

export function AppCard(props: AppCardProps) {
  const { openDetail } = useUI();
   const confirm = useConfirm();

  const payload: DetailPayload =
    props.kind === "club"
      ? { type: "club", data: props.entity }
      : { type: "trader", data: props.entity };

  const openView = () => openDetail(payload);

  const stopThen = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

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
            <strong>{c.status === "pending" ? "Applied:" : c.status === "approved" ? "Approved:" : "Rejected:"}</strong>{" "}
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
        {isPending ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={stopThen(openView)}
            >
              <CarEventsEyeIcon /> Details
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={stopThen(() =>
                console.log("approve", props.kind, props.entity.id),
              )}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-danger-outline"
              onClick={stopThen(() =>
                console.log("reject", props.kind, props.entity.id),
              )}
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={stopThen(openView)}
            >
              <CarEventsEyeIcon /> Details
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-delete"
              title="Delete"
              onClick={stopThen(async () => {
                const ok = await confirm({
                  title: "Delete this application?",
                  message: "This action cannot be undone.",
                  confirmLabel: "Delete",
                  danger: true,
                });
                if (ok) console.log("delete", props.kind, props.entity.id);
              })}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
