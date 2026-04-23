import type { EventData } from "@/context/types";

export const mockEventData: EventData = {
  event: {
    id: "porsche-ft-genome-design-25-04-26",
    title: "Porsche ft. Genome Design",
    status: "published",
    date: "Sat, 25 April 2026",
    timeRange: "09:00 — 16:00",
    location: "The Motorist, Sherburn in Elmet, Leeds",
    url: "carevents.com/uk/events/porsche-ft-genome-design-25-04-26",
    slug: "porsche-ft-genome-design-25-04-26",
  },

  kpis: {
    totalOrders: 220,
    ordersThisWeek: 18,
    ticketsSold: 240,
    ticketsSoldRecent: 24,
    netSales: 2340,
    fees: 0,
  },

  tickets: [
    { id: "t1", name: "The Motorist Club · Priority Access", sold: 3, capacity: 50, status: "active" },
    { id: "t2", name: "Genome Free Ticket", sold: 5, capacity: 20, status: "active" },
    { id: "t3", name: "50 Club · Priority Access", sold: 5, capacity: 50, status: "active" },
    { id: "t4", name: "Genome Early Access", sold: 68, capacity: 100, status: "active" },
    { id: "t5", name: "VIP", sold: 1, capacity: 20, status: "active" },
    { id: "t6", name: "General Admission", sold: 158, capacity: 158, status: "soldout" },
  ],

  orders: [
    { id: "CE-10324", customerName: "Emma Mitchell",   customerEmail: "emma.m@email.com",    quantity: 2, amount: 24,  status: "paid",     date: "Today, 14:23" },
    { id: "CE-10323", customerName: "James Kowalski",  customerEmail: "james.k@email.com",   quantity: 1, amount: 95,  status: "paid",     date: "Today, 11:08" },
    { id: "CE-10322", customerName: "Sarah Patel",     customerEmail: "s.patel@email.com",   quantity: 4, amount: 48,  status: "pending",  date: "Yesterday, 19:45" },
    { id: "CE-10321", customerName: "Tom Harrison",    customerEmail: "t.harrison@email.com",quantity: 2, amount: 30,  status: "paid",     date: "Yesterday, 16:12" },
    { id: "CE-10320", customerName: "Rachel O'Connor", customerEmail: "r.oconnor@email.com", quantity: 1, amount: 0,   status: "refunded", date: "2 days ago" },
    { id: "CE-10319", customerName: "Alex Burnett",    customerEmail: "alex.b@email.com",    quantity: 1, amount: 12,  status: "paid",     date: "2 days ago" },
    { id: "CE-10318", customerName: "Lucy Mason",      customerEmail: "l.mason@email.com",   quantity: 2, amount: 190, status: "paid",     date: "3 days ago" },
    { id: "CE-10317", customerName: "Daniel Chen",     customerEmail: "d.chen@email.com",    quantity: 1, amount: 15,  status: "paid",     date: "3 days ago" },
  ],

  showCars: [
    // Pending
    {
      id: "sc-1", model: "1987 Porsche 911 Carrera", year: "1987", make: "Porsche", modelName: "911 Carrera",
      reg: "D911 RSR", ownerFirstName: "David", ownerLastName: "Fletcher",
      ownerEmail: "d.fletcher@email.com", ownerPhone: "+44 7700 912 345",
      instagram: "@dfletcher", tiktok: "@dfletcher",
      club: "Porsche Club GB",
      description: "Fully restored example with matching numbers. Recent engine rebuild and respray in original colour. Regularly shown at meets across the north of England.",
      photoClass: "car-1", category: "classic", status: "pending",
      appliedLabel: "Applied 2d ago", updatedLabel: "Applied 2d ago",
    },
    {
      id: "sc-2", model: "2021 Porsche 992 GT3", year: "2021", make: "Porsche", modelName: "992 GT3",
      reg: "GT3 992", ownerFirstName: "Marcus", ownerLastName: "Webb",
      ownerEmail: "m.webb@email.com", ownerPhone: "+44 7700 443 221",
      instagram: "@marcuswebb", tiktok: "@marcuswebb",
      club: "GT Drivers Collective",
      description: "Single-owner car with full service history from new. Kept garaged and driven on dry days only. Upgraded suspension and period-correct wheels.",
      photoClass: "car-3", category: "supercar", status: "pending",
      appliedLabel: "Applied 3d ago", updatedLabel: "Applied 3d ago",
    },
    {
      id: "sc-3", model: "1990 Porsche 964 RS", year: "1990", make: "Porsche", modelName: "964 RS",
      reg: "964 RSC", ownerFirstName: "Jessica", ownerLastName: "Morgan",
      ownerEmail: "j.morgan@email.com", ownerPhone: "+44 7700 556 899",
      instagram: "@jessmorgan", tiktok: "@jessmorgan",
      club: "Classic Leeds Porsche",
      description: "Enthusiast-owned for over a decade. Has featured in club magazines and attended international events. All paperwork and provenance available on request.",
      photoClass: "car-5", category: "classic", status: "pending",
      appliedLabel: "Applied 4d ago", updatedLabel: "Applied 4d ago",
    },

    // Awaiting payment
    { id: "sc-4", model: "1973 Porsche 911 Targa", year: "1973", make: "Porsche", modelName: "911 Targa", reg: "TRG 73P", ownerFirstName: "Amelia", ownerLastName: "Stone", ownerEmail: "a.stone@email.com", ownerPhone: "+44 7700 112 558", instagram: "@ameliastone", tiktok: "@ameliastone", club: "Porsche Club GB", description: "Ground-up restoration completed in 2022. Correct to factory spec throughout with a few sympathetic modern upgrades for reliability.", photoClass: "car-2", category: "classic", status: "awaiting-payment", appliedLabel: "Approved", updatedLabel: "Approved 1d ago" },
    { id: "sc-5", model: "1995 Porsche 993 RS", year: "1995", make: "Porsche", modelName: "993 RS", reg: "993 RSA", ownerFirstName: "Oliver", ownerLastName: "Brennan", ownerEmail: "o.brennan@email.com", ownerPhone: "+44 7700 887 664", instagram: "@obrennan", tiktok: "@obrennan", club: "911 Register", description: "Recently imported and UK-registered. Currently undergoing light recommissioning. Exterior and interior in excellent original condition.", photoClass: "car-4", category: "retro", status: "awaiting-payment", appliedLabel: "Approved", updatedLabel: "Approved 2d ago" },
    { id: "sc-6", model: "2008 Porsche 997 GT2", year: "2008", make: "Porsche", modelName: "997 GT2", reg: "GT2 997", ownerFirstName: "Ryan", ownerLastName: "Gallagher", ownerEmail: "r.gallagher@email.com", ownerPhone: "+44 7700 334 212", instagram: "@rgallagher", tiktok: "@rgallagher", club: "GT Drivers Collective", description: "Enthusiast-owned for over a decade. Has featured in club magazines and attended international events.", photoClass: "car-6", category: "supercar", status: "awaiting-payment", appliedLabel: "Approved", updatedLabel: "Approved 2d ago" },
    { id: "sc-7", model: "2006 Porsche Cayman S", year: "2006", make: "Porsche", modelName: "Cayman S", reg: "CAY 06S", ownerFirstName: "Isabel", ownerLastName: "Rowe", ownerEmail: "i.rowe@email.com", ownerPhone: "+44 7700 229 118", instagram: "@irowe", tiktok: "@irowe", club: "No", description: "Single-owner car with full service history from new. Kept garaged and driven on dry days only.", photoClass: "car-7", category: "modern", status: "awaiting-payment", appliedLabel: "Approved", updatedLabel: "Approved 3d ago" },
    { id: "sc-8", model: "2019 Porsche 911 Speedster", year: "2019", make: "Porsche", modelName: "911 Speedster", reg: "SPD 991", ownerFirstName: "Harry", ownerLastName: "Bishop", ownerEmail: "h.bishop@email.com", ownerPhone: "+44 7700 445 667", instagram: "@hbishop", tiktok: "@hbishop", club: "Porsche Club GB", description: "Fully restored example with matching numbers. Recent engine rebuild and respray in original colour.", photoClass: "car-1", category: "supercar", status: "awaiting-payment", appliedLabel: "Approved", updatedLabel: "Approved 3d ago" },

    // Confirmed (paid)
    { id: "sc-9",  model: "1968 Porsche 912",            year: "1968", make: "Porsche", modelName: "912",            reg: "912 CLS", ownerFirstName: "Henry",  ownerLastName: "Whitfield",   ownerEmail: "h.whitfield@email.com",   ownerPhone: "+44 7700 556 889", instagram: "@hwhitfield",  tiktok: "@hwhitfield",  club: "911 Register",           description: "Ground-up restoration completed in 2022. Correct to factory spec throughout.", photoClass: "car-5", category: "classic", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 1w ago" },
    { id: "sc-10", model: "2018 Porsche 991 Turbo S",    year: "2018", make: "Porsche", modelName: "991 Turbo S",    reg: "TS 991X", ownerFirstName: "Zara",   ownerLastName: "Ahmed",       ownerEmail: "z.ahmed@email.com",       ownerPhone: "+44 7700 778 432", instagram: "@zahmed",      tiktok: "@zahmed",      club: "GT Drivers Collective",  description: "Single-owner car with full service history.",                                  photoClass: "car-6", category: "supercar", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 1w ago" },
    { id: "sc-11", model: "1984 Porsche 930 Turbo",      year: "1984", make: "Porsche", modelName: "930 Turbo",      reg: "930 TBO", ownerFirstName: "Finn",   ownerLastName: "Robertson",   ownerEmail: "f.robertson@email.com",   ownerPhone: "+44 7700 119 832", instagram: "@frobertson",  tiktok: "@frobertson",  club: "Classic Leeds Porsche",  description: "Enthusiast-owned for over a decade.",                                           photoClass: "car-1", category: "classic", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 2w ago" },
    { id: "sc-12", model: "2015 Porsche 918 Spyder",     year: "2015", make: "Porsche", modelName: "918 Spyder",     reg: "918 SPY", ownerFirstName: "Grace",  ownerLastName: "Lin",         ownerEmail: "g.lin@email.com",         ownerPhone: "+44 7700 998 221", instagram: "@glin",        tiktok: "@glin",        club: "GT Drivers Collective",  description: "Hypercar maintained to exceptional standards.",                                 photoClass: "car-3", category: "supercar", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 2w ago" },
    { id: "sc-13", model: "1975 Porsche 911 S",          year: "1975", make: "Porsche", modelName: "911 S",          reg: "911 STG", ownerFirstName: "William",ownerLastName: "Harper",      ownerEmail: "w.harper@email.com",      ownerPhone: "+44 7700 223 776", instagram: "@wharper",     tiktok: "@wharper",     club: "Porsche Club GB",        description: "Recently imported and UK-registered.",                                          photoClass: "car-2", category: "classic", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 3w ago" },
    { id: "sc-14", model: "2010 Porsche 997 GT3 RS",     year: "2010", make: "Porsche", modelName: "997 GT3 RS",     reg: "997 GT3", ownerFirstName: "Sofia",  ownerLastName: "Castellanos", ownerEmail: "s.castellanos@email.com", ownerPhone: "+44 7700 441 289", instagram: "@scastellanos",tiktok: "@scastellanos",club: "GT Drivers Collective",  description: "Track-focused example with extensive service history.",                         photoClass: "car-4", category: "supercar", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 3w ago" },
    { id: "sc-15", model: "1996 Porsche 993 Turbo",      year: "1996", make: "Porsche", modelName: "993 Turbo",      reg: "993 TBO", ownerFirstName: "Lucas",  ownerLastName: "Vandermeer",  ownerEmail: "l.vandermeer@email.com",  ownerPhone: "+44 7700 667 553", instagram: "@lvandermeer", tiktok: "@lvandermeer", club: "911 Register",           description: "Last air-cooled Turbo, in concours condition.",                                 photoClass: "car-7", category: "retro", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 3w ago" },
    { id: "sc-16", model: "2022 Porsche 911 GT3 Touring",year: "2022", make: "Porsche", modelName: "911 GT3 Touring",reg: "GT3 TRG", ownerFirstName: "Alice",  ownerLastName: "Penrose",     ownerEmail: "a.penrose@email.com",     ownerPhone: "+44 7700 889 112", instagram: "@apenrose",    tiktok: "@apenrose",    club: "GT Drivers Collective",  description: "Pristine example with discreet Touring spec.",                                  photoClass: "car-6", category: "supercar", status: "confirmed", appliedLabel: "Paid", updatedLabel: "Paid 4w ago" },

    // Rejected
    { id: "sc-17", model: "2003 Porsche Cayenne",  year: "2003", make: "Porsche", modelName: "Cayenne",  reg: "CAY 03T", ownerFirstName: "Nathan", ownerLastName: "Price",   ownerEmail: "n.price@email.com",   ownerPhone: "+44 7700 118 443", instagram: "@nprice",   tiktok: "@nprice",   club: "No", description: "Does not meet the event vehicle criteria.", photoClass: "car-7", category: "modern", status: "rejected", appliedLabel: "Rejected", updatedLabel: "Rejected 1w ago" },
    { id: "sc-18", model: "2011 Porsche Panamera", year: "2011", make: "Porsche", modelName: "Panamera", reg: "PAN 11S", ownerFirstName: "Mia",    ownerLastName: "Jensen",  ownerEmail: "m.jensen@email.com",  ownerPhone: "+44 7700 998 224", instagram: "@mjensen",  tiktok: "@mjensen",  club: "No", description: "Does not meet the event vehicle criteria.", photoClass: "car-4", category: "modern", status: "rejected", appliedLabel: "Rejected", updatedLabel: "Rejected 1w ago" },
    { id: "sc-19", model: "2019 Ford Focus RS",    year: "2019", make: "Ford",    modelName: "Focus RS", reg: "RS 19F",  ownerFirstName: "Jake",   ownerLastName: "Collins", ownerEmail: "j.collins@email.com", ownerPhone: "+44 7700 334 221", instagram: "@jcollins", tiktok: "@jcollins", club: "No", description: "Non-Porsche marque event this time around.",photoClass: "car-3", category: "modern", status: "rejected", appliedLabel: "Rejected", updatedLabel: "Rejected 2w ago" },
    { id: "sc-20", model: "2005 BMW M3",           year: "2005", make: "BMW",     modelName: "M3",       reg: "BMW 05M", ownerFirstName: "Chloe",  ownerLastName: "Redmond", ownerEmail: "c.redmond@email.com", ownerPhone: "+44 7700 445 118", instagram: "@credmond", tiktok: "@credmond", club: "No", description: "Non-Porsche marque event this time around.",photoClass: "car-6", category: "modern", status: "rejected", appliedLabel: "Rejected", updatedLabel: "Rejected 2w ago" },
  ],

  clubs: [
    // Pending
    { id: "cl-1", name: "Yorkshire Porsche Society", membersAttending: 6, contactName: "Paul Richardson", contactEmail: "paul@yorkshireporschesociety.co.uk", contactPhone: "+44 7700 335 118", description: "Established enthusiast club with a strong regional following. Regular track days, social meets and an active online community. Members are keen to attend in numbers.", appliedLabel: "Applied 3 days ago", updatedLabel: "Applied 3 days ago", status: "pending" },
    { id: "cl-2", name: "North West 911 Club",       membersAttending: 4, contactName: "Helen Moss",       contactEmail: "helen@northwest911club.co.uk",       contactPhone: "+44 7700 224 661", description: "Friendly, inclusive community that welcomes all levels of ownership. We organise a mix of scenic drives, workshops and social gatherings throughout the year.", appliedLabel: "Applied 5 days ago", updatedLabel: "Applied 5 days ago", status: "pending" },

    // Approved
    { id: "cl-3", name: "Porsche Club GB",           membersAttending: 12, contactName: "Neil Ashworth",   contactEmail: "neil@porscheclubgb.co.uk",            contactPhone: "+44 7700 445 776", description: "The UK's largest marque club with decades of heritage.", appliedLabel: "Applied 3w ago", updatedLabel: "Approved 2w ago", status: "approved" },
    { id: "cl-4", name: "911 Register",              membersAttending: 8,  contactName: "Karen Dewhirst",  contactEmail: "karen@911register.co.uk",             contactPhone: "+44 7700 116 998", description: "Specialist register of 911 ownership across all generations.", appliedLabel: "Applied 3w ago", updatedLabel: "Approved 2w ago", status: "approved" },
    { id: "cl-5", name: "Classic Leeds Porsche",     membersAttending: 7,  contactName: "Martin Greaves",  contactEmail: "martin@classicleedsporsche.co.uk",   contactPhone: "+44 7700 889 224", description: "Regional Leeds-based group focused on air-cooled cars.", appliedLabel: "Applied 2w ago", updatedLabel: "Approved 1w ago", status: "approved" },
    { id: "cl-6", name: "GT Drivers Collective",     membersAttending: 5,  contactName: "Sophie Langdon",  contactEmail: "sophie@gtdriverscollective.co.uk",   contactPhone: "+44 7700 446 221", description: "Performance-focused collective with a strong track day calendar.", appliedLabel: "Applied 1w ago", updatedLabel: "Approved 3d ago", status: "approved" },

    // Rejected
    { id: "cl-7", name: "BMW M Owners Club",         membersAttending: 0,  contactName: "Ian Pemberton",   contactEmail: "ian@bmwmownersclub.co.uk",            contactPhone: "+44 7700 221 889", description: "Applied but outside the marque scope of this event.", appliedLabel: "Applied 2w ago", updatedLabel: "Rejected 1w ago", status: "rejected" },
  ],

  traders: [
    // Pending
    { id: "tr-1", name: "Detailing Experts UK",  category: "Services · Paint correction", pitch: "3m × 3m", power: "Required · 2kW", contactName: "Rachel Green", contactEmail: "rachel@detailingexperts.co.uk", contactPhone: "+44 7700 118 442", instagram: "@detailingexperts", tiktok: "@detailingexperts", appliedLabel: "Applied 2 days ago", status: "pending" },

    // Approved
    { id: "tr-2", name: "Design Studio Co.",     category: "Merchandise",                   pitch: "3m × 3m", power: "Not required",   contactName: "James Cook",   contactEmail: "james@designstudio.co",          contactPhone: "+44 7700 774 221", instagram: "@designstudio",     tiktok: "@designstudio",     appliedLabel: "Applied 2w ago", status: "approved" },
    { id: "tr-3", name: "Classic Parts Direct",  category: "Aftermarket Parts",             pitch: "6m × 3m", power: "Required · 1kW", contactName: "Paul Winters", contactEmail: "paul@classicparts.co.uk",        contactPhone: "+44 7700 554 987", instagram: "@classicparts",     tiktok: "@classicparts",     appliedLabel: "Applied 3w ago", status: "approved" },
    { id: "tr-4", name: "Coffee & Cars Co.",     category: "Food & Drink",                  pitch: "4m × 3m", power: "Required · 3kW", contactName: "Laura Bell",   contactEmail: "hello@coffeeandcars.com",        contactPhone: "+44 7700 221 554", instagram: "@coffeeandcars",    tiktok: "@coffeeandcars",    appliedLabel: "Applied 1w ago", status: "approved" },
    { id: "tr-5", name: "Performance Dynamics",  category: "Tuning",                        pitch: "6m × 3m", power: "Required · 2kW", contactName: "Mike Davies",  contactEmail: "mike@performdynamics.uk",        contactPhone: "+44 7700 667 443", instagram: "@performdynamics",  tiktok: "@performdynamics",  appliedLabel: "Applied 1w ago", status: "approved" },
  ],

  discounts: [
    {
      id: "d1",
      code: "EARLYBIRD",
      displayAmount: "10%",
      statusLabel: "Active",
      activeState: "active",
      usage: 34,
      maxUsage: 100,
    },
    {
      id: "d2",
      code: "CLUB20",
      displayAmount: "£5.00",
      statusLabel: "Active",
      activeState: "active",
      usage: 12,
      maxUsage: null,
    },
  ],

  notifications: [
    { id: "n1", kind: "car",   message: "**Marcus Webb** applied to show their 2021 Porsche 992 GT3", time: "15 minutes ago · Porsche ft. Genome Design", unread: true },
    { id: "n2", kind: "order", message: "New order **#CE-10324** from Emma Mitchell · £24.00", time: "1 hour ago", unread: true },
    { id: "n3", kind: "club",  message: "**Yorkshire Porsche Society** requested club access", time: "3 hours ago", unread: true },
    { id: "n4", kind: "warn",  message: "Trader **Detailing Experts UK** awaiting your review", time: "Yesterday", unread: false },
    { id: "n5", kind: "order", message: "Payment confirmed for **Henry Whitfield** (1968 Porsche 912)", time: "2 days ago", unread: false },
  ],

  categoryStats: [
    { category: "classic",  confirmed: 10, capacity: 15 },
    { category: "retro",    confirmed: 4,  capacity: 8 },
    { category: "modern",   confirmed: 6,  capacity: 15 },
    { category: "supercar", confirmed: 8,  capacity: 12 },
  ],

  features: {
    show_cars: {
      enabled: true,
      counts: { applied: 3, approved: 5, confirmed: 28, rejected: 6, total: 42 },
    },
    car_clubs: {
      enabled: true,
      counts: { applied: 2, approved: 4, confirmed: 0, rejected: 1, total: 7 },
    },
    traders: {
      enabled: false,
      counts: { applied: 0, approved: 0, confirmed: 0, rejected: 0, total: 0 },
    },
  },
};
