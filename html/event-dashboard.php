<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CarEvents — Event Overview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  /* Drop in Right Grotesk Narrow Bold here - commercial font from Pangram Pangram.
     When the .woff2 file is self-hosted, uncomment below. Barlow Condensed Bold
     is used as a visual stand-in in this preview. */
  /*
  @font-face {
    font-family: 'Right Grotesk Narrow';
    src: url('/fonts/RightGroteskNarrow-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  */

  :root {
    --font-display: 'Right Grotesk Narrow', 'Barlow Condensed', 'Oswald', ui-sans-serif, system-ui, sans-serif;
    --bg: #f6f3ec;
    --bg-2: #efeadf;
    --surface: #ffffff;
    --ink: #161513;
    --ink-2: #2a2826;
    --ink-3: #4a4640;
    --muted: #817c72;
    --muted-2: #a8a397;
    --gold: #b2915c;
    --gold-hover: #9a7c48;
    --gold-deep: #8a6d3f;
    --gold-soft: #f2ead8;
    --gold-softer: #faf5ea;
    --border: #e6e0d1;
    --border-strong: #d2cbb8;
    --success: #4a7a3d;
    --success-soft: #e9f0e3;
    --warn: #b8730a;
    --warn-soft: #fbefd8;
    --danger: #a64634;
    --danger-soft: #f8e3df;
    /* Show car categories */
    --cat-classic: #b8884a;
    --cat-retro: #9b6db0;
    --cat-modern: #6b8ca3;
    --cat-supercar: #d4a050;
    --radius: 12px;
    --radius-sm: 8px;
    --shadow-sm: 0 1px 2px rgba(22, 21, 19, 0.04);
    --shadow: 0 1px 3px rgba(22, 21, 19, 0.06), 0 1px 2px rgba(22, 21, 19, 0.04);
    --shadow-lg: 0 4px 14px rgba(22, 21, 19, 0.08), 0 2px 4px rgba(22, 21, 19, 0.04);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body {
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--ink);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
  a { color: inherit; text-decoration: none; }
  ul { list-style: none; }

  /* ============ TOP BAR ============ */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 68px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 20px;
    gap: 20px;
  }
  .topbar-left { display: flex; align-items: center; gap: 8px; justify-self: start; }
  .topbar-center { display: flex; align-items: center; justify-self: center; }
  .topbar-right { display: flex; align-items: center; gap: 8px; justify-self: end; }

  .menu-btn {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-2);
    transition: background 0.15s ease;
    flex-shrink: 0;
  }
  .menu-btn:hover { background: var(--bg-2); }
  .menu-btn svg { width: 20px; height: 20px; }

  .topbar-logo { flex-shrink: 0; display: flex; align-items: center; }
  .topbar-logo .logo-wordmark { height: 24px; width: auto; display: block; }
  .topbar-logo .logo-mark { height: 32px; width: auto; display: none; }
  @media (max-width: 600px) {
    .topbar-logo .logo-wordmark { display: none; }
    .topbar-logo .logo-mark { display: block; }
  }

  .btn-create {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--gold);
    color: #fff;
    padding: 9px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s ease;
    letter-spacing: 0.01em;
  }
  .btn-create:hover { background: var(--gold-hover); }
  .btn-create svg { width: 14px; height: 14px; }
  .btn-create .create-label { display: inline; }

  .icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-3);
    transition: background 0.15s ease;
    position: relative;
  }
  .icon-btn:hover { background: var(--bg-2); }
  .icon-btn svg { width: 18px; height: 18px; }
  .icon-btn .dot {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 7px;
    height: 7px;
    background: var(--gold);
    border-radius: 50%;
    border: 2px solid var(--surface);
  }
  .avatar-btn {
    padding: 3px;
    border-radius: 50%;
    transition: background 0.15s ease;
    display: inline-flex;
  }
  .avatar-btn:hover { background: var(--bg-2); }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 100%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.02em;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ============ DROPDOWN COMPONENT ============ */
  .dropdown { position: relative; }
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    min-width: 220px;
    padding: 6px;
    z-index: 60;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .dropdown.open > .dropdown-menu {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .dropdown-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--ink-2);
    cursor: pointer;
    width: 100%;
    text-align: left;
  }
  .dropdown-menu-item:hover { background: var(--bg-2); }
  .dropdown-menu-item svg { width: 15px; height: 15px; color: var(--muted); flex-shrink: 0; }
  .dropdown-menu-item.danger { color: var(--danger); }
  .dropdown-menu-item.danger svg { color: var(--danger); }
  .dropdown-menu-item.danger:hover { background: var(--danger-soft); }
  .dropdown-menu-sep { height: 1px; background: var(--border); margin: 4px 6px; }

  /* Row action button for tables */
  .row-action-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    transition: all 0.15s ease;
  }
  .row-action-btn:hover { background: var(--bg-2); color: var(--ink); }
  .row-action-btn svg { width: 15px; height: 15px; }
  .row-action .dropdown-menu { min-width: 210px; }
  .table tr:nth-last-child(-n+3) .row-action .dropdown-menu {
    top: auto;
    bottom: calc(100% + 8px);
  }

  /* Notifications panel */
  .notif-menu { width: 360px; padding: 0; overflow: hidden; }
  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .notif-header-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 16px;
    color: var(--ink);
  }
  .notif-header-action {
    font-size: 12px;
    color: var(--gold-deep);
    font-weight: 500;
  }
  .notif-header-action:hover { color: var(--gold-hover); }
  .notif-list { max-height: 380px; overflow-y: auto; }
  .notif-item {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.12s ease;
  }
  .notif-item:hover { background: var(--bg); }
  .notif-item:last-child { border-bottom: none; }
  .notif-item.unread { background: var(--gold-softer); }
  .notif-item.unread:hover { background: var(--gold-soft); }
  .notif-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--ink-3);
  }
  .notif-avatar svg { width: 16px; height: 16px; }
  .notif-avatar.order { background: var(--success-soft); color: var(--success); }
  .notif-avatar.car { background: var(--gold-soft); color: var(--gold-deep); }
  .notif-avatar.club { background: #dfe6ee; color: #3d5a7a; }
  .notif-avatar.warn { background: var(--warn-soft); color: var(--warn); }
  .notif-body { flex: 1; min-width: 0; }
  .notif-text {
    font-size: 13px;
    color: var(--ink-2);
    line-height: 1.4;
    margin-bottom: 3px;
  }
  .notif-text strong { color: var(--ink); font-weight: 600; }
  .notif-time { font-size: 11.5px; color: var(--muted); }
  .notif-unread-dot {
    width: 8px;
    height: 8px;
    background: var(--gold);
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 14px;
  }
  .notif-footer {
    display: block;
    padding: 12px 16px;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: var(--gold-deep);
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
  .notif-footer:hover { background: var(--bg-2); color: var(--gold-hover); }

  /* User menu */
  .user-menu { min-width: 240px; }
  .user-info {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 10px 14px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 6px;
  }
  .avatar-lg {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  .user-name {
    font-weight: 600;
    font-size: 13.5px;
    color: var(--ink);
  }
  .user-email {
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ============ SIDEBAR OVERLAY (mobile) ============ */
  .sidebar-overlay {
    position: fixed;
    inset: 68px 0 0 0;
    background: rgba(22, 21, 19, 0.4);
    z-index: 39;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  /* ============ LAYOUT ============ */
  .app {
    display: flex;
    min-height: calc(100vh - 68px);
  }

  /* ============ SIDEBAR ============ */
  .sidebar {
    width: 244px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    background: var(--surface);
    padding: 22px 14px 22px;
    position: sticky;
    top: 68px;
    height: calc(100vh - 68px);
    overflow-y: auto;
  }
  .nav-section { margin-bottom: 18px; }
  .nav-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted-2);
    padding: 0 12px;
    margin-bottom: 6px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--ink-3);
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
    margin-bottom: 1px;
  }
  .nav-item:hover { background: var(--bg-2); color: var(--ink); }
  .nav-item.active {
    background: var(--ink);
    color: #fff;
  }
  .nav-item.active .nav-icon { color: var(--gold); }
  .nav-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--muted);
  }
  .nav-item:hover .nav-icon { color: var(--ink-2); }
  .nav-badge {
    margin-left: auto;
    background: var(--gold-soft);
    color: var(--gold-deep);
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 10px;
  }
  .nav-item.active .nav-badge { background: rgba(255,255,255,0.12); color: #fff; }
  .nav-divider {
    height: 1px;
    background: var(--border);
    margin: 10px 12px;
  }

  /* ============ MAIN ============ */
  .main {
    flex: 1;
    min-width: 0;
    padding: 28px 36px 60px;
    max-width: 1400px;
  }
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 20px;
  }
  .breadcrumb a {
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .breadcrumb a:hover { color: var(--ink); }
  .breadcrumb svg {
    width: 14px;
    height: 14px;
    color: currentColor;
    flex-shrink: 0;
  }

  /* Event hero */
  .event-hero { 
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px 32px;
    margin-bottom: 24px;
    position: relative;
  }
  .event-hero-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 28px;
    align-items: start;
    position: relative;
    z-index: 1;
  }
  .event-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .event-title {
    font-family: var(--font-display);
    font-size: 34px;
    font-weight: 700;
    line-height: 1.05;
    color: var(--ink);
    letter-spacing: -0.01em;
    text-transform: none;
  }
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 600;
    padding: 4px 10px 4px 8px;
    border-radius: 20px;
    letter-spacing: 0.02em;
  }
  .status-chip.published {
    background: var(--success-soft);
    color: var(--success);
  }
  .status-chip::before {
    content: '';
    width: 7px;
    height: 7px;
    background: currentColor;
    border-radius: 50%;
  }
  .event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    color: var(--ink-3);
    font-size: 13.5px;
    margin-bottom: 18px;
  }
  .event-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .event-meta-item svg { width: 15px; height: 15px; color: var(--muted); flex-shrink: 0; }
  .event-url {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    color: var(--ink-3);
    font-family: 'Geist Mono', ui-monospace, monospace;
    max-width: 100%;
  }
  .event-url a {
    color: var(--gold-deep);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .event-url a:hover { text-decoration: underline; }
  .copy-btn {
    width: 24px;
    height: 24px;
    border-radius: 5px;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .copy-btn:hover { color: var(--ink); background: var(--surface); }
  .copy-btn svg { width: 13px; height: 13px; }

  /* Event actions */
  .event-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s ease;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .btn svg { width: 14px; height: 14px; }
  .btn-primary {
    background: var(--ink);
    color: #fff;
  }
  .btn-primary:hover { background: var(--ink-2); }
  .btn-secondary {
    background: var(--surface);
    color: var(--ink);
    border-color: var(--border-strong);
  }
  .btn-secondary:hover { background: var(--bg-2); }
  .btn-ghost {
    background: transparent;
    color: var(--ink-3);
    width: 38px;
    height: 38px;
    padding: 0;
    justify-content: center;
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: var(--surface); color: var(--ink); }
  .btn-ghost svg { width: 16px; height: 16px; }

  /* ============ TABS ============ */
  .tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overscroll-behavior-x: contain;
    scroll-margin-top: 80px;
  }
  .tabs::-webkit-scrollbar { display: none; }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 13.5px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .tab:hover { color: var(--ink-2); }
  .tab.active {
    color: var(--ink);
    border-bottom-color: var(--gold);
  }
  .tab-count {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 10px;
    background: var(--bg-2);
    color: var(--ink-3);
  }
  .tab.active .tab-count { background: var(--gold-soft); color: var(--gold-deep); }
  .tab-panel { display: none; }
  .tab-panel.active { display: block; animation: fade 0.2s ease; }
  @keyframes fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  /* ============ KPI CARDS ============ */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
  }
  .kpi-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .kpi-label svg { width: 14px; height: 14px; }
  .kpi-value {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.005em;
    color: var(--ink);
  }
  .kpi-sub {
    font-size: 12px;
    color: var(--muted);
    margin-top: 6px;
    align-items: center;
  }
  .kpi-trend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--success);
    font-weight: 500;
  }
  .kpi-trend.down { color: var(--danger); }
  .kpi-trend svg { width: 12px; height: 12px; }
  .kpi.featured {
    background: var(--ink);
    color: #fff;
    border-color: var(--ink);
  }
  .kpi.featured .kpi-label { color: rgba(255,255,255,0.6); }
  .kpi.featured .kpi-value { color: #fff; }
  .kpi.featured .kpi-value .currency { color: var(--gold); }
  .kpi.featured .kpi-sub { color: rgba(255,255,255,0.55); }

  /* ============ SECTIONS ============ */
  .section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 20px;
    overflow: hidden;
  }
  .section-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0;
    line-height: 1.2;
  }
  .section-subtitle {
    font-size: 12.5px;
    color: var(--muted);
    margin-top: 2px;
  }
  .section-link {
    font-size: 13px;
    color: var(--gold-deep);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }
  .section-link:hover { color: var(--gold-hover); }
  .section-link svg { width: 14px; height: 14px; }
  .section-body { padding: 20px 24px; }
  .section-body.flush { padding: 0; }

  /* Two-column */
  .two-col {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  /* ============ TICKETS BREAKDOWN ============ */
  .ticket-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 20px;
    align-items: center;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
  }
  .ticket-row:last-child { border-bottom: none; }
  .ticket-name {
    font-weight: 500;
    color: var(--ink);
    font-size: 13.5px;
    margin-bottom: 4px;
  }
  .ticket-bar-wrap {
    height: 5px;
    background: var(--bg-2);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 6px;
  }
  .ticket-bar {
    height: 100%;
    background: var(--gold);
    border-radius: 3px;
    transition: width 0.6s ease;
  }
  .ticket-qty {
    font-family: 'Geist Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    text-align: right;
    min-width: 80px;
  }
  .ticket-qty .cap { color: var(--muted); }
  .ticket-status {
    font-size: 11.5px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 10px;
    min-width: 62px;
    text-align: center;
  }
  .ticket-status.active { background: var(--success-soft); color: var(--success); }
  .ticket-status.soldout { background: var(--bg-2); color: var(--muted); }

  /* ============ APPROVALS CARD ============ */
  .approval-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }
  .approval-row:last-child { border-bottom: none; }
  .approval-row:first-child { padding-top: 4px; }
  .approval-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: var(--gold-softer);
    color: var(--gold-deep);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .approval-icon svg { width: 18px; height: 18px; }
  .approval-info { flex: 1; min-width: 0; }
  .approval-label { font-weight: 500; font-size: 13.5px; color: var(--ink); }
  .approval-meta { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .approval-count {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }
  .approval-arrow {
    color: var(--muted-2);
    padding: 4px;
  }
  .approval-arrow svg { width: 16px; height: 16px; }

  /* ============ TABLES ============ */
  .table {
    width: 100%;
    border-collapse: collapse;
  }
  .table th {
    text-align: left;
    font-size: 11.5px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    padding: 12px 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .table td {
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
    color: var(--ink-2);
    vertical-align: middle;
  }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: var(--bg); }
  .table .mono { font-family: 'Geist Mono', monospace; font-size: 12.5px; }
  .order-id { color: var(--gold-deep); font-weight: 500; }
  .customer-cell { display: flex; align-items: center; gap: 10px; }
  .customer-name { font-weight: 500; color: var(--ink); }
  .customer-email { font-size: 12px; color: var(--muted); }
  .amount { font-family: 'Geist Mono', monospace; font-weight: 500; color: var(--ink); }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 20px;
  }
  .pill::before {
    content: '';
    width: 5px;
    height: 5px;
    background: currentColor;
    border-radius: 50%;
  }
  .pill.paid { background: var(--success-soft); color: var(--success); }
  .pill.pending { background: var(--warn-soft); color: var(--warn); }
  .pill.refunded { background: var(--bg-2); color: var(--muted); }

  /* ============ SHOW CARS ============ */
  .showcars-section-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  /* Kanban (used only in Overview preview) */
  .showcars-columns {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .showcar-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }
  .showcar-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .showcar-photo {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
    background: var(--bg-2);
  }
  .showcar-photo.car-1 { background: linear-gradient(135deg, #c8dae8 0%, #7a9cb5 50%, #3d5a7a 100%); }
  .showcar-photo.car-2 { background: linear-gradient(135deg, #f2ead8 0%, #b2915c 50%, #6b5432 100%); }
  .showcar-photo.car-3 { background: linear-gradient(135deg, #2a3438 0%, #1a1a1a 50%, #0a0a0a 100%); }
  .showcar-photo.car-4 { background: linear-gradient(135deg, #e8d5c4 0%, #a67c5a 50%, #5a3d28 100%); }
  .showcar-photo.car-5 { background: linear-gradient(135deg, #d4c5a5 0%, #8a7355 50%, #4a3d28 100%); }
  .showcar-photo.car-6 { background: linear-gradient(135deg, #b5a8b8 0%, #6a5868 50%, #2a2328 100%); }
  .showcar-photo.car-7 { background: linear-gradient(135deg, #d8e2c5 0%, #7a8a5a 50%, #3a4a28 100%); }
  .showcar-photo::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.25) 100%);
  }
  /* Category badge — overlays top-right of photo */
  .showcar-category {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px 3px 7px;
    background: rgba(22, 21, 19, 0.72);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    line-height: 1;
  }
  .showcar-category::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cat);
    flex-shrink: 0;
  }
  .showcar-category.classic { --cat: var(--cat-classic); }
  .showcar-category.retro { --cat: var(--cat-retro); }
  .showcar-category.modern { --cat: var(--cat-modern); }
  .showcar-category.supercar { --cat: var(--cat-supercar); }
  .showcar-model {
    font-weight: 600;
    font-size: 13px;
    color: var(--ink);
    margin-bottom: 2px;
    line-height: 1.3;
  }
  .showcar-reg {
    display: inline-block;
    font-family: 'Geist Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    background: var(--gold-soft);
    color: var(--gold-deep);
    border-radius: 3px;
    margin-bottom: 8px;
    letter-spacing: 0.04em;
  }
  .showcar-owner {
    font-size: 12px;
    color: var(--ink-2);
    margin-bottom: 2px;
    font-weight: 500;
  }
  .showcar-email {
    font-size: 11.5px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .showcar-date {
    font-size: 11px;
    color: var(--muted-2);
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .showcar-actions { display: flex; gap: 4px; }
  .showcar-action-btn {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    background: var(--bg);
  }
  .showcar-action-btn:hover { color: var(--ink); background: var(--bg-2); }
  .showcar-action-btn.approve { color: var(--success); }
  .showcar-action-btn.reject { color: var(--danger); }
  .showcar-action-btn svg { width: 12px; height: 12px; }

  /* ============ APPLICATION CARDS (clubs + traders) ============ */
  .app-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
  .app-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  .app-card-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .app-card-top > div:nth-child(2) { min-width: 0; flex: 1; }
  .app-card-logo {
    width: 44px;
    height: 44px;
    border-radius: 9px;
    background: var(--bg-2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 15px;
    color: var(--ink-2);
    letter-spacing: 0.01em;
    flex-shrink: 0;
  }
  .app-card-logo.t1 { background: linear-gradient(135deg, #f2ead8, #b2915c); color: #fff; }
  .app-card-logo.t2 { background: linear-gradient(135deg, #e8dfd0, #6b5432); color: #fff; }
  .app-card-logo.t3 { background: linear-gradient(135deg, #d8dfe8, #3d5a7a); color: #fff; }
  .app-card-logo.t4 { background: linear-gradient(135deg, #e4dce4, #6e5a70); color: #fff; }
  .app-card-logo.t5 { background: linear-gradient(135deg, #d5dccd, #5a6a4a); color: #fff; }
  .app-card-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .app-card-subtitle { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .app-card-body {
    font-size: 12px;
    color: var(--ink-3);
    line-height: 1.55;
    flex: 1;
  }
  .app-card-body strong { color: var(--ink); font-weight: 500; }
  .app-card-actions {
    display: flex;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .app-card-actions .btn {
    flex: 1;
    justify-content: center;
    padding: 7px 10px;
    font-size: 12px;
  }

  /* ============ FILTERS BAR ============ */
  .filters {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .search {
    flex: 1;
    position: relative;
    max-width: 320px;
    min-width: 200px;
  }
  .search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--muted); }
  .search input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    background: var(--surface);
    font-family: inherit;
    color: var(--ink);
  }
  .search input:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-soft); }
  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    background: var(--surface);
    color: var(--ink-2);
    font-weight: 500;
  }
  .filter-btn:hover { background: var(--bg-2); }
  .filter-btn svg { width: 14px; height: 14px; }

  /* ============ CREATE MODAL ============ */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(22, 21, 19, 0.55);
    z-index: 100;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: modalFadeIn 0.18s ease;
  }
  .modal-backdrop.open { display: flex; }
  @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--surface);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(22, 21, 19, 0.3);
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    animation: modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes modalSlideUp {
    from { transform: translateY(16px) scale(0.98); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border);
  }
  .modal-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.005em;
  }
  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }
  .modal-close:hover { background: var(--bg-2); color: var(--ink); }
  .modal-close svg { width: 18px; height: 18px; }
  .modal-body { padding: 14px; }
  .create-options { display: flex; flex-direction: column; gap: 6px; }
  .create-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 10px;
    width: 100%;
    text-align: left;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .create-option:hover {
    border-color: var(--gold);
    background: var(--gold-softer);
  }
  .create-option-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--gold-soft);
    color: var(--gold-deep);
  }
  .create-option-icon svg { width: 20px; height: 20px; }
  .create-option:hover .create-option-icon { background: var(--gold); color: #fff; }
  .create-option-text { flex: 1; min-width: 0; }
  .create-option-title {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
    margin-bottom: 2px;
  }
  .create-option-desc {
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.4;
  }
  .create-option-chev {
    color: var(--muted-2);
    flex-shrink: 0;
    transition: transform 0.15s ease, color 0.15s ease;
  }
  .create-option:hover .create-option-chev {
    transform: translateX(2px);
    color: var(--gold-deep);
  }
  .create-option-chev svg { width: 16px; height: 16px; }

  /* ============ CATEGORY TABLE (Show Cars tab) ============ */
  .category-table { table-layout: fixed; }
  .category-table th:nth-child(1) { width: auto; }
  .category-table th:nth-child(2),
  .category-table th:nth-child(3),
  .category-table th:nth-child(5) { width: 90px; text-align: right; }
  .category-table th:nth-child(4) { width: 28%; }
  .category-table td:nth-child(2),
  .category-table td:nth-child(3),
  .category-table td:nth-child(5) { text-align: right; }
  .category-table td.num {
    font-family: 'Geist Mono', monospace;
    font-weight: 500;
    color: var(--ink);
  }
  .category-table td.num.muted { color: var(--muted); }
  .category-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: var(--ink);
  }
  .category-tag::before {
    content: '';
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--cat);
    flex-shrink: 0;
  }
  .category-tag.classic { --cat: var(--cat-classic); }
  .category-tag.retro { --cat: var(--cat-retro); }
  .category-tag.modern { --cat: var(--cat-modern); }
  .category-tag.supercar { --cat: var(--cat-supercar); }
  .util-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .util-bar {
    flex: 1;
    height: 6px;
    background: var(--bg-2);
    border-radius: 3px;
    overflow: hidden;
    min-width: 80px;
  }
  .util-bar-fill {
    height: 100%;
    background: var(--cat, var(--ink));
    border-radius: 3px;
    transition: width 0.6s ease;
  }
  .util-bar-fill.classic { background: var(--cat-classic); }
  .util-bar-fill.retro { background: var(--cat-retro); }
  .util-bar-fill.modern { background: var(--cat-modern); }
  .util-bar-fill.supercar { background: var(--cat-supercar); }
  .util-pct {
    font-family: 'Geist Mono', monospace;
    font-size: 12px;
    color: var(--ink-2);
    font-weight: 500;
    min-width: 36px;
    text-align: right;
  }
  .category-table tr.total-row td {
    background: var(--bg);
    font-weight: 600;
    color: var(--ink);
    border-top: 2px solid var(--border-strong);
  }
  .category-table tr.total-row:hover td { background: var(--bg); }
  .category-table tr.total-row .util-bar-fill { background: var(--ink); }

  /* ============ DETAIL MODAL (view card) ============ */
  .detail-modal {
    max-width: 640px;
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .detail-modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 3;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(22, 21, 19, 0.12);
    transition: background 0.15s ease;
  }
  .detail-modal-close:hover { background: #fff; }
  .detail-modal-close svg { width: 18px; height: 18px; }
  .detail-photo {
    width: 100%;
    aspect-ratio: 16 / 9;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .detail-photo.car-1 { background: linear-gradient(135deg, #c8dae8 0%, #7a9cb5 50%, #3d5a7a 100%); }
  .detail-photo.car-2 { background: linear-gradient(135deg, #f2ead8 0%, #b2915c 50%, #6b5432 100%); }
  .detail-photo.car-3 { background: linear-gradient(135deg, #2a3438 0%, #1a1a1a 50%, #0a0a0a 100%); }
  .detail-photo.car-4 { background: linear-gradient(135deg, #e8d5c4 0%, #a67c5a 50%, #5a3d28 100%); }
  .detail-photo.car-5 { background: linear-gradient(135deg, #d4c5a5 0%, #8a7355 50%, #4a3d28 100%); }
  .detail-photo.car-6 { background: linear-gradient(135deg, #b5a8b8 0%, #6a5868 50%, #2a2328 100%); }
  .detail-photo.car-7 { background: linear-gradient(135deg, #d8e2c5 0%, #7a8a5a 50%, #3a4a28 100%); }
  .detail-photo::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.35) 100%);
  }
  .detail-photo .showcar-category {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: auto;
    font-size: 11px;
    padding: 5px 10px;
  }
  .detail-scroll {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
  .detail-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
  }
  .detail-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .detail-title-reg {
    display: inline-block;
    font-family: 'Geist Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    background: var(--gold-soft);
    color: var(--gold-deep);
    border-radius: 4px;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
  .detail-header.no-photo {
    padding: 22px 60px 16px 24px;
  }
  .detail-header.no-photo .detail-title { margin-bottom: 0; }

  .detail-section {
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
  }
  .detail-section:last-child { border-bottom: none; }
  .detail-section-title {
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 20px;
  }
  .detail-field { min-width: 0; }
  .detail-label {
    font-size: 11.5px;
    color: var(--muted);
    margin-bottom: 3px;
    font-weight: 500;
  }
  .detail-value {
    font-size: 13.5px;
    color: var(--ink);
    font-weight: 500;
    word-break: break-word;
  }
  .detail-value.mono { font-family: 'Geist Mono', monospace; font-size: 12.5px; font-weight: 500; }
  .detail-value.muted { color: var(--muted); font-weight: 400; }
  .detail-value a { color: var(--gold-deep); }
  .detail-value a:hover { text-decoration: underline; }
  .detail-description {
    font-size: 13.5px;
    color: var(--ink-2);
    line-height: 1.6;
  }
  .detail-meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding: 14px 24px;
    background: var(--bg);
    font-size: 12.5px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  .detail-meta-row > div { display: inline-flex; align-items: center; gap: 6px; }
  .detail-meta-row strong { color: var(--ink-2); font-weight: 500; }
  .detail-footer {
    display: flex;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }
  .detail-footer.hidden { display: none; }
  .detail-footer .btn { flex: 1; justify-content: center; padding: 10px 16px; font-size: 13px; }
  .detail-footer .btn-approve {
    background: var(--success);
    color: #fff;
    border-color: var(--success);
  }
  .detail-footer .btn-approve:hover { background: #3d6632; }
  .detail-footer .btn-reject {
    background: var(--surface);
    color: var(--danger);
    border-color: var(--danger-soft);
  }
  .detail-footer .btn-reject:hover { background: var(--danger-soft); }
  /* Make whole cards/rows feel clickable */
  .app-card[data-detail-type] { cursor: pointer; transition: all 0.15s ease; }
  .app-card[data-detail-type]:hover { border-color: var(--border-strong); box-shadow: var(--shadow); }

  /* View button variant of showcar-action-btn */
  .showcar-action-btn.view { color: var(--ink-3); }
  .showcar-action-btn.view:hover { color: var(--ink); background: var(--bg-2); }

  .showcars-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-pending { background: var(--warn); }
  .dot-approved { background: var(--gold); }
  .dot-confirmed { background: var(--success); }
  .dot-rejected { background: var(--muted-2); }

  /* Delete icon button on approved/confirmed/rejected cards */
  .showcar-action-btn.delete {
    color: var(--muted);
  }
  .showcar-action-btn.delete:hover {
    color: var(--danger);
    background: var(--danger-soft);
  }
  /* Delete button for club/trader app-cards (inside app-card-actions) */
  .app-card-actions .btn-delete {
    flex: none;
    padding: 0;
    width: 34px;
    color: var(--muted);
  }
  .app-card-actions .btn-delete:hover {
    color: var(--danger);
    border-color: var(--danger-soft);
    background: var(--danger-soft);
  }
  .app-card-actions .btn-delete svg {
    width: 14px;
    height: 14px;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1200px) {
    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    .showcars-columns { grid-template-columns: repeat(2, 1fr); }
    .showcars-section-grid { grid-template-columns: repeat(2, 1fr); }
    .two-col { grid-template-columns: 1fr; }
    .app-card-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  }
  /* Desktop: burger collapses the sidebar */
  @media (min-width: 901px) {
    body.sidebar-desktop-hidden .sidebar { display: none; }
    body.sidebar-desktop-hidden .main { margin-left: auto; margin-right: auto; }
  }
  /* Mobile: sidebar is a drawer */
  @media (max-width: 900px) {
    .main { padding: 20px; }
    .event-hero-grid { grid-template-columns: 1fr; display:block; }
    .event-hero-grid .event-actions { margin: 20px 0 0 0; }
    .event-hero { padding: 22px; }
    .event-title { font-size: 28px; }
    .app-card-grid { grid-template-columns: 1fr; }
    .showcars-columns { grid-template-columns: 1fr; }
    .showcars-section-grid { grid-template-columns: repeat(2, 1fr); }
    .detail-grid { grid-template-columns: 1fr; }
    .detail-section { padding: 16px 20px; }
    .detail-header { padding: 16px 20px 14px; }
    .detail-meta-row { padding: 12px 20px; gap: 10px; }
    .detail-footer { padding: 14px 20px; }
    .btn-create .create-label { display: none; }
    .btn-create { padding: 9px 11px; }
    .topbar { padding: 0 12px; }
    .kpi-grid { grid-template-columns: 1fr; }
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .sidebar {
      position: fixed;
      top: 68px;
      left: 0;
      bottom: 0;
      height: calc(100vh - 68px);
      z-index: 40;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      box-shadow: 4px 0 24px rgba(22, 21, 19, 0.1);
      width: 280px;
    }
    body.sidebar-mobile-open .sidebar { transform: translateX(0); }
    body.sidebar-mobile-open .sidebar-overlay {
      opacity: 1;
      pointer-events: auto;
    }

    .notif-menu { width: calc(100vw - 40px); max-width: 360px; }
  }

</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-left">
    <button class="menu-btn" aria-label="Toggle menu" onclick="toggleSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
     <button class="btn-create" onclick="openCreateModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span class="create-label">Create</span>
    </button>
  </div>

  <div class="topbar-center">
    <div class="topbar-logo">
      <svg class="logo-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210.4 170.4">
        <path fill="#161513" d="M89.3,83.5h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7Z"/>
        <path fill="#161513" d="M41,83.2l16.9-39.3c.1-.3,0-.7-.4-.7H18c-.2,0-.4.1-.4.3L.9,82.8c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3Z"/>
        <path fill="#161513" d="M171.1,85.9h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7Z"/>
        <path fill="#b2915c" d="M66.9,125.8l16.9-39.3c.1-.3,0-.7-.4-.7h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3Z"/>
        <path fill="#b2915c" d="M109.7,128.5h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3l16.9-39.3c.1-.3,0-.7-.4-.7Z"/>
        <path fill="#b2915c" d="M208.2.6h-39.5c-.2,0-.4.1-.4.3l-16.6,39.3c-.1.3,0,.7.4.7h39.2c.2,0,.4-.1.4-.3L208.6,1.2c.1-.3,0-.7-.4-.7Z"/>
      </svg>
      <svg class="logo-wordmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 573.4 64">
      <path fill="#161513" d="M60.6,64L87.8,0h42.1c8.1,0,11.8,6.5,8.3,14.6l-14.7,34.8c-3.5,8.1-10.9,14.6-19,14.6h-43.9ZM120,16.6c.3-.6,0-1.2-.6-1.2h-20.7l-14,33h20.7c.6,0,1.3-.5,1.6-1.2l13.1-30.7Z"/>
      <path fill="#161513" d="M127.7,64L154.9,0h44.4c8.1,0,11.7,6.6,8.3,14.6l-5.9,13.9c-3.4,7.9-10.7,14.6-20.7,14.6h-.4l7.7,21h-20l-6-21h-8.4l-8.9,21h-17.4ZM160.3,28.2h23c.6,0,1.3-.5,1.6-1.2l4.4-10.5c.3-.6,0-1.2-.6-1.2h-23l-5.4,12.8Z"/>
      <path fill="#161513" d="M224.2,0h17.4l-27.2,64h-17.4L224.2,0Z"/>
      <path fill="#161513" d="M296.8,0h18.7l-54.1,64h-17.1V0h18.1v41.5L296.8,0Z"/>
      <path fill="#161513" d="M351,48.5l-6.6,15.5h-53.3L318.3,0h53.3l-6.6,15.5h-35.9l-4.3,10h31.9l-5.5,13h-31.9l-4.3,10h35.9Z"/>
      <path fill="#b2915c" d="M379.7,0h17.4l-20.6,48.5h29.9l-6.6,15.5h-47.3L379.7,0Z"/>
      <path fill="#b2915c" d="M432.4,0h17.4l-27.2,64h-17.4L432.4,0Z"/>
      <path fill="#b2915c" d="M433.7,64L460.9,0h51.2l-6.6,15.5h-33.8l-4.3,10h29.5l-5.5,13h-29.5l-10.8,25.5h-17.4Z"/>
      <path fill="#b2915c" d="M552.8,48.5l-6.6,15.5h-53.3L520.1,0h53.3l-6.6,15.5h-35.9l-4.3,10h31.9l-5.5,13h-31.9l-4.3,10h35.9Z"/>
      <path fill="#161513" d="M54.8,16.2h-15c0,0-.1,0-.2.1l-6.3,14.9c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1l6.4-14.9c0-.1,0-.3-.2-.3Z"/>
      <path fill="#161513" d="M21.4,16.2H6.5c0,0-.1,0-.2.1L0,31.2c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1l6.4-14.9c0-.1,0-.3-.2-.3Z"/>
      <path fill="#161513" d="M64.5,32.4h-15c0,0-.1,0-.2.1l-6.3,14.9c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1l6.4-14.9c0-.1,0-.3-.2-.3Z"/>
      <path fill="#b2915c" d="M31.2,32.4h-15c0,0-.1,0-.2.1l-6.3,14.9c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1l6.4-14.9c0-.1,0-.3-.2-.3Z"/>
      <path fill="#b2915c" d="M41.2,48.5h-15c0,0-.1,0-.2.1l-6.3,14.9c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1l6.4-14.9c0-.1,0-.3-.2-.3Z"/>
      <path fill="#b2915c" d="M78.5,0h-15c0,0-.1,0-.2.1l-6.3,14.9c0,.1,0,.3.2.3h14.9c0,0,.1,0,.2-.1L78.7.3c0-.1,0-.3-.2-.3Z"/>
    </svg>
    </div>
  </div>

  <div class="topbar-right">

    <div class="dropdown">
      <button class="icon-btn" aria-label="Notifications" data-toggle-dropdown>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        <span class="dot"></span>
      </button>
      <div class="dropdown-menu notif-menu" role="menu">
        <div class="notif-header">
          <div class="notif-header-title">Notifications</div>
          <button class="notif-header-action">Mark all read</button>
        </div>
        <div class="notif-list">
          <div class="notif-item unread">
            <div class="notif-avatar car"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V15.5a.5.5 0 00.5.5H4"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>
            <div class="notif-body">
              <div class="notif-text"><strong>Marcus Webb</strong> applied to show their 2021 Porsche 992 GT3</div>
              <div class="notif-time">15 minutes ago · Porsche ft. Genome Design</div>
            </div>
            <div class="notif-unread-dot"></div>
          </div>
          <div class="notif-item unread">
            <div class="notif-avatar order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
            <div class="notif-body">
              <div class="notif-text">New order <strong>#CE-10324</strong> from Emma Mitchell · £24.00</div>
              <div class="notif-time">1 hour ago</div>
            </div>
            <div class="notif-unread-dot"></div>
          </div>
          <div class="notif-item unread">
            <div class="notif-avatar club"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
            <div class="notif-body">
              <div class="notif-text"><strong>Yorkshire Porsche Society</strong> requested club access</div>
              <div class="notif-time">3 hours ago</div>
            </div>
            <div class="notif-unread-dot"></div>
          </div>
          <div class="notif-item">
            <div class="notif-avatar warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div class="notif-body">
              <div class="notif-text">Trader <strong>Detailing Experts UK</strong> awaiting your review</div>
              <div class="notif-time">Yesterday</div>
            </div>
          </div>
          <div class="notif-item">
            <div class="notif-avatar order"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="notif-body">
              <div class="notif-text">Payment confirmed for <strong>Henry Whitfield</strong> (1968 Porsche 912)</div>
              <div class="notif-time">2 days ago</div>
            </div>
          </div>
        </div>
        <a href="#" class="notif-footer">View all notifications</a>
      </div>
    </div>

    <div class="dropdown">
      <button class="avatar-btn" aria-label="Account menu" data-toggle-dropdown>
        <div class="avatar">JD</div>
      </button>
      <div class="dropdown-menu user-menu" role="menu">
        <div class="user-info">
          <div style="min-width:0;">
            <div class="user-name">Jordan Doe</div>
            <div class="user-email">jordan@example.com</div>
          </div>
        </div>
        <a href="#" class="dropdown-menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My Account
        </a>
        <a href="#"  class="dropdown-menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Settings
        </a>
        <a href="#" class="dropdown-menu-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Help &amp; Support
        </a>
        <a href="#" class="dropdown-menu-item danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log out
        </a>
      </div>
    </div>

  </div>
</header>

<div class="sidebar-overlay" onclick="closeSidebar()"></div>
<div class="app">
  <aside class="sidebar">
    <div class="nav-section">
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
        Dashboard
      </div>
    </div>

    <div class="nav-section">
      <div class="nav-label">Attending</div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v2a2 2 0 00-2 2 2 2 0 002 2v2a3 3 0 01-3 3H5a3 3 0 01-3-3v-2a2 2 0 002-2 2 2 0 00-2-2V9z"/><line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2 2"/></svg>
        My Tickets
      </div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        Saved Events
      </div>
    </div>

    <div class="nav-section">
      <div class="nav-label">Organising</div>
      <div class="nav-item active">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        My Events
        <span class="nav-badge">12</span>
      </div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V15.5a.5.5 0 00.5.5H4"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
        My Clubs
      </div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
        My Venues
      </div>
    </div>

    <div class="nav-divider"></div>

    <div class="nav-section">
      <div class="nav-label">Account</div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        Settings
      </div>
      <div class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        My Account
      </div>
    </div>
  </aside>

  <main class="main">
    <div class="breadcrumb">
      <a href="#"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg> Back to Events</a>
    </div>

    <section class="event-hero">
      <div class="event-hero-grid">
        <div>
          <div class="event-title-row">
            <h1 class="event-title">Porsche ft. Genome Design</h1>
            <span class="status-chip published">Published</span>
          </div>
          <div class="event-meta">
            <span class="event-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Sat, 25 April 2026
            </span>
            <span class="event-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              09:00 — 16:00
            </span>
            <span class="event-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              The Motorist, Sherburn in Elmet, Leeds
            </span>
          </div>
          <div class="event-url">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            <a href="#">carevents.com/uk/events/porsche-ft-genome-design-25-04-26</a>
            <button class="copy-btn" title="Copy link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>

        <div class="event-actions">
          <button class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Event
          </button>
          <button class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View
          </button>
          <div class="dropdown">
            <button class="btn btn-ghost" data-toggle-dropdown aria-label="More actions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div class="dropdown-menu">
              <button class="dropdown-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Add Manual Order
              </button>
              <button class="dropdown-menu-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Duplicate Event
              </button>
              <div class="dropdown-menu-sep"></div>
              <button class="dropdown-menu-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Cancel Event
              </button>
              <button class="dropdown-menu-item danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="tabs" id="tabs">
      <button class="tab active" data-tab="overview">Overview</button>
      <button class="tab" data-tab="orders">Orders <span class="tab-count">220</span></button>
      <button class="tab" data-tab="showcars">Show Cars <span class="tab-count">42</span></button>
      <button class="tab" data-tab="clubs">Clubs <span class="tab-count">8</span></button>
      <button class="tab" data-tab="traders">Traders <span class="tab-count">6</span></button>
    </div>

    <div class="tab-panel active" data-panel="overview">

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Total Orders</div>
          <div class="kpi-value">220</div>
          <div class="kpi-sub">
            <b>18</b> this week
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Tickets Sold</div>
          <div class="kpi-value">240</div>
          <div class="kpi-sub"><b>24</b> in the last 7 days</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Net Sales</div>
          <div class="kpi-value"><span class="currency">£</span>2,340<span style="font-size:18px; font-weight:400; opacity:0.5;">.00</span></div>
          <div class="kpi-sub"><b>£0.00</b> in fees</div>
        </div>
      </div>

      <div class="two-col">
        <div class="section">
          <div class="section-header">
            <div><div class="section-title">Tickets Breakdown</div></div>
            <a href="#" class="section-link">Manage tickets →</a>
          </div>
          <div class="section-body flush">
            <div class="ticket-row">
              <div>
                <div class="ticket-name">The Motorist Club · Priority Access</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:6%"></div></div>
              </div>
              <div class="ticket-qty">3 <span class="cap">/ 50</span></div>
              <span class="ticket-status active">Active</span>
            </div>
            <div class="ticket-row">
              <div>
                <div class="ticket-name">Genome Free Ticket</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:25%"></div></div>
              </div>
              <div class="ticket-qty">5 <span class="cap">/ 20</span></div>
              <span class="ticket-status active">Active</span>
            </div>
            <div class="ticket-row">
              <div>
                <div class="ticket-name">50 Club · Priority Access</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:10%"></div></div>
              </div>
              <div class="ticket-qty">5 <span class="cap">/ 50</span></div>
              <span class="ticket-status active">Active</span>
            </div>
            <div class="ticket-row">
              <div>
                <div class="ticket-name">Genome Early Access</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:68%"></div></div>
              </div>
              <div class="ticket-qty">68 <span class="cap">/ 100</span></div>
              <span class="ticket-status active">Active</span>
            </div>
            <div class="ticket-row">
              <div>
                <div class="ticket-name">VIP</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:5%"></div></div>
              </div>
              <div class="ticket-qty">1 <span class="cap">/ 20</span></div>
              <span class="ticket-status active">Active</span>
            </div>
            <div class="ticket-row">
              <div>
                <div class="ticket-name">General Admission</div>
                <div class="ticket-bar-wrap"><div class="ticket-bar" style="width:100%; background: var(--muted-2);"></div></div>
              </div>
              <div class="ticket-qty">158 <span class="cap">/ 158</span></div>
              <span class="ticket-status soldout">Sold out</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div><div class="section-title">Needs Attention</div></div>
          </div>
          <div class="section-body">
            <div class="approval-row" onclick="switchTab('showcars')" style="cursor:pointer">
              <div class="approval-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V15.5a.5.5 0 00.5.5H4"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
              </div>
              <div class="approval-info">
                <div class="approval-label">Show Car applications</div>
                <div class="approval-meta">Awaiting your approval</div>
              </div>
              <div class="approval-count">3</div>
              <span class="approval-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
            </div>
            <div class="approval-row" onclick="switchTab('clubs')" style="cursor:pointer">
              <div class="approval-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div class="approval-info">
                <div class="approval-label">Car Club applications</div>
                <div class="approval-meta">2 clubs pending review</div>
              </div>
              <div class="approval-count">2</div>
              <span class="approval-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
            </div>
            <div class="approval-row" onclick="switchTab('traders')" style="cursor:pointer">
              <div class="approval-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <div class="approval-info">
                <div class="approval-label">Trader applications</div>
                <div class="approval-meta">1 application pending</div>
              </div>
              <div class="approval-count">1</div>
              <span class="approval-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div><div class="section-title">Recent Orders</div></div>
          <a href="#" class="section-link" onclick="switchTab('orders'); return false;">View all orders →</a>
        </div>
        <div class="section-body flush">
          <table class="table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><span class="mono order-id">#CE-10324</span></td><td><div class="customer-cell"><div><div class="customer-name">Emma Mitchell</div><div class="customer-email">emma.m@email.com</div></div></div></td><td class="mono">2</td><td class="amount">£24.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Today, 14:23</td></tr>
              <tr><td><span class="mono order-id">#CE-10323</span></td><td><div class="customer-cell"><div><div class="customer-name">James Kowalski</div><div class="customer-email">james.k@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£95.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Today, 11:08</td></tr>
              <tr><td><span class="mono order-id">#CE-10322</span></td><td><div class="customer-cell"><div><div class="customer-name">Sarah Patel</div><div class="customer-email">s.patel@email.com</div></div></div></td><td class="mono">4</td><td class="amount">£48.00</td><td><span class="pill pending">Pending</span></td><td style="color:var(--muted); font-size:12.5px;">Yesterday, 19:45</td></tr>
              <tr><td><span class="mono order-id">#CE-10321</span></td><td><div class="customer-cell"><div><div class="customer-name">Tom Harrison</div><div class="customer-email">t.harrison@email.com</div></div></div></td><td class="mono">2</td><td class="amount">£30.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Yesterday, 16:12</td></tr>
              <tr><td><span class="mono order-id">#CE-10320</span></td><td><div class="customer-cell"><div><div class="customer-name">Rachel O'Connor</div><div class="customer-email">r.oconnor@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£0.00</td><td><span class="pill refunded">Refunded</span></td><td style="color:var(--muted); font-size:12.5px;">2 days ago</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Pending Show Cars</div>
            <div class="section-subtitle">3 awaiting approval</div>
          </div>
          <a href="#" class="section-link" onclick="switchTab('showcars'); return false;">Manage →</a>
        </div>
        <div class="section-body">
          <div class="showcars-section">
            <div class="showcars-section-grid">
              <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-1"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1987 Porsche 911 Carrera</div>
                  <span class="showcar-reg">D911 RSR</span>
                  <div class="showcar-owner">David Fletcher</div>
                  <div class="showcar-email">d.fletcher@email.com</div>
                  <div class="showcar-date"><span>Applied</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-3"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2021 Porsche 992 GT3</div>
                  <span class="showcar-reg">GT3 992</span>
                  <div class="showcar-owner">Marcus Webb</div>
                  <div class="showcar-email">m.webb@email.com</div>
                  <div class="showcar-date"><span>Applied</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-5"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1990 Porsche 964 RS</div>
                  <span class="showcar-reg">964 RSC</span>
                  <div class="showcar-owner">Jessica Morgan</div>
                  <div class="showcar-email">j.morgan@email.com</div>
                  <div class="showcar-date"><span>Applied</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
            </div>
          </div>
        </div>
      </div>

            <div class="two-col">
        <div class="section">
          <div class="section-header">
            <div>
              <div class="section-title">Pending Car Clubs</div>
              <div class="section-subtitle">2 awaiting review</div>
            </div>
            <a href="#" class="section-link" onclick="switchTab('clubs'); return false;">Manage →</a>
          </div>
          <div class="section-body">
            <div class="app-card-grid">
              <div class="app-card" data-detail-type="club">
                <div class="app-card-top">
                  <div>
                    <div class="app-card-name">Yorkshire Porsche Society</div>
                    <div class="app-card-subtitle">6 members attending</div>
                  </div>
                </div>
                <div class="app-card-body">
                  <strong>Members attending:</strong> 6<br>
                  <strong>Applied:</strong> 3 days ago<br>
                  <strong>Contact:</strong> Paul Richardson, paul@yorkshireporschesociety.co.uk
                </div>
                <div class="app-card-actions">
                  <button class="btn btn-secondary" data-action="view">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                  <button class="btn btn-primary" data-action="approve">Approve</button>
                  <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
                </div>
              </div>
              <div class="app-card" data-detail-type="club">
                <div class="app-card-top">
                  <div>
                    <div class="app-card-name">North West 911 Club</div>
                    <div class="app-card-subtitle">4 members attending</div>
                  </div>
                </div>
                <div class="app-card-body">
                  <strong>Members attending:</strong> 4<br>
                  <strong>Applied:</strong> 5 days ago<br>
                  <strong>Contact:</strong> Helen Moss, helen@northwest911club.co.uk
                </div>
                <div class="app-card-actions">
                  <button class="btn btn-secondary" data-action="view">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                  <button class="btn btn-primary" data-action="approve">Approve</button>
                  <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <div>
              <div class="section-title">Pending Traders</div>
              <div class="section-subtitle">1 awaiting review</div>
            </div>
            <a href="#" class="section-link" onclick="switchTab('traders'); return false;">Manage →</a>
          </div>
          <div class="section-body">
            <div class="app-card-grid">
              <div class="app-card" data-detail-type="trader">
                <div class="app-card-top">
                  <div>
                    <div class="app-card-name">Detailing Experts UK</div>
                    <div class="app-card-subtitle">Services · Paint correction</div>
                  </div>
                </div>
                <div class="app-card-body">
                  <strong>Category:</strong> Services · Paint correction<br>
                <strong>Pitch:</strong> 3m × 3m<br>
                <strong>Contact:</strong> Rachel Green, rachel@detailingexperts.co.uk<br>
                <strong>Applied:</strong> 2 days ago
                </div>
                <div class="app-card-actions">
                  <button class="btn btn-secondary" data-action="view">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                  <button class="btn btn-primary" data-action="approve">Approve</button>
                  <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="tab-panel" data-panel="orders">
      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">All Orders</div>
            <div class="section-subtitle">220 total orders · £2,340.00 net sales</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export CSV</button>
            <button class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Manual Order</button>
          </div>
        </div>
        <div class="filters">
          <div class="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search orders, customers...">
          </div>
          <button class="filter-btn">Ticket type: All</button>
        </div>
        <div class="section-body flush">
          <table class="table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr><td><span class="mono order-id">#CE-10324</span></td><td><div class="customer-cell"><div><div class="customer-name">Emma Mitchell</div><div class="customer-email">emma.m@email.com</div></div></div></td><td class="mono">2</td><td class="amount">£24.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Today, 14:23</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10323</span></td><td><div class="customer-cell"><div><div class="customer-name">James Kowalski</div><div class="customer-email">james.k@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£95.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Today, 11:08</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10322</span></td><td><div class="customer-cell"><div><div class="customer-name">Sarah Patel</div><div class="customer-email">s.patel@email.com</div></div></div></td><td class="mono">4</td><td class="amount">£48.00</td><td><span class="pill pending">Pending</span></td><td style="color:var(--muted); font-size:12.5px;">Yesterday, 19:45</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10321</span></td><td><div class="customer-cell"><div><div class="customer-name">Tom Harrison</div><div class="customer-email">t.harrison@email.com</div></div></div></td><td class="mono">2</td><td class="amount">£30.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">Yesterday, 16:12</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10320</span></td><td><div class="customer-cell"><div><div class="customer-name">Rachel O'Connor</div><div class="customer-email">r.oconnor@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£0.00</td><td><span class="pill refunded">Refunded</span></td><td style="color:var(--muted); font-size:12.5px;">2 days ago</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10319</span></td><td><div class="customer-cell"><div><div class="customer-name">Alex Burnett</div><div class="customer-email">alex.b@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£12.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">2 days ago</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10318</span></td><td><div class="customer-cell"><div><div class="customer-name">Lucy Mason</div><div class="customer-email">l.mason@email.com</div></div></div></td><td class="mono">2</td><td class="amount">£190.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">3 days ago</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
              <tr><td><span class="mono order-id">#CE-10317</span></td><td><div class="customer-cell"><div><div class="customer-name">Daniel Chen</div><div class="customer-email">d.chen@email.com</div></div></div></td><td class="mono">1</td><td class="amount">£15.00</td><td><span class="pill paid">Paid</span></td><td style="color:var(--muted); font-size:12.5px;">3 days ago</td><td style="width:44px; text-align:right;"><div class="dropdown row-action"><button class="row-action-btn" data-toggle-dropdown aria-label="Order actions"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button><div class="dropdown-menu"><button class="dropdown-menu-item">View order</button><button class="dropdown-menu-item">Resend confirmation</button><button class="dropdown-menu-item">Download tickets</button><button class="dropdown-menu-item">Edit order</button><div class="dropdown-menu-sep"></div><button class="dropdown-menu-item danger">Refund</button><button class="dropdown-menu-item danger">Delete order</button></div></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-panel" data-panel="showcars">
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Pending Review</div><div class="kpi-value" style="color:var(--warn);">3</div></div>
        <div class="kpi"><div class="kpi-label">Awaiting Payment</div><div class="kpi-value" style="color:var(--gold-deep);">5</div></div>
        <div class="kpi"><div class="kpi-label">Confirmed</div><div class="kpi-value" style="color:var(--success);">28</div></div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Confirmed Spaces by Category</div>
            <div class="section-subtitle">28 of 50 spaces filled across 4 categories</div>
          </div>
        </div>
        <div class="section-body flush">
          <table class="table category-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Confirmed</th>
                <th>Capacity</th>
                <th>Utilisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="category-tag classic">Classic</span></td>
                <td class="num">10</td>
                <td class="num muted">15</td>
                <td>
                  <div class="util-cell">
                    <div class="util-bar"><div class="util-bar-fill classic" style="width:67%"></div></div>
                    <span class="util-pct">67%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span class="category-tag retro">Retro</span></td>
                <td class="num">4</td>
                <td class="num muted">8</td>
                <td>
                  <div class="util-cell">
                    <div class="util-bar"><div class="util-bar-fill retro" style="width:50%"></div></div>
                    <span class="util-pct">50%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span class="category-tag modern">Modern</span></td>
                <td class="num">6</td>
                <td class="num muted">15</td>
                <td>
                  <div class="util-cell">
                    <div class="util-bar"><div class="util-bar-fill modern" style="width:40%"></div></div>
                    <span class="util-pct">40%</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td><span class="category-tag supercar">Supercar</span></td>
                <td class="num">8</td>
                <td class="num muted">12</td>
                <td>
                  <div class="util-cell">
                    <div class="util-bar"><div class="util-bar-fill supercar" style="width:67%"></div></div>
                    <span class="util-pct">67%</span>
                  </div>
                </td>
              </tr>
              <tr class="total-row">
                <td>Total</td>
                <td class="num">28</td>
                <td class="num">50</td>
                <td>
                  <div class="util-cell">
                    <div class="util-bar"><div class="util-bar-fill" style="width:56%"></div></div>
                    <span class="util-pct">56%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex; align-items:center; gap:10px;"><span class="showcars-dot dot-pending"></span>Pending Show Cars</div>
            <div class="section-subtitle">3 applications awaiting review</div>
          </div>
        </div>
        <div class="section-body">
          <div class="showcars-section-grid">
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-1"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1987 Porsche 911 Carrera</div>
                  <span class="showcar-reg">D911 RSR</span>
                  <div class="showcar-owner">David Fletcher</div>
                  <div class="showcar-email">d.fletcher@email.com</div>
                  <div class="showcar-date"><span>Applied 2d ago</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-3"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2021 Porsche 992 GT3</div>
                  <span class="showcar-reg">GT3 992</span>
                  <div class="showcar-owner">Marcus Webb</div>
                  <div class="showcar-email">m.webb@email.com</div>
                  <div class="showcar-date"><span>Applied 3d ago</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-5"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1990 Porsche 964 RS</div>
                  <span class="showcar-reg">964 RSC</span>
                  <div class="showcar-owner">Jessica Morgan</div>
                  <div class="showcar-email">j.morgan@email.com</div>
                  <div class="showcar-date"><span>Applied 4d ago</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn approve" title="Approve" data-action="approve"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button><button class="showcar-action-btn reject" title="Reject" data-action="reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div>
                </div>
              </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex; align-items:center; gap:10px;"><span class="showcars-dot dot-approved"></span>Awaiting Payment</div>
            <div class="section-subtitle">5 applications approved — waiting for payment</div>
          </div>
        </div>
        <div class="section-body">
          <div class="showcars-section-grid">
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-2"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1973 Porsche 911 Targa</div>
                  <span class="showcar-reg">TRG 73P</span>
                  <div class="showcar-owner">Amelia Stone</div>
                  <div class="showcar-email">a.stone@email.com</div>
                  <div class="showcar-date"><span>Approved</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-4"><span class="showcar-category retro">Retro</span></div>
                  <div class="showcar-model">1995 Porsche 993 RS</div>
                  <span class="showcar-reg">993 RSA</span>
                  <div class="showcar-owner">Oliver Brennan</div>
                  <div class="showcar-email">o.brennan@email.com</div>
                  <div class="showcar-date"><span>Approved</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-6"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2008 Porsche 997 GT2</div>
                  <span class="showcar-reg">GT2 997</span>
                  <div class="showcar-owner">Ryan Gallagher</div>
                  <div class="showcar-email">r.gallagher@email.com</div>
                  <div class="showcar-date"><span>Approved</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-7"><span class="showcar-category modern">Modern</span></div>
                  <div class="showcar-model">2006 Porsche Cayman S</div>
                  <span class="showcar-reg">CAY 06S</span>
                  <div class="showcar-owner">Isabel Rowe</div>
                  <div class="showcar-email">i.rowe@email.com</div>
                  <div class="showcar-date"><span>Approved</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-1"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2019 Porsche 911 Speedster</div>
                  <span class="showcar-reg">SPD 991</span>
                  <div class="showcar-owner">Harry Bishop</div>
                  <div class="showcar-email">h.bishop@email.com</div>
                  <div class="showcar-date"><span>Approved</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
              </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex; align-items:center; gap:10px;"><span class="showcars-dot dot-confirmed"></span>Confirmed Show Cars</div>
            <div class="section-subtitle">28 applications paid and confirmed for event</div>
          </div>
          <button class="btn btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export</button>
        </div>
        <div class="section-body">
          <div class="showcars-section-grid">
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-5"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1968 Porsche 912</div>
                  <span class="showcar-reg">912 CLS</span>
                  <div class="showcar-owner">Henry Whitfield</div>
                  <div class="showcar-email">h.whitfield@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-6"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2018 Porsche 991 Turbo S</div>
                  <span class="showcar-reg">TS 991X</span>
                  <div class="showcar-owner">Zara Ahmed</div>
                  <div class="showcar-email">z.ahmed@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-1"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1984 Porsche 930 Turbo</div>
                  <span class="showcar-reg">930 TBO</span>
                  <div class="showcar-owner">Finn Robertson</div>
                  <div class="showcar-email">f.robertson@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-3"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2015 Porsche 918 Spyder</div>
                  <span class="showcar-reg">918 SPY</span>
                  <div class="showcar-owner">Grace Lin</div>
                  <div class="showcar-email">g.lin@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-2"><span class="showcar-category classic">Classic</span></div>
                  <div class="showcar-model">1975 Porsche 911 S</div>
                  <span class="showcar-reg">911 STG</span>
                  <div class="showcar-owner">William Harper</div>
                  <div class="showcar-email">w.harper@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-4"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2010 Porsche 997 GT3 RS</div>
                  <span class="showcar-reg">997 GT3</span>
                  <div class="showcar-owner">Sofia Castellanos</div>
                  <div class="showcar-email">s.castellanos@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-7"><span class="showcar-category retro">Retro</span></div>
                  <div class="showcar-model">1996 Porsche 993 Turbo</div>
                  <span class="showcar-reg">993 TBO</span>
                  <div class="showcar-owner">Lucas Vandermeer</div>
                  <div class="showcar-email">l.vandermeer@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-6"><span class="showcar-category supercar">Supercar</span></div>
                  <div class="showcar-model">2022 Porsche 911 GT3 Touring</div>
                  <span class="showcar-reg">GT3 TRG</span>
                  <div class="showcar-owner">Alice Penrose</div>
                  <div class="showcar-email">a.penrose@email.com</div>
                  <div class="showcar-date"><span>Paid</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
              </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title" style="display:flex; align-items:center; gap:10px;"><span class="showcars-dot dot-rejected"></span>Rejected Show Cars</div>
            <div class="section-subtitle">6 applications rejected</div>
          </div>
          <a href="#" class="section-link">View all 6 →</a>
        </div>
        <div class="section-body">
          <div class="showcars-section-grid">
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-7"><span class="showcar-category modern">Modern</span></div>
                  <div class="showcar-model">2003 Porsche Cayenne</div>
                  <span class="showcar-reg">CAY 03T</span>
                  <div class="showcar-owner">Nathan Price</div>
                  <div class="showcar-email">n.price@email.com</div>
                  <div class="showcar-date"><span>Rejected</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-4"><span class="showcar-category modern">Modern</span></div>
                  <div class="showcar-model">2011 Porsche Panamera</div>
                  <span class="showcar-reg">PAN 11S</span>
                  <div class="showcar-owner">Mia Jensen</div>
                  <div class="showcar-email">m.jensen@email.com</div>
                  <div class="showcar-date"><span>Rejected</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-3"><span class="showcar-category modern">Modern</span></div>
                  <div class="showcar-model">2019 Ford Focus RS</div>
                  <span class="showcar-reg">RS 19F</span>
                  <div class="showcar-owner">Jake Collins</div>
                  <div class="showcar-email">j.collins@email.com</div>
                  <div class="showcar-date"><span>Rejected</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
                <div class="showcar-card" data-detail-type="showcar">
                  <div class="showcar-photo car-6"><span class="showcar-category modern">Modern</span></div>
                  <div class="showcar-model">2005 BMW M3</div>
                  <span class="showcar-reg">BMW 05M</span>
                  <div class="showcar-owner">Chloe Redmond</div>
                  <div class="showcar-email">c.redmond@email.com</div>
                  <div class="showcar-date"><span>Rejected</span><div class="showcar-actions"><button class="showcar-action-btn view" title="View details" data-action="view"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="showcar-action-btn delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div></div>
                </div>
              </div>
        </div>
      </div>
    </div>

    <div class="tab-panel" data-panel="clubs">
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total Clubs</div><div class="kpi-value">8</div></div>
        <div class="kpi">
          <div class="kpi-label">Total Club Sales</div>
          <div class="kpi-value"><span class="currency">£</span>420<span style="font-size:18px; opacity:0.5; font-weight:400;">.00</span></div>
        </div>
        <div class="kpi"><div class="kpi-label">Attending Members</div><div class="kpi-value">42</div></div>
      </div>

            <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Pending Club Applications</div>
            <div class="section-subtitle">2 awaiting review</div>
          </div>
        </div>
        <div class="section-body">
          <div class="app-card-grid">
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Yorkshire Porsche Society</div>
                  <div class="app-card-subtitle">6 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 6<br>
                <strong>Applied:</strong> 3 days ago<br>
                <strong>Contact:</strong> Paul Richardson, paul@yorkshireporschesociety.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" data-action="view">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                <button class="btn btn-primary" data-action="approve">Approve</button>
                <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
              </div>
            </div>
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">North West 911 Club</div>
                  <div class="app-card-subtitle">4 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 4<br>
                <strong>Applied:</strong> 5 days ago<br>
                <strong>Contact:</strong> Helen Moss, helen@northwest911club.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" data-action="view">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                <button class="btn btn-primary" data-action="approve">Approve</button>
                <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Approved Clubs</div>
            <div class="section-subtitle">4 confirmed for event</div>
          </div>
          <button class="btn btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export</button>
        </div>
        <div class="section-body">
          <div class="app-card-grid">
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Porsche Club GB</div>
                  <div class="app-card-subtitle">12 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 12<br>
                <strong>Approved:</strong> 2w ago<br>
                <strong>Contact:</strong> Neil Ashworth, neil@porscheclubgb.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">911 Register</div>
                  <div class="app-card-subtitle">8 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 8<br>
                <strong>Approved:</strong> 2w ago<br>
                <strong>Contact:</strong> Karen Dewhirst, karen@911register.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Classic Leeds Porsche</div>
                  <div class="app-card-subtitle">7 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 7<br>
                <strong>Approved:</strong> 1w ago<br>
                <strong>Contact:</strong> Martin Greaves, martin@classicleedsporsche.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">GT Drivers Collective</div>
                  <div class="app-card-subtitle">5 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 5<br>
                <strong>Approved:</strong> 3d ago<br>
                <strong>Contact:</strong> Sophie Langdon, sophie@gtdriverscollective.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Rejected Clubs</div>
            <div class="section-subtitle">1 application rejected</div>
          </div>
        </div>
        <div class="section-body">
          <div class="app-card-grid">
            <div class="app-card" data-detail-type="club">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">BMW M Owners Club</div>
                  <div class="app-card-subtitle">0 members attending</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Members attending:</strong> 0<br>
                <strong>Rejected:</strong> 1w ago<br>
                <strong>Contact:</strong> Ian Pemberton, ian@bmwmownersclub.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-panel" data-panel="traders">
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total Applications</div><div class="kpi-value">6</div></div>
        <div class="kpi"><div class="kpi-label">Pending Review</div><div class="kpi-value" style="color:var(--warn);">1</div></div>
        <div class="kpi"><div class="kpi-label">Confirmed Traders</div><div class="kpi-value" style="color:var(--success);">4</div></div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Pending Trader Applications</div>
          </div>
        </div>
        <div class="section-body">
          <div class="app-card-grid">
            <div class="app-card" data-detail-type="trader">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Detailing Experts UK</div>
                  <div class="app-card-subtitle">Services · Paint correction</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Pitch:</strong> 3m × 3m<br>
                <strong>Power:</strong> Required · 2kW<br>
                <strong>Contact:</strong> Rachel Green, rachel@detailingexperts.co.uk<br>
                <strong>Applied:</strong> 2 days ago
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" data-action="view">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
                <button class="btn btn-primary" data-action="approve">Approve</button>
                <button class="btn btn-warning" style="border-color:var(--danger-soft); color:var(--danger);" data-action="reject">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <div class="section-title">Approved Traders</div>
            <div class="section-subtitle">4 confirmed for event</div>
          </div>
          <button class="btn btn-secondary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Trader</button>
        </div>
        <div class="section-body">
          <div class="app-card-grid">
            <div class="app-card" data-detail-type="trader">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Design Studio Co.</div>
                  <div class="app-card-subtitle">Merchandise </div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Pitch:</strong> 3m × 3m<br>
                <strong>Power:</strong> Not required<br>
                <strong>Contact:</strong> James Cook, james@designstudio.co
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="trader">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Classic Parts Direct</div>
                  <div class="app-card-subtitle">Aftermarket Parts</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Pitch:</strong> 6m × 3m<br>
                <strong>Power:</strong> Required · 1kW<br>
                <strong>Contact:</strong> Paul Winters, paul@classicparts.co.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="trader">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Coffee &amp; Cars Co.</div>
                  <div class="app-card-subtitle">Food &amp; Drink</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Pitch:</strong> 4m × 3m<br>
                <strong>Power:</strong> Required · 3kW<br>
                <strong>Contact:</strong> Laura Bell, hello@coffeeandcars.com
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
            <div class="app-card" data-detail-type="trader">
              <div class="app-card-top">
                <div>
                  <div class="app-card-name">Performance Dynamics</div>
                  <div class="app-card-subtitle">Tuning</div>
                </div>
              </div>
              <div class="app-card-body">
                <strong>Pitch:</strong> 6m × 3m<br>
                <strong>Power:</strong> Required · 2kW<br>
                <strong>Contact:</strong> Mike Davies, mike@performdynamics.uk
              </div>
              <div class="app-card-actions">
                <button class="btn btn-secondary" style="flex:1" data-action="view"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.6 405.7"> <circle cx="312.9" cy="202.4" r="66.7" fill="none" stroke="#606060" stroke-width="33.3" stroke-linejoin="round"/> <path d="M312.9,19.1c-143.5,0-250.8,119.4-286.8,165.5-8.3,10.6-8.3,25.1,0,35.6,36,46.1,143.3,165.5,286.8,165.5s250.8-119.4,286.8-165.5c8.3-10.6,8.3-25.1,0-35.6-36.1-46.1-143.4-165.5-286.8-165.5Z" fill="none" stroke="#606060" stroke-width="33.3" stroke-linecap="round" stroke-linejoin="round"/> </svg> Details</button>
              <button class="btn btn-secondary btn-delete" title="Delete" data-action="delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </main>
</div>


<!-- Detail Modal -->
<div class="modal-backdrop" id="detailModal" onclick="if(event.target===this) closeDetailModal()">
  <div class="modal detail-modal" role="dialog" aria-labelledby="detailModalTitle" aria-modal="true">
    <button class="detail-modal-close" onclick="closeDetailModal()" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div id="detailBody" class="detail-scroll"></div>
    <div class="detail-footer hidden" id="detailFooter">
      <button class="btn btn-reject" onclick="handleDetailAction('reject')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Reject
      </button>
      <button class="btn btn-approve" onclick="handleDetailAction('approve')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Accept
      </button>
    </div>
  </div>
</div>

<!-- Create Modal -->
<div class="modal-backdrop" id="createModal" onclick="if(event.target===this) closeCreateModal()">
  <div class="modal" role="dialog" aria-labelledby="createModalTitle" aria-modal="true">
    <div class="modal-header">
      <h3 class="modal-title" id="createModalTitle">What would you like to create?</h3>
      <button class="modal-close" onclick="closeCreateModal()" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="create-options">
        <button class="create-option" onclick="handleCreate('event')">
          <div class="create-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="create-option-text">
            <div class="create-option-title">Create Event</div>
            <div class="create-option-desc">Set up a new show, meet or rally</div>
          </div>
          <span class="create-option-chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </button>
        <button class="create-option" onclick="handleCreate('club')">
          <div class="create-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V15.5a.5.5 0 00.5.5H4"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
          </div>
          <div class="create-option-text">
            <div class="create-option-title">Create Car Club</div>
            <div class="create-option-desc">Register a new club page and invite members</div>
          </div>
          <span class="create-option-chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </button>
        <button class="create-option" onclick="handleCreate('venue')">
          <div class="create-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
          </div>
          <div class="create-option-text">
            <div class="create-option-title">Create Venue</div>
            <div class="create-option-desc">Add a new venue for events and meets</div>
          </div>
          <span class="create-option-chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  // Sidebar: drawer on mobile, collapsible on desktop
  function toggleSidebar() {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      document.body.classList.toggle('sidebar-mobile-open');
    } else {
      document.body.classList.toggle('sidebar-desktop-hidden');
    }
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-mobile-open');
  }
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) {
      document.body.classList.remove('sidebar-mobile-open');
    }
  });

  // Tab switching
  function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const newTab = document.querySelector('.tab[data-tab="' + tabName + '"]');
    const newPanel = document.querySelector('.tab-panel[data-panel="' + tabName + '"]');
    if (newTab) newTab.classList.add('active');
    if (newPanel) newPanel.classList.add('active');
    const tabsEl = document.getElementById('tabs');
    if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });


  // Create modal
  function openCreateModal() {
    document.getElementById('createModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCreateModal() {
    document.getElementById('createModal').classList.remove('open');
    document.body.style.overflow = '';
  }
  function handleCreate(type) {
    console.log('Create:', type);
    closeCreateModal();
  }

  // ===== Detail modal (view cards) =====
  let currentDetailEl = null;

  // Deterministic hash for generating mock data from names
  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function makePhone(seed) {
    const a = 7000 + (seed % 1000);
    const b = 100000 + (hashString(String(seed)) % 900000);
    return `+44 7${String(a).slice(1)} ${String(b).slice(0,3)} ${String(b).slice(3)}`;
  }

  function makeHandle(name, platform) {
    const slug = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
    const seed = hashString(name + platform);
    const suffix = seed % 1000;
    return `@${slug}${suffix < 100 ? '' : '_' + (suffix % 99)}`;
  }

  function splitName(full) {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  }

  function extractShowcarData(card) {
    const model = card.querySelector('.showcar-model')?.textContent.trim() || '';
    const reg = card.querySelector('.showcar-reg')?.textContent.trim() || '';
    const owner = card.querySelector('.showcar-owner')?.textContent.trim() || '';
    const email = card.querySelector('.showcar-email')?.textContent.trim() || '';
    const dateSpan = card.querySelector('.showcar-date span')?.textContent.trim() || '';
    const photoEl = card.querySelector('.showcar-photo');
    const catEl = card.querySelector('.showcar-category');
    const photoClass = photoEl ? (Array.from(photoEl.classList).find(c => c.startsWith('car-')) || 'car-1') : 'car-1';
    const category = catEl ? catEl.textContent.trim() : '';
    const categoryClass = catEl ? (Array.from(catEl.classList).find(c => ['classic','retro','modern','supercar'].includes(c)) || '') : '';

    // Parse year/make/model from the combined model string (e.g. "1987 Porsche 911 Carrera")
    const modelMatch = model.match(/^(\d{4})\s+(\S+)\s+(.+)$/);
    const year = modelMatch ? modelMatch[1] : '';
    const make = modelMatch ? modelMatch[2] : '';
    const modelName = modelMatch ? modelMatch[3] : model;

    const { first, last } = splitName(owner);
    const seed = hashString(owner);

    // Determine status from date text / context
    let status = 'Pending Review';
    if (dateSpan.toLowerCase().startsWith('approved')) status = 'Awaiting Payment';
    else if (dateSpan.toLowerCase().startsWith('paid')) status = 'Confirmed';
    else if (dateSpan.toLowerCase().startsWith('rejected')) status = 'Rejected';
    else if (dateSpan.toLowerCase().startsWith('applied')) status = 'Pending Review';

    // Mock extra fields (deterministic from name)
    const clubs = ['No', 'Porsche Club GB', '911 Register', 'Classic Leeds Porsche', 'GT Drivers Collective', 'No', 'Yorkshire Porsche Society'];
    const descriptions = [
      `Fully restored example with matching numbers. Recent engine rebuild and respray in original colour. Regularly shown at meets across the north of England.`,
      `Single-owner car with full service history from new. Kept garaged and driven on dry days only. Upgraded suspension and period-correct wheels.`,
      `Recently imported and UK-registered. Currently undergoing light recommissioning. Exterior and interior in excellent original condition.`,
      `Enthusiast-owned for over a decade. Has featured in club magazines and attended international events. All paperwork and provenance available on request.`,
      `Ground-up restoration completed in 2022. Correct to factory spec throughout with a few sympathetic modern upgrades for reliability.`
    ];

    return {
      type: 'showcar',
      title: model,
      reg,
      photoClass,
      category,
      categoryClass,
      year, make, model: modelName,
      firstName: first,
      lastName: last,
      email,
      phone: makePhone(seed),
      instagram: makeHandle(owner, 'ig'),
      tiktok: makeHandle(owner, 'tt'),
      club: clubs[seed % clubs.length],
      description: descriptions[seed % descriptions.length],
      applied: dateSpan || 'Applied recently',
      updated: status === 'Pending Review' ? dateSpan : 'Updated ' + (['1d ago','2d ago','3d ago','1w ago'][seed % 4]),
      status
    };
  }

  function statusPillClass(status) {
    const s = status.toLowerCase();
    if (s.includes('pending') || s.includes('awaiting')) return 'pending';
    if (s.includes('confirmed') || s.includes('approved') || s.includes('paid')) return 'paid';
    if (s.includes('rejected')) return 'refunded';
    return 'pending';
  }

  function buildShowcarBody(d) {
    const catBadge = d.category
      ? `<span class="showcar-category ${d.categoryClass}">${d.category}</span>`
      : '';
    const pill = statusPillClass(d.status);
    return `
      <div class="detail-photo ${d.photoClass}">
        ${catBadge}
      </div>
      <div class="detail-header">
        <div class="detail-title" id="detailModalTitle">${d.title}</div>
        <span class="detail-title-reg">${d.reg}</span>
      </div>
      <div class="detail-meta-row">
        <div><span class="pill ${pill}">${d.status}</span></div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Applicant Information</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">First name</div><div class="detail-value">${d.firstName || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Last name</div><div class="detail-value">${d.lastName || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value"><a href="mailto:${d.email}">${d.email}</a></div></div>
          <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value mono">${d.phone}</div></div>
          <div class="detail-field"><div class="detail-label">Instagram</div><div class="detail-value">${d.instagram}</div></div>
          <div class="detail-field"><div class="detail-label">TikTok</div><div class="detail-value">${d.tiktok}</div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Vehicle Information</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">Category applied</div><div class="detail-value">${d.category || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Year</div><div class="detail-value mono">${d.year || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Make</div><div class="detail-value">${d.make || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Model</div><div class="detail-value">${d.model || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Registration</div><div class="detail-value mono">${d.reg}</div></div>
          <div class="detail-field"><div class="detail-label">Car club member</div><div class="detail-value ${d.club === 'No' ? 'muted' : ''}">${d.club}</div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Additional Information</div>
        <div class="detail-description">${d.description}</div>
      </div>
    `;
  }


  function extractClubData(row) {
    const name = row.querySelector('.app-card-name')?.textContent.trim() || '';
    const subtitle = row.querySelector('.app-card-subtitle')?.textContent.trim() || '';
    const body = row.querySelector('.app-card-body');
    const bodyHtml = body ? body.innerHTML : '';
    const bodyText = body ? body.textContent : '';

    // Status inference — no .pill in new card layout, so read from sub-section context
    const seed = hashString(name);

    // Determine status from body labels (falling back to button presence)
    let status = 'Pending Review';
    if (/Rejected:<\/strong>/i.test(body ? body.innerHTML : '')) status = 'Rejected';
    else if (/Approved:<\/strong>/i.test(body ? body.innerHTML : '')) status = 'Approved';
    else if (row.querySelector('[data-action="approve"]')) status = 'Pending Review';

    // Spaces = members attending (parse from subtitle like "6 members attending")
    const spacesMatch = subtitle.match(/(\d+)\s+members/i);
    const spaces = spacesMatch ? spacesMatch[1] : '—';

    // Applied / updated parsing from body innerHTML
    let applied = `Applied ${(seed % 10) + 1}d ago`;
    let updated = applied;
    const appliedMatch = bodyHtml.match(/Applied:<\/strong>\s*([^<]+)/i);
    const approvedMatch = bodyHtml.match(/Approved:<\/strong>\s*([^<]+)/i);
    const rejectedMatch = bodyHtml.match(/Rejected:<\/strong>\s*([^<]+)/i);

    if (appliedMatch) applied = 'Applied ' + appliedMatch[1].trim();
    if (approvedMatch) {
      updated = 'Approved ' + approvedMatch[1].trim();
      if (!appliedMatch) applied = 'Applied before ' + approvedMatch[1].trim();
    } else if (rejectedMatch) {
      updated = 'Rejected ' + rejectedMatch[1].trim();
      if (!appliedMatch) applied = 'Applied before ' + rejectedMatch[1].trim();
    } else if (appliedMatch) {
      updated = applied;
    }

    // Contact name/email — parse from body if present, else mock
    const contactMatch = bodyHtml.match(/Contact:<\/strong>\s*([^,<]+)(?:,\s*([^<]+))?/i);
    let contactName = '';
    let contactEmail = '';
    if (contactMatch) {
      contactName = contactMatch[1].trim();
      contactEmail = contactMatch[2] ? contactMatch[2].trim() : '';
    }
    if (!contactName) {
      const contactNames = [
        'Paul Richardson', 'Helen Moss', 'Neil Ashworth', 'Karen Dewhirst',
        'Martin Greaves', 'Sophie Langdon', 'Ian Pemberton', 'Fiona Whitelock'
      ];
      contactName = contactNames[seed % contactNames.length];
    }
    const { first: cFirst, last: cLast } = splitName(contactName);
    if (!contactEmail) {
      contactEmail = `${cFirst.toLowerCase()}@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.co.uk`;
    }

    const descriptions = [
      `Established enthusiast club with a strong regional following. Regular track days, social meets and an active online community. Members are keen to attend in numbers.`,
      `Long-running marque-focused club celebrating both the heritage and modern evolution of the cars we love. Monthly meets and an annual show keep the calendar busy.`,
      `Friendly, inclusive community that welcomes all levels of ownership. We organise a mix of scenic drives, workshops and social gatherings throughout the year.`,
      `Specialist club with deep technical expertise amongst members. Known for bringing concours-quality examples to events and running informative tech sessions.`,
      `Growing club with an emphasis on driving rather than just shining. Members span several generations of the same marque with a healthy competitive edge.`
    ];

    return {
      type: 'club',
      name,
      spaces,
      contactName,
      contactFirst: cFirst,
      contactLast: cLast,
      contactEmail,
      contactPhone: makePhone(seed),
      description: descriptions[seed % descriptions.length],
      applied,
      updated,
      status
    };
  }

  function buildClubBody(d) {
    const pill = statusPillClass(d.status);
    return `
      <div class="detail-header no-photo">
        <div class="detail-title" id="detailModalTitle">${d.name}</div>
      </div>
      <div class="detail-meta-row">
        <div><span class="pill ${pill}">${d.status}</span></div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Club Details</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">Club name</div><div class="detail-value">${d.name}</div></div>
          <div class="detail-field"><div class="detail-label">Spaces requested</div><div class="detail-value mono">${d.spaces}</div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Contact Information</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">Contact name</div><div class="detail-value">${d.contactName}</div></div>
          <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value mono">${d.contactPhone}</div></div>
          <div class="detail-field" style="grid-column: 1 / -1;"><div class="detail-label">Email</div><div class="detail-value"><a href="mailto:${d.contactEmail}">${d.contactEmail}</a></div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Additional Information</div>
        <div class="detail-description">${d.description}</div>
      </div>
    `;
  }

  function extractTraderData(el) {
    // Now always an .app-card with data-detail-type='trader'
    const isCard = el.classList.contains('app-card');

    const name = isCard
      ? (el.querySelector('.app-card-name')?.textContent.trim() || '')
      : (el.querySelector('.club-name')?.textContent.trim() || '');

    const category = isCard
      ? (el.querySelector('.app-card-subtitle')?.textContent.trim() || '')
      : (el.querySelector('.club-sub')?.textContent.trim().split('·')[0].trim() || '');

    const pill = el.querySelector('.pill');
    let status = 'Pending Review';
    // Pending trader card sits inside "Pending Trader Applications" section and has an Approve button
    const inPendingCard = isCard && el.querySelector('.btn-primary');
    if (pill) {
      status = pill.textContent.trim();
    } else if (inPendingCard) {
      status = 'Pending Review';
    } else if (isCard) {
      status = 'Approved';
    }

    // Extract pitch and contact from .trader-details if available
    let pitch = '';
    let contactLine = '';
    let appliedLine = '';
    if (isCard) {
      const details = el.querySelector('.app-card-body');
      if (details) {
        const html = details.innerHTML;
        const pitchMatch = html.match(/Pitch:<\/strong>\s*([^<]+)/i);
        const contactMatch = html.match(/Contact:<\/strong>\s*([^<]+)/i);
        const appliedMatch = html.match(/Applied:<\/strong>\s*([^<]+)/i);
        pitch = pitchMatch ? pitchMatch[1].trim() : '';
        contactLine = contactMatch ? contactMatch[1].trim() : '';
        appliedLine = appliedMatch ? appliedMatch[1].trim() : '';
      }
    }
    // Pull name + email out of the contact line if possible
    let firstName = '', lastName = '', email = '';
    if (contactLine) {
      const parts = contactLine.split(',').map(s => s.trim());
      if (parts.length >= 1) {
        const n = splitName(parts[0]);
        firstName = n.first;
        lastName = n.last;
      }
      if (parts.length >= 2) email = parts[1];
    }

    const seed = hashString(name);

    // Fallback mock values for anything missing
    if (!firstName) {
      const firsts = ['Alex', 'Jordan', 'Sam', 'Casey', 'Taylor', 'Morgan', 'Drew', 'Blake'];
      firstName = firsts[seed % firsts.length];
    }
    if (!lastName) {
      const lasts = ['Holloway', 'Brenton', 'Dalton', 'Keene', 'Marsh', 'Thorne', 'Vance', 'Wade'];
      lastName = lasts[(seed >> 3) % lasts.length];
    }
    if (!email) {
      email = `${firstName.toLowerCase()}@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.co.uk`;
    }

    if (!pitch) pitch = '3m × 3m';

    const applied = appliedLine ? 'Applied ' + appliedLine : `Applied ${(seed % 7) + 1}d ago`;
    const updated = status === 'Pending Review'
      ? applied
      : `Updated ${(seed % 14) + 1}d ago`;

    return {
      type: 'trader',
      name,
      category: category || 'General',
      space: pitch,
      firstName,
      lastName,
      email,
      phone: makePhone(seed),
      instagram: makeHandle(name, 'ig'),
      tiktok: makeHandle(name, 'tt'),
      applied,
      updated,
      status
    };
  }

  function buildTraderBody(d) {
    const pill = statusPillClass(d.status);
    return `
      <div class="detail-header no-photo">
        <div class="detail-title" id="detailModalTitle">${d.name}</div>
      </div>
      <div class="detail-meta-row">
        <div><span class="pill ${pill}">${d.status}</span></div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Trader Details</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">Category applied</div><div class="detail-value">${d.category}</div></div>
          <div class="detail-field"><div class="detail-label">Space required</div><div class="detail-value mono">${d.space}</div></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Applicant Information</div>
        <div class="detail-grid">
          <div class="detail-field"><div class="detail-label">First name</div><div class="detail-value">${d.firstName || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Last name</div><div class="detail-value">${d.lastName || '—'}</div></div>
          <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value"><a href="mailto:${d.email}">${d.email}</a></div></div>
          <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value mono">${d.phone}</div></div>
          <div class="detail-field"><div class="detail-label">Instagram</div><div class="detail-value">${d.instagram}</div></div>
          <div class="detail-field"><div class="detail-label">TikTok</div><div class="detail-value">${d.tiktok}</div></div>
        </div>
      </div>
    `;
  }

  function openDetailModal(el) {
    const type = el.getAttribute('data-detail-type');
    currentDetailEl = el;
    const body = document.getElementById('detailBody');
    let data;
    if (type === 'club') {
      data = extractClubData(el);
      body.innerHTML = buildClubBody(data);
    } else if (type === 'trader') {
      data = extractTraderData(el);
      body.innerHTML = buildTraderBody(data);
    } else {
      data = extractShowcarData(el);
      body.innerHTML = buildShowcarBody(data);
    }

    // Show footer only for pending items
    const footer = document.getElementById('detailFooter');
    const isPending = /pending/i.test(data.status);
    footer.classList.toggle('hidden', !isPending);

    document.getElementById('detailModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0;
  }

  function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('open');
    document.body.style.overflow = '';
    currentDetailEl = null;
  }

  function handleDetailAction(action) {
    console.log('Detail action:', action, currentDetailEl);
    closeDetailModal();
  }


  // Unified dropdown + card-click handler
  document.addEventListener('click', function(e) {
    // Handle action buttons (approve/reject/view) inside cards — stop propagation to card click
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.getAttribute('data-action');
      if (action === 'view') {
        const card = actionBtn.closest('[data-detail-type]');
        if (card) openDetailModal(card);
      } else if (action === 'approve' || action === 'reject') {
        console.log('Card action:', action, actionBtn.closest('[data-detail-type]'));
      } else if (action === 'delete') {
        const card = actionBtn.closest('[data-detail-type]');
        if (confirm('Delete this entry? This action cannot be undone.')) {
          console.log('Card action: delete', card);
        }
      }
      return;
    }
    // Handle clicks on cards/rows with data-detail-type (opens modal)
    const detailCard = e.target.closest('[data-detail-type]');
    if (detailCard && !e.target.closest('.dropdown') && !e.target.closest('button')) {
      openDetailModal(detailCard);
      return;
    }
    const trigger = e.target.closest('[data-toggle-dropdown]');
    if (trigger) {
      e.stopPropagation();
      e.preventDefault();
      const dropdown = trigger.closest('.dropdown');
      if (!dropdown) return;
      const wasOpen = dropdown.classList.contains('open');
      document.querySelectorAll('.dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open', !wasOpen);
      return;
    }
    const menuItem = e.target.closest('.dropdown-menu-item');
    if (menuItem) {
      const dropdown = menuItem.closest('.dropdown');
      if (dropdown) dropdown.classList.remove('open');
      return;
    }
    if (!e.target.closest('.dropdown-menu')) {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      closeSidebar();
      closeCreateModal();
      closeDetailModal();
    }
  });

  // Sidebar nav click behavior
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      this.classList.add('active');
      if (window.matchMedia('(max-width: 900px)').matches) {
        closeSidebar();
      }
    });
  });
</script>


</body>
</html>
