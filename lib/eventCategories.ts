/**
 * Event categories.
 *
 * For now these mirror the hardcoded list in the original event-editor
 * mockup. When we wire up the create-event WP route, the source of truth
 * will move to an API endpoint (likely `/wp-json/dl-accounts/v1/event-categories`).
 *
 * The order here matches the visual order in the mockup, which appears
 * to be a deliberate sort (not alphabetical, not by id) — preserved so
 * we don't break the visual rhythm when porting.
 */
export type EventCategory = {
  id: number;
  name: string;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 51, name: "Drift Events" },
  { id: 23, name: "American Car Shows & Hotrods" },
  { id: 52, name: "General Car Meets" },
  { id: 48, name: "VAG Events" },
  { id: 42, name: "Cars & Coffee Events" },
  { id: 47, name: "Air-Cooled Events" },
  { id: 3, name: "Sports Car Shows & Supercar Events" },
  { id: 6, name: "Specialist Car Shows & Model Specific" },
  { id: 4, name: "Modded Car Shows & JDM Car Events" },
  { id: 19, name: "Race Events & Shows" },
  { id: 5, name: "Classic Car Shows & Events" },
  { id: 41, name: "Drag Racing & Straightline Sports" },
  { id: 46, name: "Venue Based Events" },
  { id: 45, name: "4x4 Events" },
  { id: 49, name: "Monster Truck Events" },
  { id: 11, name: "Car Club Meets" },
  { id: 40, name: "Electric Car Events & EV Car Shows" },
  { id: 21, name: "Autojumbles & Car Swap Meets" },
  { id: 7, name: "Car Rallies & Driving Tours" },
  { id: 8, name: "UK Track Days 2026" },
  { id: 20, name: "Bike Events 2026" },
];
