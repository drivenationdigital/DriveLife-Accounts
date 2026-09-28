"use client";

import { useUI } from "@/context/UIContext";
import { useAction } from "@/context/ActionContext";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import { MoreHorizontalIcon } from "@/components/ui/Icons";
import type { Club, DetailPayload, ShowCar, Trader } from "@/context/types";
import {
  useDeleteShowCarApplication,
  useResendShowCarConfirmation,
} from "@/lib/showCarApplications";
import {
  useDeleteClubApplication,
  useResendClubConfirmation,
} from "@/lib/clubApplications";
import {
  useDeleteTraderApplication,
  useResendTraderConfirmation,
} from "@/lib/traderApplications";

type Props =
  | { kind: "showcar"; entity: ShowCar }
  | { kind: "club"; entity: Club }
  | { kind: "trader"; entity: Trader };

/**
 * The "⋯" menu on a show car row, club row or trader card:
 *
 *   View                 opens the detail modal (what the old View /
 *                        Details button did)
 *   Resend confirmation  re-sends whatever the applicant was last sent
 *                        for their status - the approval email, their
 *                        ticket or their rejection. Greyed out while
 *                        nothing has gone out (pending).
 *   Delete               removes the application for good, after a
 *                        confirm. A confirmed space is released.
 *
 * Every click stops here: the rows and cards that host the menu open
 * the detail modal on click themselves.
 */
export function ApplicationActionsMenu(props: Props) {
  const { openDetail } = useUI();
  const runAction = useAction();

  const showCarResend = useResendShowCarConfirmation();
  const showCarDelete = useDeleteShowCarApplication();
  const clubResend = useResendClubConfirmation();
  const clubDelete = useDeleteClubApplication();
  const traderResend = useResendTraderConfirmation();
  const traderDelete = useDeleteTraderApplication();

  const id = Number(props.entity.id);
  const status = props.entity.status as string;

  const label =
    props.kind === "showcar"
      ? "show car"
      : props.kind === "club"
        ? "car club"
        : "trader";
  const name =
    props.kind === "showcar"
      ? props.entity.model
      : props.entity.name;

  const payload: DetailPayload =
    props.kind === "showcar"
      ? { type: "showcar", data: props.entity }
      : props.kind === "club"
        ? { type: "club", data: props.entity }
        : { type: "trader", data: props.entity };

  // Nothing has been emailed to a pending applicant; every other status
  // has had its confirmation or its rejection (all three kinds send one).
  const canResend = status !== "pending";

  const resend = () =>
    runAction({
      loadingLabel: "Sending email...",
      successTitle: "Email sent",
      successMessage: `The ${label} has been sent their ${
        status === "rejected" ? "rejection" : "confirmation"
      } again.`,
      errorTitle: "Couldn't resend the email",
      run: async () => {
        if (props.kind === "showcar") {
          await showCarResend.mutateAsync({ applicationId: id });
        } else if (props.kind === "club") {
          await clubResend.mutateAsync({ applicationId: id });
        } else {
          await traderResend.mutateAsync({ applicationId: id });
        }
        return true;
      },
    });

  const remove = () =>
    runAction({
      confirm: {
        title: "Delete this application?",
        message: `${name} will be removed permanently${
          status === "pending" || status === "rejected"
            ? "."
            : ` and the space it holds released. Any ticket the ${label} paid for stays on the Orders tab.`
        } The ${label} is not emailed.`,
        confirmLabel: "Delete",
        cancelLabel: "Keep it",
        danger: true,
      },
      loadingLabel: "Deleting application...",
      successTitle: "Application deleted",
      errorTitle: "Couldn't delete the application",
      run: async () => {
        if (props.kind === "showcar") {
          await showCarDelete.mutateAsync({ applicationId: id });
        } else if (props.kind === "club") {
          await clubDelete.mutateAsync({ applicationId: id });
        } else {
          await traderDelete.mutateAsync({ applicationId: id });
        }
        return true;
      },
    });

  return (
    <div
      className="app-actions-menu"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Dropdown className="row-action">
        <DropdownTrigger className="row-action-btn" ariaLabel={`${label} actions`}>
          <MoreHorizontalIcon />
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem onClick={() => openDetail(payload)}>View</DropdownItem>
          <DropdownItem disabled={!canResend} onClick={resend}>
            Resend confirmation
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger onClick={remove}>
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
