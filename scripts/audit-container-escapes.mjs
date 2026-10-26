#!/usr/bin/env node
/**
 * Finds ways out of the mobile app's web container.
 *
 * The app opens three page families in a WebView with no address bar and no
 * browser chrome: /events/create, /events/new and /events/<ref>. Inside,
 * the dashboard renders without its header or sidebar — so a navigation to
 * another dashboard page drops the user on a screen with nothing to
 * navigate with, and the event they came to edit half-finished behind them.
 *
 * Run after touching anything in the editor or the event overview:
 *
 *     npm run audit:container
 *
 * Exits non-zero on anything new, so it can go in CI.
 *
 * ── How it decides ───────────────────────────────────────────────────────
 *
 * It does NOT try to work out whether a navigation is guarded. An earlier
 * version did, by looking for appAction/inAppContainer near the call, and
 * it was worse than useless: a deliberately planted `router.push("/settings")`
 * one line below an unrelated guarded function was read as covered, and the
 * script reported all clear. A check that cannot fail is not a check.
 *
 * So instead every outbound navigation must be listed in ALLOWED with the
 * reason it is safe. The list IS the audit — adding a line is a person
 * saying they looked at this one. Anything not on it fails, including a
 * genuinely well-guarded one, which costs a line of explanation and buys a
 * check that actually catches things.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

const ENTRIES = [
  ["app/(editor)/events/create/page.tsx", "ADD EVENT        /events/create"],
  ["app/(editor)/events/new/page.tsx", "EDIT EVENT       /events/new"],
  ["app/(dashboard)/events/[id]/page.tsx", "EVENT OVERVIEW   /events/<ref>"],
];

/** How a file says "go somewhere". */
const NAV = [
  ["Link href", /<Link\b[^>]*?href=\{?["'`]([^"'`}]+)/],
  ["router.push", /router\.(?:push|replace)\(\s*["'`]([^"'`]+)/],
  ["location", /(?:window\.)?location\.(?:href|assign|replace)\s*[=(]\s*["'`]([^"'`]+)/],
  ["<a href", /<a\b[^>]*?href=\{?["'`]([^"'`}]+)/],
  ["redirect()", /\bredirect\(\s*["'`]([^"'`]+)/],
];

/**
 * Every navigation out of the container, and why it is alright.
 *
 * Keyed "path/to/file.tsx:destination". Anything not here fails.
 */
const ALLOWED = new Map([
  [
    "components/event/Breadcrumb.tsx:/events",
    "Hidden: [data-app-container] .breadcrumb { display: none } in globals.css, " +
      "and both branches of this component carry that class.",
  ],
  [
    "components/event/Breadcrumb.tsx:/events/${encodeURIComponent(parent)",
    "Same breadcrumb, same rule.",
  ],
  [
    "components/event/EventHero.tsx:/events",
    "The browser branch of leaveAfterRemoval(), after an event is cancelled " +
      "or deleted. In the container it calls appAction('dl-back=1') instead " +
      "and never reaches this line.",
  ],
  [
    "components/ui/clickableRow.ts:/orders/${id}",
    "An order detail page: part of the same job, stays in the container. Its " +
      "own back button is tagged dashboard-exit when it would leave for the " +
      "dashboard root.",
  ],
  [
    "components/event-create/panels/MarketingPanel.tsx:/settings",
    "SettingsLink. Its onClick calls inAppContainer() first and stops with a " +
      "toast, so neither the href nor this router.push is reached in the app. " +
      "Rendered as a link either way, deliberately — swapping it for a span " +
      "would be a hydration mismatch, since the cookie it reads does not " +
      "exist during SSR.",
  ],
  [
    "lib/apiClient.ts:/login${returnTo}",
    "The browser branch of the 401 handler. returnToAppForSignIn() runs " +
      "first and hands back to the app, because /login carries Register and " +
      "Forgot-password links — and the session belongs to the app anyway, so " +
      "signing in here would not fix it.",
  ],
  [
    "context/AuthContext.tsx:/login${returnTo}",
    "Same 401 handler, the version AuthContext installs over the default. " +
      "Guarded the same way.",
  ],
  [
    "context/AuthContext.tsx:/login",
    "signOut(). Also calls returnToAppForSignIn() first.",
  ],
]);

const IMPORT = /^\s*import\s+(?:[\s\S]*?)\s*from\s*["'](@\/[^"']+|\.[^"']+)["']/gm;

function resolve(spec, fromFile) {
  const base = spec.startsWith("@/")
    ? spec.slice(2)
    : normalize(join(dirname(fromFile), spec));

  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every local file reachable from an entry point. */
function tree(entry) {
  const seen = new Set();
  const stack = [entry];

  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);

    for (const match of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const dep = resolve(match[1], file);
      if (dep && !dep.includes("node_modules")) stack.push(dep);
    }
  }

  return [...seen].sort();
}

const key = (file, dest) =>
  `${relative(".", file).replace(/\\/g, "/")}:${dest}`;

let problems = 0;
const used = new Set();

for (const [entry, label] of ENTRIES) {
  if (!existsSync(entry)) {
    console.log(`MISSING ENTRY POINT: ${entry}`);
    problems++;
    continue;
  }

  const files = tree(entry);
  const found = [];

  for (const file of files) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);

    lines.forEach((line, i) => {
      for (const [kind, pattern] of NAV) {
        const m = line.match(pattern);
        if (!m) continue;

        const dest = m[1];

        // Anchors, other sites, other schemes, and anything that stays on
        // the page it is already on.
        if (/^(#|https?:|mailto:|tel:|drivelife:)/.test(dest)) return;
        if (dest.includes("${pathname}")) return;

        const k = key(file, dest);
        if (ALLOWED.has(k)) {
          used.add(k);
          return;
        }

        found.push({ file, line: i + 1, kind, dest });
      }
    });
  }

  console.log(
    `${label}  (${files.length} files)  — ${
      found.length ? `${found.length} NOT ACCOUNTED FOR` : "clear"
    }`,
  );

  for (const f of found) {
    console.log(
      `    ${relative(".", f.file).replace(/\\/g, "/")}:${f.line}  ${f.kind}  →  ${f.dest}`,
    );
  }

  problems += found.length;
}

// A stale entry means the code moved on and nobody re-checked this one.
const stale = [...ALLOWED.keys()].filter((k) => !used.has(k));
if (stale.length) {
  console.log("\nALLOWED entries that no longer match anything:");
  for (const k of stale) console.log(`    ${k}`);
  console.log("Remove them, so the list keeps meaning what it says.");
  problems += stale.length;
}

console.log("");

if (problems) {
  console.log(
    "Every way out of the container must be listed in ALLOWED in this\n" +
      "script, with the reason it is safe. Guard the navigation, or add it\n" +
      "to the list once you have checked it.",
  );
  process.exit(1);
}

console.log("No unaccounted-for ways out of the app container.");
