"use client";

import { useUI } from "@/context/UIContext";
import { clickableRow } from "@/components/ui/clickableRow";
import type { ShowCar } from "@/context/types";

/**
 * Show car applications as a table.
 *
 * Used by the Show Cars tab (once per status group, each in its own
 * section card) and by the Overview tab's "Pending Show Cars" card.
 * Columns match the agreed layout: thumbnail, make/model, reg,
 * contact, applied/updated, category, View.
 *
 * The whole row opens the detail modal - the View button is there as
 * the visible affordance, but clicking anywhere in the row works.
 * Approve / reject live inside the modal, so there are no per-row
 * action buttons.
 */
export function ShowCarTable({ cars }: { cars: ShowCar[] }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="col-thumb" />
          <th>Make / Model</th>
          <th>Registration</th>
          <th>Contact</th>
          <th>Applied</th>
          <th>Category</th>
          <th className="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {cars.map((car) => (
          <ShowCarTableRow key={car.id} car={car} />
        ))}
      </tbody>
    </table>
  );
}

function ShowCarTableRow({ car }: { car: ShowCar }) {
  const { openDetail } = useUI();
  const open = () => openDetail({ type: "showcar", data: car });

  const owner = `${car.ownerFirstName} ${car.ownerLastName}`.trim();

  // Pending applications show when they applied; everything else has
  // moved on since, so the status-change label is the useful one.
  const dateLabel =
    car.status === "pending"
      ? car.appliedLabel
      : car.updatedLabel || car.appliedLabel;

  return (
    <tr {...clickableRow(open, { label: `Open ${car.model}` })}>
      <td className="col-thumb">
        <div
          className={`showcar-photo row-thumb ${car.photoUrl ? "" : car.photoClass}`}
          style={
            car.photoUrl
              ? {
                  backgroundImage: `url("${car.photoUrl}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
      </td>
      <td>
        <div className="showcar-model">{car.model}</div>
      </td>
      <td>
        {car.reg ? (
          <span className="showcar-reg">{car.reg}</span>
        ) : (
          <span style={{ color: "var(--muted)" }}>-</span>
        )}
      </td>
      <td>
        <div className="showcar-owner">{owner || "-"}</div>
        <div className="showcar-email">{car.ownerEmail}</div>
      </td>
      <td className="showcar-date">
        <span>{dateLabel}</span>
      </td>
      <td>
        {car.category ? (
          <span className="category-tag">{car.category}</span>
        ) : (
          <span style={{ color: "var(--muted)" }}>-</span>
        )}
      </td>
      <td className="col-actions">
        <button
          type="button"
          className="btn btn-secondary btn-view"
          onClick={open}
        >
          View
        </button>
      </td>
    </tr>
  );
}
