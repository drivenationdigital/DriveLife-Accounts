<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Edit Event · CarEvents.com</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <!-- Right Grotesk Narrow Bold (commercial — swap to self-hosted licensed copy for production) -->
  <style>
    @font-face {
      font-family: 'Right Grotesk Narrow';
      font-weight: 700;
      font-style: normal;
      font-display: swap;
      src: url('https://db.onlinewebfonts.com/t/c5d01a0b8635022614bb7c7782d8e5d8.woff2') format('woff2'),
           url('https://db.onlinewebfonts.com/t/c5d01a0b8635022614bb7c7782d8e5d8.woff') format('woff'),
           url('https://db.onlinewebfonts.com/t/c5d01a0b8635022614bb7c7782d8e5d8.ttf') format('truetype');
    }
  </style>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            gold: {
              50:  '#fdfaf3',
              100: '#f7eed6',
              200: '#ecd9a4',
              300: '#dcbd72',
              400: '#cba75f',
              500: '#b89855',
              600: '#9a7f45',
              700: '#7a6538',
              800: '#5c4c2b',
              900: '#3e331d',
            },
            ink: {
              900: '#0f0f0f',
              700: '#292929',
              500: '#5c5c5c',
              400: '#8a8a8a',
              300: '#b8b8b8',
              200: '#e5e5e5',
              100: '#f1f1f1',
              50:  '#fafafa',
            },
          },
          fontFamily: {
            display: ['"Right Grotesk Narrow"', '"Archivo Narrow"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          },
          boxShadow: {
            card: '0 1px 2px rgba(15,15,15,0.04), 0 4px 12px rgba(15,15,15,0.04)',
            pop:  '0 8px 32px rgba(15,15,15,0.12)',
          },
        },
      },
    };
  </script>

  <style>
    html, body { font-family: 'Manrope', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    .font-display {
      font-family: 'Right Grotesk Narrow', 'Archivo Narrow', ui-sans-serif, system-ui, sans-serif;
      font-weight: 700;
      font-stretch: condensed;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }

    /* Hide scrollbar on tab bar + lock touch to horizontal-only
       (so a vertical drag scrolls the page instead of getting eaten by the tab strip) */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar {
      scrollbar-width: none;
      touch-action: pan-x;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }

    /* Panel fade-in */
    .panel { display: none; }
    .panel.is-active { display: block; animation: panelIn .28s cubic-bezier(.2,.7,.3,1); }
    @keyframes panelIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* Form fields — explicit CSS (more portable than @apply on the CDN) */
    .input, .textarea, .select {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #e5e5e5;
      background: #fff;
      color: #0f0f0f;
      font-size: 15px;
      line-height: 1.4;
      transition: border-color .15s, box-shadow .15s;
      font-family: inherit;
    }
    .textarea { padding: 14px; resize: vertical; }
    .input::placeholder, .textarea::placeholder { color: #8a8a8a; }
    .input:focus, .textarea:focus, .select:focus {
      outline: none;
      border-color: #b89855;
      box-shadow: 0 0 0 4px rgba(184,152,85,0.14);
    }
    .select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%238a8a8a' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 2.25rem;
    }
    /* Icon-prefixed inputs — reserves space for absolute-positioned icon at left-4 */
    .input.has-icon { padding-left: 2.75rem; }

    /* iOS Safari fix — native time/date controls have internal min-width from their
       shadow DOM that can overflow a 100%-width container. Neutralising -webkit-appearance
       removes the inner chrome while keeping the native picker UX intact, and min-width:0
       lets flex/grid children shrink below their intrinsic width. font-size:16px prevents
       iOS auto-zoom on focus (anything under 16px triggers it). */
    input[type="time"],
    input[type="date"],
    input[type="datetime-local"] {
      -webkit-appearance: none;
      appearance: none;
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
      width: 100%;
      font-size: 16px;
      font-family: inherit;
      line-height: 1.4;
    }
    /* Stop iOS from centre-aligning the value text */
    input[type="time"]::-webkit-date-and-time-value,
    input[type="date"]::-webkit-date-and-time-value {
      text-align: left;
    }

    /* Tab styling */
    .tab { position: relative; white-space: nowrap; }
    .tab.is-active { color: #0f0f0f; }
    .tab.is-active::after {
      content: '';
      position: absolute;
      left: 16px; right: 16px; bottom: -1px;
      height: 2px; background: #b89855; border-radius: 2px;
    }
    .tab-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
      background: #f1f1f1; color: #5c5c5c;
      transition: all .2s;
    }
    .tab.is-active .tab-num { background: #b89855; color: #fff; }
    .tab.is-complete .tab-num { background: #0f0f0f; color: #fff; }
    .tab.is-complete .tab-num::before { content: '\f00c'; font-family: 'Font Awesome 6 Free'; font-weight: 900; font-size: 10px; }
    .tab.is-complete .tab-num .num-text { display: none; }

    /* Chips */
    .chip {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 999px;
      border: 1px solid #e5e5e5; background: #fff;
      font-size: 13px; font-weight: 500; color: #292929;
      cursor: pointer; transition: all .15s;
      user-select: none;
    }
    .chip:hover { border-color: #dcbd72; }
    .chip.is-active { background: #fdfaf3; border-color: #b89855; color: #5c4c2b; padding-left: 10px; }
    .chip .check { display: none; width: 14px; height: 14px; color: #b89855; }
    .chip.is-active .check { display: inline-block; }

    /* Checkbox — custom styled */
    .cb-label { display: flex; align-items: center; gap: 12px; padding: 10px 0; cursor: pointer; user-select: none; }
    .cb-label input { position: absolute; opacity: 0; pointer-events: none; }
    .cb-box {
      width: 20px; height: 20px; border-radius: 6px;
      border: 1.5px solid #d4d4d4; background: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all .15s;
    }
    .cb-label:hover .cb-box { border-color: #b89855; }
    .cb-label input:focus-visible + .cb-box { box-shadow: 0 0 0 3px rgba(184,152,85,0.25); }
    .cb-label input:checked + .cb-box { background: #b89855; border-color: #b89855; }
    .cb-label input:checked + .cb-box::after {
      content: ''; width: 10px; height: 5px;
      border-left: 2px solid #fff; border-bottom: 2px solid #fff;
      transform: rotate(-45deg) translate(0, -1px);
    }
    .cb-label .cb-text { font-size: 14px; color: #292929; line-height: 1.3; }
    .cb-label:hover .cb-text { color: #0f0f0f; }

    /* Date field trigger button — styled like an input */
    .date-field {
      display: flex; align-items: center; gap: 12px;
      width: 100%; padding: 16px 20px;
      border: 1px solid #e5e5e5; border-radius: 8px;
      background: #fff; text-align: left; cursor: pointer;
      font-size: 15px; color: #0f0f0f;
      transition: all .15s;
    }
    .date-field:hover { border-color: #cba75f; }
    .date-field:focus { outline: none; border-color: #b89855; box-shadow: 0 0 0 4px rgba(184,152,85,.14); }
    .date-field .df-icon { color: #8a8a8a; }
    .date-field .df-display { flex: 1; }
    .date-field.is-empty .df-display { color: #8a8a8a; }
    .date-field .df-chev { color: #b8b8b8; font-size: 11px; }

    /* Fullscreen datepicker */
    .fsdp-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(15,15,15,0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; flex-direction: column;
      animation: fsdpIn .22s ease-out;
    }
    @keyframes fsdpIn { from { opacity: 0; } to { opacity: 1; } }
    .fsdp-panel {
      flex: 1; display: flex; flex-direction: column;
      background: #fff;
      animation: fsdpSlide .28s cubic-bezier(.2,.7,.3,1);
    }
    @keyframes fsdpSlide { from { transform: translateY(16px); opacity: 0.85; } to { transform: translateY(0); opacity: 1; } }
    @media (min-width: 640px) {
      .fsdp-overlay { padding: 2.5rem; align-items: center; justify-content: center; }
      .fsdp-panel { flex: 0 1 auto; width: 100%; max-width: 480px; max-height: calc(100vh - 5rem); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
    }
    .fsdp-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #e5e5e5; }
    .fsdp-body { flex: 1; overflow-y: auto; padding: 20px 20px 24px; display: flex; flex-direction: column; }
    .fsdp-nav { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 20px; }
    .fsdp-month-label { font-family: 'Right Grotesk Narrow', 'Archivo Narrow', system-ui, sans-serif; font-weight: 700; font-size: 22px; color: #0f0f0f; letter-spacing: -0.005em; text-transform: uppercase; }
    .fsdp-nav-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid #e5e5e5; background: #fff; color: #292929; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .15s; }
    .fsdp-nav-btn:hover { border-color: #b89855; color: #b89855; }
    .fsdp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 6px; }
    .fsdp-weekday { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8a8a8a; text-align: center; padding: 8px 0; }
    .fsdp-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .fsdp-day {
      aspect-ratio: 1/1; max-height: 52px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent; cursor: pointer;
      font-size: 14px; font-weight: 500; color: #292929;
      border-radius: 10px; transition: all .12s;
    }
    .fsdp-day:hover:not(.is-muted):not(.is-selected) { background: #fdfaf3; color: #5c4c2b; }
    .fsdp-day.is-muted { color: #d4d4d4; }
    .fsdp-day.is-today { box-shadow: inset 0 0 0 1.5px #b89855; color: #5c4c2b; }
    .fsdp-day.is-selected { background: #b89855 !important; color: #fff !important; box-shadow: none; }
    .fsdp-footer { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-top: 1px solid #e5e5e5; background: #fafafa; }
    .fsdp-quickbtn { padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; background: transparent; border: none; color: #5c5c5c; cursor: pointer; transition: all .15s; }
    .fsdp-quickbtn:hover { color: #0f0f0f; background: #fff; }
    body.fsdp-open { overflow: hidden; }

    /* Application Links block (Show Cars + Car Clubs) */
    .app-links-card {
      background: linear-gradient(135deg, #fdfaf3 0%, #ffffff 100%);
      border: 1px solid #ecd9a4;
      border-radius: 16px;
      padding: 20px;
    }
    .link-row {
      display: flex; align-items: stretch; gap: 0;
      background: #fff; border: 1px solid #e5e5e5;
      border-radius: 10px; overflow: hidden;
    }
    .link-row input {
      flex: 1; min-width: 0; border: none; outline: none;
      padding: 12px 14px; font-size: 13px;
      background: transparent; font-family: inherit; color: #292929;
    }
    .link-row .link-icon { padding: 0 14px; display: flex; align-items: center; color: #8a8a8a; border-right: 1px solid #e5e5e5; }
    .link-row .copy-btn {
      padding: 0 16px; background: #fafafa; border: none; border-left: 1px solid #e5e5e5;
      color: #292929; font-size: 12px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all .15s; flex-shrink: 0;
    }
    .link-row .copy-btn:hover { background: #b89855; color: #fff; }
    .link-row .copy-btn.is-copied { background: #047857; color: #fff; }
    .embed-block {
      position: relative; background: #0f0f0f; border-radius: 10px;
      overflow: hidden;
    }
    .embed-block pre {
      margin: 0; padding: 16px 16px 16px 18px;
      font-family: 'SFMono-Regular', 'Consolas', 'Menlo', monospace;
      font-size: 12px; line-height: 1.55; color: #ecd9a4;
      overflow-x: auto; white-space: pre;
    }
    .embed-block .copy-btn {
      position: absolute; top: 10px; right: 10px;
      padding: 6px 12px; background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
      color: #fff; font-size: 11px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all .15s;
    }
    .embed-block .copy-btn:hover { background: #b89855; border-color: #b89855; }
    .embed-block .copy-btn.is-copied { background: #047857; border-color: #047857; }

    /* Segmented */
    .seg { display: inline-flex; padding: 4px; background: #f1f1f1; border-radius: 12px; gap: 2px; }
    .seg-btn {
      flex: 1; padding: 8px 14px; border-radius: 9px;
      font-size: 13px; font-weight: 500; color: #5c5c5c;
      cursor: pointer; border: none; background: transparent;
      transition: all .18s;
    }
    .seg-btn.is-active { background: #fff; color: #0f0f0f; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04); }

    /* Switch */
    .switch { position: relative; display: inline-block; width: 44px; height: 26px; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; background: #e5e5e5; border-radius: 999px; cursor: pointer; transition: .2s; }
    .slider::before { content: ''; position: absolute; height: 20px; width: 20px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
    .switch input:checked + .slider { background: #b89855; }
    .switch input:checked + .slider::before { transform: translateX(18px); }

    /* Dropzone */
    .dropzone {
      border: 2px dashed #e5e5e5; border-radius: 16px;
      transition: all .2s; background: #fafafa;
    }
    .dropzone:hover, .dropzone.is-dragover { border-color: #b89855; background: #fdfaf3; }

    /* Image preview tile */
    .gallery-tile { position: relative; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; background: #fafafa; }
    .gallery-tile .tile-actions { position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity .2s; }
    .gallery-tile:hover .tile-actions { opacity: 1; }

    /* Ticket card hover */
    .ticket-card { transition: all .2s; }
    .ticket-card:hover { border-color: #dcbd72; box-shadow: 0 2px 8px rgba(184,152,85,0.08); }

    /* AI sparkle */
    @keyframes sparkle { 0%,100% { transform: scale(1) rotate(0); } 50% { transform: scale(1.2) rotate(15deg); } }
    .ai-sparkle { animation: sparkle 2.2s ease-in-out infinite; display: inline-block; }

    /* Reduce motion */
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }

    /* Sidebar navigation (desktop only) */
    .side-tab {
      width: 100%; display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: 10px;
      text-align: left; border: none; background: transparent;
      cursor: pointer; transition: all .15s;
      position: relative;
    }
    .side-tab:hover { background: #fafafa; }
    .side-tab.is-active { background: #fdfaf3; }
    .side-tab.is-active::before {
      content: ''; position: absolute; left: 0; top: 10px; bottom: 10px;
      width: 3px; background: #b89855; border-radius: 0 3px 3px 0;
    }
    .side-num {
      width: 28px; height: 28px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
      background: #f1f1f1; color: #5c5c5c;
      flex-shrink: 0; transition: all .2s;
    }
    .side-tab.is-active .side-num { background: #b89855; color: #fff; }
    .side-tab.is-complete .side-num { background: #0f0f0f; color: #fff; }
    .side-tab.is-complete .side-num .num-text { display: none; }
    .side-tab.is-complete .side-num::before { content: '\f00c'; font-family: 'Font Awesome 6 Free'; font-weight: 900; font-size: 11px; }
    .side-tab-label { font-size: 14px; font-weight: 600; color: #292929; line-height: 1.3; }
    .side-tab.is-active .side-tab-label { color: #5c4c2b; }
    .side-tab-sub { font-size: 12px; color: #8a8a8a; margin-top: 2px; line-height: 1.3; }
  </style>
</head>

<body class="bg-ink-50 text-ink-900 min-h-screen">

  <!-- ============================================================
       TOP BAR
       Flutter: AppBar with leading back button, title, actions.
       ============================================================ -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-200">
    <div class="px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
      <a href="#" class="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition">
        <i class="fa-solid fa-arrow-left text-sm"></i>
        <span class="hidden sm:inline text-sm font-medium">Dashboard</span>
      </a>
      <div class="h-6 w-px bg-ink-200 hidden sm:block lg:hidden"></div>
      <div class="flex-1 min-w-0 lg:hidden">
        <p class="text-[11px] uppercase tracking-widest text-ink-400 font-semibold hidden sm:block">Edit event</p>
        <h1 class="text-sm sm:text-base font-semibold truncate text-ink-900">Weekends in the Yard – Sunday Service @ The Hill</h1>
      </div>
      <div class="hidden lg:block flex-1"></div>
      <span class="hidden md:inline-flex items-center gap-1.5 text-xs text-ink-500">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Saved
      </span>
      <button class="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-ink-900 hover:bg-black rounded-lg transition">
        <i class="fa-regular fa-eye"></i>
        Preview
      </button>
      <button id="top-publish" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition shadow-sm">
        <i class="fa-solid fa-rocket text-xs"></i>
        <span class="hidden sm:inline">Publish</span>
      </button>
    </div>
  </header>

  <!-- ============================================================
       LAYOUT WRAPPER — sidebar flushes to viewport edge (lg+);
       main content column has its own max-width for readability
       ============================================================ -->
  <div class="lg:flex">

    <!-- ========================================================
         SIDEBAR (desktop only)
         Flutter: NavigationRail or Drawer on tablet+
         ======================================================== -->
    <aside class="hidden lg:flex lg:flex-col lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-72 lg:shrink-0 border-r border-ink-200 bg-white">
      <!-- Event title -->
      <div class="px-6 pt-6 pb-5 border-b border-ink-200">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1.5">Editing event</p>
        <h2 class="font-display text-xl text-ink-900 leading-snug">Weekends in the Yard – Sunday Service @ The Hill</h2>
        <p class="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
          <i class="fa-solid fa-mug-hot text-gold-600 text-[10px]"></i>
          Caffeine &amp; Machine: The Hill
        </p>
      </div>

      <!-- Section navigation -->
      <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Event editor sections">
        <ul class="space-y-0.5">
          <li>
            <button class="side-tab is-active" data-side-tab="details">
              <span class="side-num"><span class="num-text">1</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Basics</span>
                <span class="side-tab-sub block">Title, categories, location</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="dates">
              <span class="side-num"><span class="num-text">2</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Dates &amp; times</span>
                <span class="side-tab-sub block">Schedule, timezone</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="description">
              <span class="side-num"><span class="num-text">3</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Description</span>
                <span class="side-tab-sub block">Cover, copy, links</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="gallery">
              <span class="side-num"><span class="num-text">4</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Gallery</span>
                <span class="side-tab-sub block">Photos &amp; media</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="tickets">
              <span class="side-num"><span class="num-text">5</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Tickets &amp; entry</span>
                <span class="side-tab-sub block">Pricing &amp; options</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="discounts">
              <span class="side-num"><span class="num-text">6</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Discounts &amp; upsells</span>
                <span class="side-tab-sub block">Promo codes &amp; offers</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="show-cars">
              <span class="side-num"><span class="num-text">7</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Show cars</span>
                <span class="side-tab-sub block">Applications &amp; categories</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="car-clubs">
              <span class="side-num"><span class="num-text">8</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Car clubs</span>
                <span class="side-tab-sub block">Club applications</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="traders">
              <span class="side-num"><span class="num-text">9</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Traders</span>
                <span class="side-tab-sub block">Trade applications</span>
              </span>
            </button>
          </li>
          <li>
            <button class="side-tab" data-side-tab="publish">
              <span class="side-num"><span class="num-text">10</span></span>
              <span class="flex-1 min-w-0">
                <span class="side-tab-label block">Publish</span>
                <span class="side-tab-sub block">Status &amp; visibility</span>
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Progress footer -->
      <div class="px-6 py-4 border-t border-ink-200 bg-ink-50">
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="font-semibold text-ink-700">Progress</span>
          <span class="text-ink-500"><span id="progress-count">1</span> / 10</span>
        </div>
        <div class="h-1.5 bg-ink-200 rounded-full overflow-hidden">
          <div id="progress-bar" class="h-full bg-gold-500 rounded-full transition-all duration-300" style="width: 10%"></div>
        </div>
      </div>
    </aside>

    <!-- ========================================================
         RIGHT COLUMN (tabs on mobile, main content)
         ======================================================== -->
    <div class="lg:flex-1 lg:min-w-0">

  <!-- ============================================================
       TAB BAR — shown on mobile/tablet only; desktop uses sidebar
       Flutter: TabBar(isScrollable: true) inside DefaultTabController
       ============================================================ -->
  <nav class="lg:hidden sticky top-14 sm:top-16 z-30 bg-white border-b border-ink-200">
    <div class="max-w-6xl mx-auto px-2 sm:px-6">
      <div class="no-scrollbar overflow-x-auto flex items-center" role="tablist" aria-label="Event editor sections">
        <button class="tab is-active flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="details" role="tab" aria-selected="true">
          <span class="tab-num"><span class="num-text">1</span></span>
          Basics
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="dates" role="tab">
          <span class="tab-num"><span class="num-text">2</span></span>
          Dates
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="description" role="tab">
          <span class="tab-num"><span class="num-text">3</span></span>
          Description
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="gallery" role="tab">
          <span class="tab-num"><span class="num-text">4</span></span>
          Gallery
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="tickets" role="tab">
          <span class="tab-num"><span class="num-text">5</span></span>
          Tickets
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="discounts" role="tab">
          <span class="tab-num"><span class="num-text">6</span></span>
          Discounts
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="show-cars" role="tab">
          <span class="tab-num"><span class="num-text">7</span></span>
          Show cars
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="car-clubs" role="tab">
          <span class="tab-num"><span class="num-text">8</span></span>
          Car clubs
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="traders" role="tab">
          <span class="tab-num"><span class="num-text">9</span></span>
          Traders
        </button>
        <button class="tab flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition" data-tab="publish" role="tab">
          <span class="tab-num"><span class="num-text">10</span></span>
          Publish
        </button>
      </div>
    </div>
  </nav>

  <!-- ============================================================
       MAIN CONTENT
       ============================================================ -->
  <main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16">

    <!-- ============================================================
         PANEL 1 · BASIC DETAILS
         ============================================================ -->
    <section class="panel is-active" data-panel="details" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 1 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Basic details</h2>
        <p class="text-ink-500">The essentials — what your event is called, what type of event it is, and where it takes place.</p>
      </header>

      <!-- Host callout -->
      <div class="flex items-center gap-3 p-4 bg-gold-50 border border-gold-200 rounded-xl mb-8">
        <div class="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center">
          <i class="fa-solid fa-mug-hot text-gold-600"></i>
        </div>
        <div>
          <p class="text-xs text-ink-500">Hosted by</p>
          <p class="font-semibold text-ink-900">Caffeine &amp; Machine: The Hill</p>
        </div>
      </div>

      <!-- Event title -->
      <div class="mb-8">
        <label for="f-title" class="block text-sm font-semibold text-ink-900 mb-2">
          Event title <span class="text-gold-600">*</span>
        </label>
        <input id="f-title" type="text" maxlength="60" class="input text-lg" value="Weekends in the Yard – Sunday Service @ The Hill" placeholder="e.g. Summer Supercar Meet 2026" />
        <div class="flex justify-between mt-2 text-xs text-ink-500">
          <span>Keep it clear and descriptive</span>
          <span><span id="title-count">51</span>/60</span>
        </div>
      </div>

      <!-- Categories -->
      <div class="mb-8">
        <div class="flex items-baseline justify-between mb-3">
          <label class="block text-sm font-semibold text-ink-900">Categories</label>
          <span class="text-xs text-ink-500">Select all that apply</span>
        </div>
        <div class="bg-white border border-ink-200 rounded-xl p-5 sm:p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
            <label class="cb-label"><input type="checkbox" value="51" /><span class="cb-box"></span><span class="cb-text">Drift Events</span></label>
            <label class="cb-label"><input type="checkbox" value="23" checked /><span class="cb-box"></span><span class="cb-text">American Car Shows &amp; Hotrods</span></label>
            <label class="cb-label"><input type="checkbox" value="52" /><span class="cb-box"></span><span class="cb-text">General Car Meets</span></label>
            <label class="cb-label"><input type="checkbox" value="48" /><span class="cb-box"></span><span class="cb-text">VAG Events</span></label>
            <label class="cb-label"><input type="checkbox" value="42" /><span class="cb-box"></span><span class="cb-text">Cars &amp; Coffee Events</span></label>
            <label class="cb-label"><input type="checkbox" value="47" /><span class="cb-box"></span><span class="cb-text">Air-Cooled Events</span></label>
            <label class="cb-label"><input type="checkbox" value="3" checked /><span class="cb-box"></span><span class="cb-text">Sports Car Shows &amp; Supercar Events</span></label>
            <label class="cb-label"><input type="checkbox" value="6" checked /><span class="cb-box"></span><span class="cb-text">Specialist Car Shows &amp; Model Specific</span></label>
            <label class="cb-label"><input type="checkbox" value="4" checked /><span class="cb-box"></span><span class="cb-text">Modded Car Shows &amp; JDM Car Events</span></label>
            <label class="cb-label"><input type="checkbox" value="19" /><span class="cb-box"></span><span class="cb-text">Race Events &amp; Shows</span></label>
            <label class="cb-label"><input type="checkbox" value="5" checked /><span class="cb-box"></span><span class="cb-text">Classic Car Shows &amp; Events</span></label>
            <label class="cb-label"><input type="checkbox" value="41" /><span class="cb-box"></span><span class="cb-text">Drag Racing &amp; Straightline Sports</span></label>
            <label class="cb-label"><input type="checkbox" value="46" checked /><span class="cb-box"></span><span class="cb-text">Venue Based Events</span></label>
            <label class="cb-label"><input type="checkbox" value="45" /><span class="cb-box"></span><span class="cb-text">4x4 Events</span></label>
            <label class="cb-label"><input type="checkbox" value="49" /><span class="cb-box"></span><span class="cb-text">Monster Truck Events</span></label>
            <label class="cb-label"><input type="checkbox" value="11" /><span class="cb-box"></span><span class="cb-text">Car Club Meets</span></label>
            <label class="cb-label"><input type="checkbox" value="40" checked /><span class="cb-box"></span><span class="cb-text">Electric Car Events &amp; EV Car Shows</span></label>
            <label class="cb-label"><input type="checkbox" value="21" /><span class="cb-box"></span><span class="cb-text">Autojumbles &amp; Car Swap Meets</span></label>
            <label class="cb-label"><input type="checkbox" value="7" /><span class="cb-box"></span><span class="cb-text">Car Rallies &amp; Driving Tours</span></label>
            <label class="cb-label"><input type="checkbox" value="8" /><span class="cb-box"></span><span class="cb-text">UK Track Days 2026</span></label>
            <label class="cb-label"><input type="checkbox" value="20" checked /><span class="cb-box"></span><span class="cb-text">Bike Events 2026</span></label>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="mb-8">
        <label for="f-location" class="block text-sm font-semibold text-ink-900 mb-2">
          Event location <span class="text-gold-600">*</span>
        </label>
        <div class="relative">
          <i class="fa-solid fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"></i>
          <input id="f-location" type="text" class="input pl-11" value="Caffeine &amp; Machine: The Hill, Ettington, Stratford-upon-Avon" placeholder="Search for a venue or address" />
        </div>
        <!-- Map preview -->
        <div class="mt-3 h-40 sm:h-48 rounded-xl overflow-hidden border border-ink-200 bg-ink-100 relative">
          <div class="absolute inset-0 flex items-center justify-center text-ink-400 text-sm">
            <div class="text-center">
              <i class="fa-solid fa-map-location-dot text-2xl mb-2 text-gold-500"></i>
              <p class="text-xs">Map preview</p>
              <p class="text-[11px]">52.1498, -1.6299</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop nav -->
      <div class="hidden sm:flex items-center justify-end gap-3 pt-6 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="dates">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 2 · DATES & TIMES
         ============================================================ -->
    <section class="panel" data-panel="dates" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 2 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Dates &amp; times</h2>
        <p class="text-ink-500">When will your event take place? Single day, multi-day, or a recurring series.</p>
      </header>

      <!-- Event type toggle -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-ink-900 mb-3">Event type</label>
        <div class="seg w-full sm:w-auto sm:inline-flex" role="group" aria-label="Event type">
          <button class="seg-btn is-active" data-date-type="single">
            <i class="fa-regular fa-calendar mr-2"></i>Single event
          </button>
          <button class="seg-btn" data-date-type="recurring">
            <i class="fa-solid fa-repeat mr-2"></i>Recurring event
          </button>
        </div>
      </div>

      <!-- Single event -->
      <div id="single-event-block">
        <div class="bg-white border border-ink-200 rounded-2xl p-5 sm:p-6 mb-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Starts</label>
              <button type="button" class="date-field mb-2" data-datefield data-value="2026-04-19">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">19 April 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="09:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Ends</label>
              <button type="button" class="date-field mb-2" data-datefield data-value="2026-04-19">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">19 April 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="22:00" />
            </div>
          </div>

          <div class="mt-5 pt-5 border-t border-ink-200 space-y-3">
            <label class="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Hide times on event page</p>
                <p class="text-xs text-ink-500">Only the date range will be shown</p>
              </div>
              <span class="switch">
                <input type="checkbox" />
                <span class="slider"></span>
              </span>
            </label>
            <label class="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Unique times per day</p>
                <p class="text-xs text-ink-500">Set different start/end times for each day</p>
              </div>
              <span class="switch">
                <input type="checkbox" />
                <span class="slider"></span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Recurring event (hidden by default) -->
      <div id="recurring-event-block" class="hidden">
        <div class="bg-white border border-ink-200 rounded-2xl p-5 sm:p-6 mb-4">
          <label class="block text-sm font-semibold text-ink-900 mb-3">Repeats</label>
          <div class="seg inline-flex mb-5" role="group">
            <button class="seg-btn is-active">Weekly</button>
            <button class="seg-btn">Monthly</button>
            <button class="seg-btn">Custom dates</button>
          </div>

          <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">On these days</label>
          <div class="flex flex-wrap gap-2 mb-5">
            <button class="chip">Mon</button>
            <button class="chip">Tue</button>
            <button class="chip">Wed</button>
            <button class="chip">Thu</button>
            <button class="chip">Fri</button>
            <button class="chip">Sat</button>
            <button class="chip is-active"><i class="fa-solid fa-check check"></i>Sun</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">First date</label>
              <button type="button" class="date-field" data-datefield data-value="2026-04-19">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">19 April 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Until</label>
              <button type="button" class="date-field" data-datefield data-value="2026-10-25">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">25 October 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Start time</label>
              <input type="time" class="input" value="09:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">End time</label>
              <input type="time" class="input" value="22:00" />
            </div>
          </div>
        </div>

        <div class="flex items-start gap-3 p-4 bg-gold-50 border border-gold-200 rounded-xl">
          <i class="fa-solid fa-circle-info text-gold-600 mt-0.5"></i>
          <div class="text-sm">
            <p class="font-semibold text-gold-900">Recurring event schedule</p>
            <p class="text-gold-800 mt-1">Your event will be duplicated and published for each date in the series when you hit publish.</p>
          </div>
        </div>
      </div>

      <!-- Timezone -->
      <div class="mt-6">
        <label for="f-timezone" class="block text-sm font-semibold text-ink-900 mb-2">Timezone</label>
        <div class="relative">
          <i class="fa-solid fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"></i>
          <select id="f-timezone" class="select pl-11">
            <option selected>Europe/London (GMT+1)</option>
            <option>Europe/Dublin</option>
            <option>Europe/Paris</option>
            <option>America/New_York</option>
            <option>America/Los_Angeles</option>
          </select>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="details">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="description">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 3 · DESCRIPTION
         ============================================================ -->
    <section class="panel" data-panel="description" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 3 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Describe your event</h2>
        <p class="text-ink-500">Sell the experience. Great events start with a great story.</p>
      </header>

      <!-- Cover image -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-ink-900 mb-2">Cover image</label>
        <p class="text-xs text-ink-500 mb-3">This is the first thing attendees see. Ideal size 1100 × 500px.</p>

        <div class="relative rounded-2xl overflow-hidden border border-ink-200 bg-ink-100 aspect-[11/5] group">
          <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <div class="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button class="px-3 py-2 text-xs font-semibold text-ink-900 bg-white/95 hover:bg-white rounded-lg transition">
              <i class="fa-solid fa-upload mr-1.5"></i>Replace
            </button>
            <button class="px-3 py-2 text-xs font-semibold text-white bg-red-500/90 hover:bg-red-600 rounded-lg transition">
              <i class="fa-solid fa-trash mr-1.5"></i>Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Description with AI -->
      <div class="mb-8">
        <div class="flex items-baseline justify-between mb-2">
          <label for="f-desc" class="block text-sm font-semibold text-ink-900">About this event</label>
          <button class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 border border-gold-200 rounded-lg transition">
            <span class="ai-sparkle">✨</span>
            Generate with AI
          </button>
        </div>

        <div class="rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition">
          <!-- Toolbar -->
          <div class="flex items-center gap-1 px-3 py-2 border-b border-ink-200 bg-ink-50">
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bold"><i class="fa-solid fa-bold text-xs"></i></button>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Italic"><i class="fa-solid fa-italic text-xs"></i></button>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Underline"><i class="fa-solid fa-underline text-xs"></i></button>
            <div class="w-px h-4 bg-ink-200 mx-1"></div>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bullet list"><i class="fa-solid fa-list-ul text-xs"></i></button>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Numbered list"><i class="fa-solid fa-list-ol text-xs"></i></button>
            <div class="w-px h-4 bg-ink-200 mx-1"></div>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Link"><i class="fa-solid fa-link text-xs"></i></button>
            <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Image"><i class="fa-regular fa-image text-xs"></i></button>
          </div>
          <textarea id="f-desc" rows="6" class="w-full px-4 py-4 text-ink-900 placeholder-ink-400 focus:outline-none resize-y" placeholder="Tell attendees what makes this event special…">Weekends in the Yard is where Caffeine&amp;Machine comes vibrantly, brilliantly alive. Roll in, switch off, hang out. A slow, easy blend of good coffee, good company, and great machines.

Remember: Don't Be A Dick. No matter your tribe or what you arrive in, you're always welcome.</textarea>
        </div>
      </div>

      <!-- Contact & Links -->
      <div class="mb-8">
        <h3 class="text-sm font-semibold text-ink-900 mb-1">Contact &amp; links</h3>
        <p class="text-xs text-ink-500 mb-4">Public contact info and social profiles for this event.</p>

        <div class="space-y-3">
          <div class="relative">
            <i class="fa-solid fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="url" class="input pl-11" placeholder="Website URL" value="https://caffeineandmachine.com/whats-on-the-hill/" />
          </div>
          <div class="relative">
            <i class="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="email" class="input pl-11" placeholder="Public email address" value="contact@caffeineandmachine.com" />
          </div>
          <div class="relative">
            <i class="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="tel" class="input pl-11" placeholder="Public phone number" />
          </div>
          <div class="relative">
            <i class="fa-brands fa-facebook-f absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="url" class="input pl-11" placeholder="Facebook page URL" value="https://www.facebook.com/caffeineandmachine/" />
          </div>
          <div class="relative">
            <i class="fa-brands fa-instagram absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="url" class="input pl-11" placeholder="Instagram profile URL" value="https://www.instagram.com/caffeineandmachine/" />
          </div>
          <div class="relative">
            <i class="fa-brands fa-tiktok absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 w-4 text-center"></i>
            <input type="url" class="input pl-11" placeholder="TikTok profile URL" />
          </div>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="dates">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="gallery">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 4 · GALLERY
         ============================================================ -->
    <section class="panel" data-panel="gallery" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 4 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Event gallery</h2>
        <p class="text-ink-500">Showcase previous years or the atmosphere. Drag to reorder, click to remove.</p>
      </header>

      <!-- Gallery grid -->
      <div class="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div class="gallery-tile border border-ink-200">
          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="tile-actions flex gap-1">
            <button class="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"><i class="fa-solid fa-grip-vertical"></i></button>
            <button class="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="gallery-tile border border-ink-200">
          <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="tile-actions flex gap-1">
            <button class="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"><i class="fa-solid fa-grip-vertical"></i></button>
            <button class="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="gallery-tile border border-ink-200">
          <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="tile-actions flex gap-1">
            <button class="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"><i class="fa-solid fa-grip-vertical"></i></button>
            <button class="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="gallery-tile border border-ink-200">
          <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="tile-actions flex gap-1">
            <button class="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"><i class="fa-solid fa-grip-vertical"></i></button>
            <button class="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="gallery-tile border border-ink-200">
          <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&auto=format&fit=crop&q=60" alt="" class="w-full h-full object-cover" />
          <div class="tile-actions flex gap-1">
            <button class="w-7 h-7 rounded-full bg-white/95 text-ink-900 flex items-center justify-center text-xs hover:bg-white transition"><i class="fa-solid fa-grip-vertical"></i></button>
            <button class="w-7 h-7 rounded-full bg-red-500/95 text-white flex items-center justify-center text-xs hover:bg-red-600 transition"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <!-- Add tile -->
        <button class="dropzone flex flex-col items-center justify-center text-center p-4 gap-2 aspect-square">
          <div class="w-10 h-10 rounded-full bg-white border border-ink-200 flex items-center justify-center text-gold-600">
            <i class="fa-solid fa-plus"></i>
          </div>
          <p class="text-xs font-medium text-ink-700">Add photos</p>
        </button>
      </div>

      <!-- Dropzone -->
      <label class="dropzone flex flex-col items-center justify-center text-center py-10 px-6 cursor-pointer">
        <div class="w-14 h-14 rounded-full bg-white border border-ink-200 flex items-center justify-center text-gold-600 mb-3">
          <i class="fa-solid fa-cloud-arrow-up text-lg"></i>
        </div>
        <p class="text-sm font-semibold text-ink-900 mb-1">Drop files here or click to upload</p>
        <p class="text-xs text-ink-500">JPG, PNG or GIF · Max 10MB each</p>
        <input type="file" multiple class="hidden" accept="image/*" />
      </label>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="description">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="tickets">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 5 · TICKETS & ENTRY
         ============================================================ -->
    <section class="panel" data-panel="tickets" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 5 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Tickets &amp; entry</h2>
        <p class="text-ink-500">Choose how attendees get in — sell via CarEvents.com, link to an external site, or run a free event.</p>
      </header>

      <!-- Ticket source -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <label class="relative cursor-pointer">
          <input type="radio" name="ticket_source" value="ce" class="sr-only peer" checked />
          <div class="p-4 bg-white border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-xl transition h-full">
            <div class="flex items-center justify-between mb-2">
              <i class="fa-solid fa-ticket text-gold-600"></i>
              <i class="fa-solid fa-circle-check text-gold-500 opacity-0 peer-checked-visible transition"></i>
            </div>
            <p class="font-semibold text-sm text-ink-900">CarEvents Ticketing</p>
            <p class="text-xs text-ink-500 mt-1">Sell tickets through us — fully integrated.</p>
          </div>
        </label>
        <label class="relative cursor-pointer">
          <input type="radio" name="ticket_source" value="external" class="sr-only peer" />
          <div class="p-4 bg-white border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-xl transition h-full">
            <div class="flex items-center justify-between mb-2">
              <i class="fa-solid fa-arrow-up-right-from-square text-gold-600"></i>
            </div>
            <p class="font-semibold text-sm text-ink-900">External website</p>
            <p class="text-xs text-ink-500 mt-1">Send people to your existing ticket site.</p>
          </div>
        </label>
        <label class="relative cursor-pointer">
          <input type="radio" name="ticket_source" value="none" class="sr-only peer" />
          <div class="p-4 bg-white border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-xl transition h-full">
            <div class="flex items-center justify-between mb-2">
              <i class="fa-solid fa-door-open text-gold-600"></i>
            </div>
            <p class="font-semibold text-sm text-ink-900">Not required</p>
            <p class="text-xs text-ink-500 mt-1">Free event, no booking needed.</p>
          </div>
        </label>
      </div>

      <!-- Tickets list -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-ink-900">Your tickets</h3>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition" onclick="document.getElementById('ticket-drawer').classList.remove('hidden')">
            <i class="fa-solid fa-plus"></i> Add ticket
          </button>
        </div>

        <div class="space-y-3" id="tickets-list">
          <!-- Ticket row -->
          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing" aria-label="Drag to reorder">
              <i class="fa-solid fa-grip-vertical"></i>
            </button>
            <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-ticket text-gold-600 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-ink-900 truncate">Early Bird General Admission</p>
              <p class="text-xs text-ink-500">100 available · Sales end 15 Apr</p>
            </div>
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-ink-900">£12.50</p>
              <p class="text-xs text-ink-500">+ fees</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition" aria-label="Edit"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>

          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
            <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-ticket text-gold-600 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-ink-900 truncate">Standard General Admission</p>
              <p class="text-xs text-ink-500">250 available · On sale now</p>
            </div>
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-ink-900">£15.00</p>
              <p class="text-xs text-ink-500">+ fees</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>

          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
            <div class="w-10 h-10 rounded-lg bg-ink-900 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-car text-gold-500 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-ink-900 truncate">Show Car Entry</p>
                <span class="text-[10px] uppercase tracking-wider font-semibold bg-ink-900 text-gold-400 px-2 py-0.5 rounded">Show</span>
              </div>
              <p class="text-xs text-ink-500">50 available · Requires car details</p>
            </div>
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-ink-900">£25.00</p>
              <p class="text-xs text-ink-500">+ fees</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>
        </div>

        <!-- Add ticket CTA card -->
        <button class="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2" onclick="document.getElementById('ticket-drawer').classList.remove('hidden')">
          <i class="fa-solid fa-plus"></i> Add another ticket
        </button>
      </div>

      <!-- Fee handling -->
      <div class="bg-white border border-ink-200 rounded-xl p-4 mb-4">
        <label class="block text-sm font-semibold text-ink-900 mb-2">Ticket fees</label>
        <p class="text-xs text-ink-500 mb-3">Who covers the booking fee?</p>
        <div class="seg w-full">
          <button class="seg-btn is-active">Pass to buyer</button>
          <button class="seg-btn">I'll absorb them</button>
        </div>
      </div>

      <!-- Show attendees -->
      <label class="flex items-center justify-between gap-3 p-4 bg-white border border-ink-200 rounded-xl cursor-pointer">
        <div>
          <p class="text-sm font-medium text-ink-900">Show attendees on the event page</p>
          <p class="text-xs text-ink-500">Public list of people who've booked</p>
        </div>
        <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
      </label>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="gallery">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="discounts">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 6 · DISCOUNTS & UPSELLS
         ============================================================ -->
    <section class="panel" data-panel="discounts" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 6 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Discounts &amp; upsells</h2>
        <p class="text-ink-500">Create promo codes and early-bird offers. Drag to reorder how they appear at checkout.</p>
      </header>

      <!-- Discount list -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-semibold text-ink-900">Promo codes</h3>
            <p class="text-xs text-ink-500 mt-0.5">Customers enter these at checkout to unlock the discount</p>
          </div>
          <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition" onclick="document.getElementById('discount-drawer').classList.remove('hidden')">
            <i class="fa-solid fa-plus"></i> Add code
          </button>
        </div>

        <div class="space-y-3">
          <!-- Discount card -->
          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing" aria-label="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
            <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-tag text-gold-600 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-ink-900 truncate font-mono tracking-wide">EARLYBIRD15</p>
                <span class="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">15% off</span>
              </div>
              <p class="text-xs text-ink-500">Used 24 / 100 · Expires 15 Apr 2026</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition" aria-label="Edit"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>

          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
            <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-tag text-gold-600 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-ink-900 truncate font-mono tracking-wide">CLUB5</p>
                <span class="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">£5 off</span>
              </div>
              <p class="text-xs text-ink-500">Used 8 / Unlimited · Club members only</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>

          <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3 opacity-60">
            <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
            <div class="w-10 h-10 rounded-lg bg-ink-100 border border-ink-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-tag text-ink-400 text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-ink-900 truncate font-mono tracking-wide">PRESS2026</p>
                <span class="text-[10px] uppercase tracking-wider font-semibold bg-ink-100 text-ink-500 border border-ink-200 px-1.5 py-0.5 rounded">Expired</span>
              </div>
              <p class="text-xs text-ink-500">Used 12 / 20 · Ended 12 Mar 2026</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
              <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>
        </div>

        <button class="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2" onclick="document.getElementById('discount-drawer').classList.remove('hidden')">
          <i class="fa-solid fa-plus"></i> Add another discount code
        </button>
      </div>

      <!-- Quick stats -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-white border border-ink-200 rounded-xl p-4">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1">Active codes</p>
          <p class="text-2xl font-display text-ink-900">2</p>
        </div>
        <div class="bg-white border border-ink-200 rounded-xl p-4">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1">Total uses</p>
          <p class="text-2xl font-display text-ink-900">44</p>
        </div>
        <div class="bg-white border border-ink-200 rounded-xl p-4">
          <p class="text-[11px] uppercase tracking-wider font-semibold text-ink-500 mb-1">Discount given</p>
          <p class="text-2xl font-display text-gold-600">£312</p>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="tickets">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="show-cars">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 6 · SHOW CARS
         ============================================================ -->
    <section class="panel" data-panel="show-cars" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 7 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Show cars</h2>
        <p class="text-ink-500">Let applicants apply to display their vehicle. Set application windows, categories and requirements.</p>
      </header>

      <!-- Enable toggle -->
      <label class="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p class="text-sm font-semibold text-ink-900">Enable show car applications</p>
          <p class="text-xs text-ink-500 mt-0.5">Accept applications from car owners wanting to display their vehicle</p>
        </div>
        <span class="switch">
          <input type="checkbox" id="toggle-show-cars" checked />
          <span class="slider"></span>
        </span>
      </label>

      <div id="show-cars-content">
        <!-- Limit show cars -->
        <div class="bg-white border border-ink-200 rounded-xl p-5 mb-4">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-ink-900">Limit total show cars</p>
              <p class="text-xs text-ink-500 mt-0.5">Cap the number of accepted applications</p>
            </div>
            <span class="switch">
              <input type="checkbox" id="toggle-show-cars-limit" checked />
              <span class="slider"></span>
            </span>
          </label>
          <div id="show-cars-limit-input" class="mt-4 pt-4 border-t border-ink-200">
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Maximum show cars</label>
            <input type="number" min="1" step="1" class="input" placeholder="e.g. 50" value="50" />
          </div>
        </div>

        <!-- Show car categories -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-ink-900">Show car categories</h3>
              <p class="text-xs text-ink-500 mt-0.5">Group applications by type — each category has its own application window</p>
            </div>
            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition" onclick="document.getElementById('show-car-cat-drawer').classList.remove('hidden')">
              <i class="fa-solid fa-plus"></i> Add category
            </button>
          </div>

          <div class="space-y-3">
            <!-- Category card -->
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-trophy text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-ink-900 truncate">Concours — Classic &amp; Heritage</p>
                  <span class="text-[10px] uppercase tracking-wider font-semibold bg-gold-50 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded">£25 ticket</span>
                </div>
                <p class="text-xs text-ink-500">Applications 01 Feb – 01 Apr</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition" aria-label="Edit"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-trophy text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-ink-900 truncate">Modified &amp; Tuner</p>
                  <span class="text-[10px] uppercase tracking-wider font-semibold bg-gold-50 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded">£15 ticket</span>
                </div>
                <p class="text-xs text-ink-500">Applications 15 Feb – 10 Apr</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-trophy text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-ink-900 truncate">Supercar &amp; Exotic</p>
                  <span class="text-[10px] uppercase tracking-wider font-semibold bg-ink-100 text-ink-500 border border-ink-200 px-1.5 py-0.5 rounded">No ticket required</span>
                </div>
                <p class="text-xs text-ink-500">Applications 01 Mar – 15 Apr</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
          </div>

          <button class="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2" onclick="document.getElementById('show-car-cat-drawer').classList.remove('hidden')">
            <i class="fa-solid fa-plus"></i> Add another category
          </button>
        </div>

        <!-- Show car information WYSIWYG -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-ink-900 mb-2">Show car information</label>
          <p class="text-xs text-ink-500 mb-3">Perks, arrival times, parking instructions — anything applicants need to know.</p>

          <div class="rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition">
            <div class="flex items-center gap-1 px-3 py-2 border-b border-ink-200 bg-ink-50">
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bold"><i class="fa-solid fa-bold text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Italic"><i class="fa-solid fa-italic text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Underline"><i class="fa-solid fa-underline text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bullet list"><i class="fa-solid fa-list-ul text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Numbered list"><i class="fa-solid fa-list-ol text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Link"><i class="fa-solid fa-link text-xs"></i></button>
            </div>
            <textarea rows="5" class="w-full px-4 py-4 text-ink-900 placeholder-ink-400 focus:outline-none resize-y" placeholder="Arrival from 8am. Dedicated show parking on the main lawn. Complimentary breakfast rolls for drivers. Judging from 11am…"></textarea>
          </div>
        </div>

        <!-- Application links -->
        <div class="app-links-card mb-4">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-link text-gold-600"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-ink-900">Application links</h3>
              <p class="text-xs text-ink-500 mt-0.5">Share directly or embed on your own website.</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Direct URL</label>
              <div class="link-row">
                <span class="link-icon"><i class="fa-solid fa-globe text-xs"></i></span>
                <input type="text" readonly value="https://www.carevents.com/apply/show-cars/weekends-in-the-yard-hill" />
                <button class="copy-btn" data-copy data-copy-type="url">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Embed code</label>
              <div class="embed-block">
                <button class="copy-btn" data-copy data-copy-type="embed">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
                <pre>&lt;iframe
  src="https://www.carevents.com/embed/show-cars/weekends-in-the-yard-hill"
  width="100%"
  height="800"
  frameborder="0"
  allow="payment"
  title="Show car applications"&gt;&lt;/iframe&gt;</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="discounts">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="car-clubs">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 7 · CAR CLUBS
         ============================================================ -->
    <section class="panel" data-panel="car-clubs" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 8 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Car clubs</h2>
        <p class="text-ink-500">Invite clubs to apply for a dedicated stand or group booking at your event.</p>
      </header>

      <!-- Enable toggle -->
      <label class="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p class="text-sm font-semibold text-ink-900">Enable car club applications</p>
          <p class="text-xs text-ink-500 mt-0.5">Accept applications from clubs wanting a group presence</p>
        </div>
        <span class="switch">
          <input type="checkbox" id="toggle-car-clubs" checked />
          <span class="slider"></span>
        </span>
      </label>

      <div id="car-clubs-content">
        <!-- Application dates -->
        <div class="bg-white border border-ink-200 rounded-xl p-5 sm:p-6 mb-4">
          <label class="block text-sm font-semibold text-ink-900 mb-3">Application window</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Applications open</label>
              <button type="button" class="date-field mb-2" data-datefield data-value="2026-02-01">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">1 February 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="09:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Applications close</label>
              <button type="button" class="date-field mb-2" data-datefield data-value="2026-04-01">
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">1 April 2026</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="23:59" />
            </div>
          </div>
        </div>

        <!-- Max club cars -->
        <div class="bg-white border border-ink-200 rounded-xl p-5 mb-4">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-ink-900">Limit total club vehicles</p>
              <p class="text-xs text-ink-500 mt-0.5">Cap the number of cars across all accepted clubs</p>
            </div>
            <span class="switch">
              <input type="checkbox" id="toggle-car-clubs-limit" checked />
              <span class="slider"></span>
            </span>
          </label>
          <div id="car-clubs-limit-input" class="mt-4 pt-4 border-t border-ink-200">
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Maximum club vehicles</label>
            <input type="number" min="1" step="1" class="input" placeholder="e.g. 100" value="100" />
          </div>
        </div>

        <!-- Require ticket after acceptance -->
        <div class="bg-white border border-ink-200 rounded-xl p-5 mb-4">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-ink-900">Require ticket purchase after acceptance</p>
              <p class="text-xs text-ink-500 mt-0.5">Accepted club vehicles will need to buy a ticket to secure their spot</p>
            </div>
            <span class="switch">
              <input type="checkbox" id="toggle-car-clubs-ticket" />
              <span class="slider"></span>
            </span>
          </label>
          <div id="car-clubs-ticket-cost" class="hidden mt-4 pt-4 border-t border-ink-200">
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Club vehicle ticket cost (£)</label>
            <input type="number" step="0.01" min="0" class="input" placeholder="0.00" />
          </div>
        </div>

        <!-- Car club information WYSIWYG -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-ink-900 mb-2">Car club information</label>
          <p class="text-xs text-ink-500 mb-3">Stand sizes, perks, arrival times, group discount codes — anything club organisers need.</p>

          <div class="rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition">
            <div class="flex items-center gap-1 px-3 py-2 border-b border-ink-200 bg-ink-50">
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bold"><i class="fa-solid fa-bold text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Italic"><i class="fa-solid fa-italic text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Underline"><i class="fa-solid fa-underline text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bullet list"><i class="fa-solid fa-list-ul text-xs"></i></button>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Numbered list"><i class="fa-solid fa-list-ol text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Link"><i class="fa-solid fa-link text-xs"></i></button>
            </div>
            <textarea rows="5" class="w-full px-4 py-4 text-ink-900 placeholder-ink-400 focus:outline-none resize-y" placeholder="Clubs can book a dedicated stand for groups of 10+. Arrival from 7:30am for club stands. Minimum of 6 cars required…"></textarea>
          </div>
        </div>

        <!-- Application links -->
        <div class="app-links-card mb-4">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-link text-gold-600"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-ink-900">Application links</h3>
              <p class="text-xs text-ink-500 mt-0.5">Share directly or embed on your own website.</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Direct URL</label>
              <div class="link-row">
                <span class="link-icon"><i class="fa-solid fa-globe text-xs"></i></span>
                <input type="text" readonly value="https://www.carevents.com/apply/car-clubs/weekends-in-the-yard-hill" />
                <button class="copy-btn" data-copy data-copy-type="url">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Embed code</label>
              <div class="embed-block">
                <button class="copy-btn" data-copy data-copy-type="embed">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
                <pre>&lt;iframe
  src="https://www.carevents.com/embed/car-clubs/weekends-in-the-yard-hill"
  width="100%"
  height="800"
  frameborder="0"
  allow="payment"
  title="Car club applications"&gt;&lt;/iframe&gt;</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="show-cars">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="traders">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 9 · TRADERS
         ============================================================ -->
    <section class="panel" data-panel="traders" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 9 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Traders</h2>
        <p class="text-ink-500">Invite vendors, exhibitors and sponsors to apply for a trade stand at your event.</p>
      </header>

      <!-- Enable toggle -->
      <label class="flex items-center justify-between gap-3 p-5 bg-white border border-ink-200 rounded-xl cursor-pointer mb-6">
        <div>
          <p class="text-sm font-semibold text-ink-900">Enable trader applications</p>
          <p class="text-xs text-ink-500 mt-0.5">Accept applications from food vans, merchandise stalls, sponsors and exhibitors</p>
        </div>
        <span class="switch">
          <input type="checkbox" id="toggle-traders" checked />
          <span class="slider"></span>
        </span>
      </label>

      <div id="traders-content">
        <!-- Trader categories -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-sm font-semibold text-ink-900">Trader types</h3>
              <p class="text-xs text-ink-500 mt-0.5">Group traders by type — each category has its own application window &amp; info</p>
            </div>
            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gold-700 hover:text-gold-900 transition" onclick="document.getElementById('trader-cat-drawer').classList.remove('hidden')">
              <i class="fa-solid fa-plus"></i> Add type
            </button>
          </div>

          <div class="space-y-3">
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-utensils text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">Food &amp; Drink</p>
                <p class="text-xs text-ink-500">Applications 15 Jan – 01 Mar</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-shirt text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">Merchandise &amp; Apparel</p>
                <p class="text-xs text-ink-500">Applications 01 Feb – 15 Mar</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-wrench text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">Parts, Tools &amp; Detailing</p>
                <p class="text-xs text-ink-500">Applications 01 Feb – 15 Mar</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <div class="ticket-card bg-white border border-ink-200 rounded-xl p-4 flex items-center gap-3">
              <button class="text-ink-300 hover:text-ink-500 transition cursor-grab active:cursor-grabbing"><i class="fa-solid fa-grip-vertical"></i></button>
              <div class="w-10 h-10 rounded-lg bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-handshake text-gold-600 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-900 truncate">Sponsors &amp; Exhibitors</p>
                <p class="text-xs text-ink-500">Applications 15 Jan – 01 Apr</p>
              </div>
              <div class="flex items-center gap-1">
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button class="w-8 h-8 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"><i class="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
          </div>

          <button class="w-full mt-3 py-4 border-2 border-dashed border-ink-200 hover:border-gold-500 hover:bg-gold-50 rounded-xl text-ink-500 hover:text-gold-700 font-medium text-sm transition flex items-center justify-center gap-2" onclick="document.getElementById('trader-cat-drawer').classList.remove('hidden')">
            <i class="fa-solid fa-plus"></i> Add another trader type
          </button>
        </div>

        <!-- Application links -->
        <div class="app-links-card mb-4">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-white border border-gold-200 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-link text-gold-600"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-ink-900">Application links</h3>
              <p class="text-xs text-ink-500 mt-0.5">Share directly or embed on your own website.</p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Direct URL</label>
              <div class="link-row">
                <span class="link-icon"><i class="fa-solid fa-globe text-xs"></i></span>
                <input type="text" readonly value="https://www.carevents.com/apply/traders/weekends-in-the-yard-hill" />
                <button class="copy-btn" data-copy data-copy-type="url">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Embed code</label>
              <div class="embed-block">
                <button class="copy-btn" data-copy data-copy-type="embed">
                  <i class="fa-regular fa-copy"></i> Copy
                </button>
                <pre>&lt;iframe
  src="https://www.carevents.com/embed/traders/weekends-in-the-yard-hill"
  width="100%"
  height="800"
  frameborder="0"
  allow="payment"
  title="Trader applications"&gt;&lt;/iframe&gt;</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:flex items-center justify-between gap-3 pt-6 mt-8 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="car-clubs">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
        <button class="px-5 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition inline-flex items-center gap-2" data-next="publish">
          Continue <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
    </section>

    <!-- ============================================================
         PANEL 8 · PUBLISH
         ============================================================ -->
    <section class="panel" data-panel="publish" role="tabpanel">
      <header class="mb-8">
        <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-2">Step 10 of 10</p>
        <h2 class="font-display text-3xl sm:text-4xl text-ink-900 mb-2">Ready to go live?</h2>
        <p class="text-ink-500">Review the basics and push your event out to the world.</p>
      </header>

      <!-- Status -->
      <div class="bg-white border border-ink-200 rounded-xl p-5 mb-4">
        <label class="block text-sm font-semibold text-ink-900 mb-3">Event status</label>
        <div class="grid grid-cols-3 gap-2">
          <label class="relative cursor-pointer">
            <input type="radio" name="event_status" value="draft" class="sr-only peer" />
            <div class="text-center p-3 border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-lg transition">
              <i class="fa-regular fa-file-lines text-ink-500 text-lg mb-1"></i>
              <p class="text-sm font-semibold">Draft</p>
            </div>
          </label>
          <label class="relative cursor-pointer">
            <input type="radio" name="event_status" value="published" class="sr-only peer" checked />
            <div class="text-center p-3 border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-lg transition">
              <i class="fa-solid fa-rocket text-gold-600 text-lg mb-1"></i>
              <p class="text-sm font-semibold">Publish now</p>
            </div>
          </label>
          <label class="relative cursor-pointer">
            <input type="radio" name="event_status" value="scheduled" class="sr-only peer" />
            <div class="text-center p-3 border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-lg transition">
              <i class="fa-regular fa-clock text-ink-500 text-lg mb-1"></i>
              <p class="text-sm font-semibold">Schedule</p>
            </div>
          </label>
        </div>

        <!-- Scheduled date fields (hidden by default) -->
        <div id="schedule-fields" class="hidden mt-4 pt-4 border-t border-ink-200">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Go live on</label>
              <button type="button" class="date-field is-empty" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">At</label>
              <input type="time" class="input" value="09:00" />
            </div>
          </div>
        </div>
      </div>

      <!-- Visibility -->
      <div class="bg-white border border-ink-200 rounded-xl p-5 mb-4">
        <label class="block text-sm font-semibold text-ink-900 mb-3">Visibility</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="relative cursor-pointer">
            <input type="radio" name="visibility" class="sr-only peer" checked />
            <div class="flex items-center gap-3 p-3 border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-lg transition">
              <i class="fa-solid fa-globe text-gold-600"></i>
              <div class="text-left">
                <p class="text-sm font-semibold">Public</p>
                <p class="text-xs text-ink-500">Listed everywhere</p>
              </div>
            </div>
          </label>
          <label class="relative cursor-pointer">
            <input type="radio" name="visibility" class="sr-only peer" />
            <div class="flex items-center gap-3 p-3 border-2 border-ink-200 peer-checked:border-gold-500 peer-checked:bg-gold-50 rounded-lg transition">
              <i class="fa-solid fa-lock text-ink-500"></i>
              <div class="text-left">
                <p class="text-sm font-semibold">Private</p>
                <p class="text-xs text-ink-500">Link-only access</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Summary card -->
      <div class="bg-ink-900 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-500/20 blur-3xl"></div>
        <div class="relative">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
              <i class="fa-solid fa-check text-white"></i>
            </div>
            <div>
              <p class="font-display text-lg">Your event is ready</p>
              <p class="text-xs text-ink-300">All required details complete</p>
            </div>
          </div>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
            <div>
              <dt class="text-xs text-ink-400 mb-1">Event</dt>
              <dd class="font-medium truncate">Weekends in the Yard</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-400 mb-1">Date</dt>
              <dd class="font-medium">19 Apr 2026, 09:00</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-400 mb-1">Tickets</dt>
              <dd class="font-medium">3 types, from £12.50</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-400 mb-1">Categories</dt>
              <dd class="font-medium">8 selected</dd>
            </div>
          </dl>
          <div class="p-3 bg-white/10 border border-white/10 rounded-lg flex items-center gap-2">
            <i class="fa-solid fa-link text-gold-400 text-xs"></i>
            <span class="text-xs font-mono text-ink-200 truncate">carevents.com/weekends-in-the-yard-hill</span>
            <button class="ml-auto text-xs text-gold-400 hover:text-gold-300 transition font-semibold">Copy</button>
          </div>
        </div>
      </div>

      <!-- Publish button -->
      <button class="w-full py-4 text-base font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-xl transition shadow-sm inline-flex items-center justify-center gap-2">
        <i class="fa-solid fa-rocket"></i>
        Publish event
      </button>

      <div class="hidden sm:flex items-center justify-start gap-3 pt-6 mt-6 border-t border-ink-200">
        <button class="px-5 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition inline-flex items-center gap-2" data-next="traders">
          <i class="fa-solid fa-arrow-left text-xs"></i> Back
        </button>
      </div>
    </section>

  </main>
    </div> <!-- /right-column -->
  </div> <!-- /layout-wrapper -->

  <!-- ============================================================
       MOBILE STICKY BOTTOM BAR
       Flutter: Scaffold.bottomNavigationBar with two buttons
       ============================================================ -->
  <div class="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-200 px-4 py-3 flex items-center gap-2" style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));">
    <button id="mob-back" class="flex-1 px-4 py-3 text-sm font-semibold text-ink-700 bg-ink-100 rounded-lg inline-flex items-center justify-center gap-2">
      <i class="fa-solid fa-arrow-left text-xs"></i> Back
    </button>
    <button id="mob-next" class="flex-[2] px-4 py-3 text-sm font-semibold text-white bg-gold-500 rounded-lg inline-flex items-center justify-center gap-2">
      Continue <i class="fa-solid fa-arrow-right text-xs"></i>
    </button>
  </div>

  <!-- ============================================================
       TICKET DRAWER / MODAL
       Flutter: showModalBottomSheet on mobile, Dialog on desktop
       ============================================================ -->
  <div id="ticket-drawer" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-ink-900/50" onclick="document.getElementById('ticket-drawer').classList.add('hidden')"></div>
    <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Handle (mobile) -->
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-ink-200"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between p-5 sm:p-6 border-b border-ink-200">
        <div>
          <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">Ticket</p>
          <h3 class="font-display text-xl text-ink-900">Add ticket</h3>
        </div>
        <button class="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition" onclick="document.getElementById('ticket-drawer').classList.add('hidden')">
          <i class="fa-solid fa-xmark text-ink-700"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Ticket name <span class="text-gold-600">*</span></label>
          <input type="text" class="input" placeholder="e.g. Early Bird Entry" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Additional information</label>
          <textarea rows="2" class="input" placeholder="What's included? Any special terms?"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Quantity</label>
            <input type="number" class="input" placeholder="100" />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Price (£)</label>
            <input type="number" step="0.01" class="input" placeholder="0.00" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">On sale from</label>
            <button type="button" class="date-field is-empty" data-datefield>
              <i class="fa-regular fa-calendar df-icon"></i>
              <span class="df-display">Select date</span>
              <i class="fa-solid fa-chevron-down df-chev"></i>
            </button>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">On sale until</label>
            <button type="button" class="date-field is-empty" data-datefield>
              <i class="fa-regular fa-calendar df-icon"></i>
              <span class="df-display">Select date</span>
              <i class="fa-solid fa-chevron-down df-chev"></i>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Limit per order</label>
          <input type="number" class="input" placeholder="e.g. 4" />
        </div>

        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-3">Extra requirements</p>
          <div class="space-y-2">
            <label class="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Require car details</p>
                <p class="text-xs text-ink-500">Make, model &amp; registration</p>
              </div>
              <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
            </label>
            <label class="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Require car club name</p>
              </div>
              <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
            </label>
            <label class="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Individual attendee details</p>
                <p class="text-xs text-ink-500">Collect info per ticketholder</p>
              </div>
              <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
            </label>
            <label class="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Request vehicle photo</p>
              </div>
              <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
            </label>
            <label class="flex items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg cursor-pointer">
              <div>
                <p class="text-sm font-medium text-ink-900">Secret ticket</p>
                <p class="text-xs text-ink-500">Only accessible via code</p>
              </div>
              <span class="switch"><input type="checkbox" /><span class="slider"></span></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center gap-2 p-5 sm:p-6 border-t border-ink-200 bg-ink-50">
        <button class="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition" onclick="document.getElementById('ticket-drawer').classList.add('hidden')">Cancel</button>
        <button class="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition">Save ticket</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       SHOW CAR CATEGORY DRAWER
       ============================================================ -->
  <div id="show-car-cat-drawer" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-ink-900/50" onclick="document.getElementById('show-car-cat-drawer').classList.add('hidden')"></div>
    <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-ink-200"></div>
      </div>
      <div class="flex items-center justify-between p-5 sm:p-6 border-b border-ink-200">
        <div>
          <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">Show cars</p>
          <h3 class="font-display text-xl text-ink-900">Add category</h3>
        </div>
        <button class="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition" onclick="document.getElementById('show-car-cat-drawer').classList.add('hidden')">
          <i class="fa-solid fa-xmark text-ink-700"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Category name <span class="text-gold-600">*</span></label>
          <input type="text" class="input" placeholder="e.g. Concours — Classic &amp; Heritage" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Description</label>
          <textarea rows="2" class="input" placeholder="What kind of cars fit in this category?"></textarea>
        </div>

        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-3">Application window</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Opens</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="09:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Closes</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="23:59" />
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-ink-200">
          <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Spaces available</label>
          <input type="number" min="1" step="1" class="input" placeholder="e.g. 20" />
        </div>

        <div class="pt-3 border-t border-ink-200">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p class="text-sm font-semibold text-ink-900">Require ticket purchase after acceptance</p>
              <p class="text-xs text-ink-500 mt-0.5">Accepted applicants in this category will need a ticket to secure their spot</p>
            </div>
            <span class="switch">
              <input type="checkbox" id="toggle-cat-ticket" checked />
              <span class="slider"></span>
            </span>
          </label>
          <div id="cat-ticket-cost" class="mt-4">
            <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Ticket cost (£)</label>
            <input type="number" step="0.01" min="0" class="input" placeholder="0.00" />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 p-5 sm:p-6 border-t border-ink-200 bg-ink-50">
        <button class="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition" onclick="document.getElementById('show-car-cat-drawer').classList.add('hidden')">Cancel</button>
        <button class="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition">Save category</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       DISCOUNT CODE DRAWER
       ============================================================ -->
  <div id="discount-drawer" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-ink-900/50" onclick="document.getElementById('discount-drawer').classList.add('hidden')"></div>
    <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-ink-200"></div>
      </div>
      <div class="flex items-center justify-between p-5 sm:p-6 border-b border-ink-200">
        <div>
          <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">Discount</p>
          <h3 class="font-display text-xl text-ink-900">Add discount code</h3>
        </div>
        <button class="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition" onclick="document.getElementById('discount-drawer').classList.add('hidden')">
          <i class="fa-solid fa-xmark text-ink-700"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Discount code <span class="text-gold-600">*</span></label>
          <input type="text" class="input font-mono uppercase tracking-wide" placeholder="EARLYBIRD15" />
          <p class="text-xs text-ink-500 mt-2">Customers enter this at checkout. Letters and numbers only, no spaces.</p>
        </div>

        <!-- Discount type segmented -->
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Discount type <span class="text-gold-600">*</span></label>
          <div class="seg w-full" role="group" id="discount-type-seg">
            <button class="seg-btn is-active" data-discount-type="percentage">
              <i class="fa-solid fa-percent mr-2"></i>Percentage
            </button>
            <button class="seg-btn" data-discount-type="fixed">
              <i class="fa-solid fa-sterling-sign mr-2"></i>Fixed amount
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Amount <span class="text-gold-600">*</span></label>
          <div class="relative">
            <span id="discount-amount-prefix" class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold hidden">£</span>
            <span id="discount-amount-suffix" class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">%</span>
            <input type="number" step="0.01" min="0" class="input" placeholder="15" />
          </div>
        </div>

        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-3">Usage limits</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Total uses</label>
              <input type="number" min="1" step="1" class="input" placeholder="e.g. 100" />
              <p class="text-xs text-ink-500 mt-1.5">Leave blank for unlimited</p>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Per customer</label>
              <input type="number" min="1" step="1" class="input" placeholder="e.g. 1" />
              <p class="text-xs text-ink-500 mt-1.5">Max uses per buyer</p>
            </div>
          </div>
        </div>

        <!-- Applicable tickets -->
        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-1">Applicable tickets</p>
          <p class="text-xs text-ink-500 mb-3">Which tickets can this code be used with?</p>
          <div class="bg-ink-50 border border-ink-200 rounded-lg p-4 space-y-0">
            <label class="cb-label !py-2">
              <input type="checkbox" id="discount-all-tickets" checked />
              <span class="cb-box"></span>
              <span class="cb-text font-semibold">Select all tickets</span>
            </label>
            <div class="h-px bg-ink-200 my-2"></div>
            <label class="cb-label !py-2">
              <input type="checkbox" class="discount-ticket" checked />
              <span class="cb-box"></span>
              <span class="cb-text">Early Bird General Admission <span class="text-ink-400">· £12.50</span></span>
            </label>
            <label class="cb-label !py-2">
              <input type="checkbox" class="discount-ticket" checked />
              <span class="cb-box"></span>
              <span class="cb-text">Standard General Admission <span class="text-ink-400">· £15.00</span></span>
            </label>
            <label class="cb-label !py-2">
              <input type="checkbox" class="discount-ticket" checked />
              <span class="cb-box"></span>
              <span class="cb-text">Show Car Entry <span class="text-ink-400">· £25.00</span></span>
            </label>
          </div>
        </div>

        <!-- Availability window -->
        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-3">Availability window</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Available from</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="00:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Available until</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="23:59" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 p-5 sm:p-6 border-t border-ink-200 bg-ink-50">
        <button class="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition" onclick="document.getElementById('discount-drawer').classList.add('hidden')">Cancel</button>
        <button class="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition">Save discount</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       TRADER CATEGORY DRAWER
       ============================================================ -->
  <div id="trader-cat-drawer" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
    <div class="absolute inset-0 bg-ink-900/50" onclick="document.getElementById('trader-cat-drawer').classList.add('hidden')"></div>
    <div class="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-10 h-1 rounded-full bg-ink-200"></div>
      </div>
      <div class="flex items-center justify-between p-5 sm:p-6 border-b border-ink-200">
        <div>
          <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">Traders</p>
          <h3 class="font-display text-xl text-ink-900">Add trader type</h3>
        </div>
        <button class="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition" onclick="document.getElementById('trader-cat-drawer').classList.add('hidden')">
          <i class="fa-solid fa-xmark text-ink-700"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Category name <span class="text-gold-600">*</span></label>
          <input type="text" class="input" placeholder="e.g. Food &amp; Drink" />
        </div>

        <div class="pt-3 border-t border-ink-200">
          <p class="text-sm font-semibold text-ink-900 mb-3">Application window</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Opens</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="09:00" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-semibold text-ink-500 mb-2">Closes</label>
              <button type="button" class="date-field is-empty mb-2" data-datefield>
                <i class="fa-regular fa-calendar df-icon"></i>
                <span class="df-display">Select date</span>
                <i class="fa-solid fa-chevron-down df-chev"></i>
              </button>
              <input type="time" class="input" value="23:59" />
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-ink-200">
          <label class="block text-sm font-semibold text-ink-900 mb-2">Trader information</label>
          <p class="text-xs text-ink-500 mb-3">Perks, arrival times, pitch sizes, power availability — what traders need to know.</p>
          <div class="rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition">
            <div class="flex items-center gap-1 px-3 py-2 border-b border-ink-200 bg-ink-50">
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bold"><i class="fa-solid fa-bold text-xs"></i></button>
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Italic"><i class="fa-solid fa-italic text-xs"></i></button>
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Underline"><i class="fa-solid fa-underline text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Bullet list"><i class="fa-solid fa-list-ul text-xs"></i></button>
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Numbered list"><i class="fa-solid fa-list-ol text-xs"></i></button>
              <div class="w-px h-4 bg-ink-200 mx-1"></div>
              <button type="button" class="w-8 h-8 rounded hover:bg-white text-ink-500 hover:text-ink-900 transition" title="Link"><i class="fa-solid fa-link text-xs"></i></button>
            </div>
            <textarea rows="5" class="w-full px-4 py-4 text-ink-900 placeholder-ink-400 focus:outline-none resize-y" placeholder="3m x 3m pitch. Arrival from 6am for setup. Power and water available at extra cost. Public liability insurance required…"></textarea>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 p-5 sm:p-6 border-t border-ink-200 bg-ink-50">
        <button class="flex-1 py-3 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition" onclick="document.getElementById('trader-cat-drawer').classList.add('hidden')">Cancel</button>
        <button class="flex-1 py-3 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition">Save trader type</button>
      </div>
    </div>
  </div>

  <!-- ============================================================
       FULLSCREEN DATEPICKER
       Opens for any [data-datefield] element on the page.
       Flutter: showDatePicker + DatePickerDialog (or a custom full-
       screen route). The UI translates directly to Flutter's
       CalendarDatePicker widget with custom theming.
       ============================================================ -->
  <div id="fsdp" class="fsdp-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="fsdp-title">
    <div class="fsdp-panel">
      <header class="fsdp-header">
        <div>
          <p class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold">Calendar</p>
          <h3 id="fsdp-title" class="font-display text-xl text-ink-900">Select date</h3>
        </div>
        <button type="button" class="w-10 h-10 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition" data-fsdp-close aria-label="Close">
          <i class="fa-solid fa-xmark text-ink-700"></i>
        </button>
      </header>

      <div class="fsdp-body">
        <!-- Month/year nav -->
        <div class="fsdp-nav">
          <button type="button" class="fsdp-nav-btn" data-fsdp-prev aria-label="Previous month">
            <i class="fa-solid fa-chevron-left text-sm"></i>
          </button>
          <div class="text-center">
            <p id="fsdp-month" class="fsdp-month-label">April 2026</p>
          </div>
          <button type="button" class="fsdp-nav-btn" data-fsdp-next aria-label="Next month">
            <i class="fa-solid fa-chevron-right text-sm"></i>
          </button>
        </div>

        <!-- Weekday headers -->
        <div class="fsdp-weekdays">
          <div class="fsdp-weekday">Mon</div>
          <div class="fsdp-weekday">Tue</div>
          <div class="fsdp-weekday">Wed</div>
          <div class="fsdp-weekday">Thu</div>
          <div class="fsdp-weekday">Fri</div>
          <div class="fsdp-weekday">Sat</div>
          <div class="fsdp-weekday">Sun</div>
        </div>

        <!-- Day grid (populated by JS) -->
        <div class="fsdp-days" id="fsdp-days"></div>
      </div>

      <footer class="fsdp-footer">
        <button type="button" class="fsdp-quickbtn" data-fsdp-today>Today</button>
        <button type="button" class="fsdp-quickbtn" data-fsdp-clear>Clear</button>
        <div class="flex-1"></div>
        <button type="button" class="px-4 py-2 text-sm font-semibold text-ink-700 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg transition" data-fsdp-close>Cancel</button>
        <button type="button" class="px-5 py-2 text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 rounded-lg transition" data-fsdp-apply>Apply</button>
      </footer>
    </div>
  </div>

  <!-- ============================================================
       JAVASCRIPT
       ============================================================ -->
  <script>
    // ——— Tab & panel switching ————————————————————————
    const tabs = document.querySelectorAll('.tab');
    const sideTabs = document.querySelectorAll('.side-tab');
    const panels = document.querySelectorAll('.panel');
    const panelOrder = ['details','dates','description','gallery','tickets','discounts','show-cars','car-clubs','traders','publish'];
    let currentIndex = 0;

    function activateTab(name) {
      currentIndex = panelOrder.indexOf(name);

      // Mobile tabs
      tabs.forEach(t => {
        const tabName = t.dataset.tab;
        t.classList.remove('is-active', 'is-complete');
        if (tabName === name) t.classList.add('is-active');
        else if (panelOrder.indexOf(tabName) < currentIndex) t.classList.add('is-complete');
        t.setAttribute('aria-selected', tabName === name ? 'true' : 'false');
      });

      // Desktop sidebar
      sideTabs.forEach(s => {
        const sideName = s.dataset.sideTab;
        s.classList.remove('is-active', 'is-complete');
        if (sideName === name) s.classList.add('is-active');
        else if (panelOrder.indexOf(sideName) < currentIndex) s.classList.add('is-complete');
      });

      // Panels
      panels.forEach(p => {
        p.classList.toggle('is-active', p.dataset.panel === name);
      });

      // Scroll active mobile tab into view
      const activeTab = document.querySelector('.tab.is-active');
      if (activeTab && activeTab.scrollIntoView) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Progress bar
      const progressCount = document.getElementById('progress-count');
      const progressBar = document.getElementById('progress-bar');
      if (progressCount && progressBar) {
        progressCount.textContent = currentIndex + 1;
        progressBar.style.width = (((currentIndex + 1) / 10) * 100).toFixed(1) + '%';
      }

      updateMobileNav();
    }

    tabs.forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));
    sideTabs.forEach(s => s.addEventListener('click', () => activateTab(s.dataset.sideTab)));

    // Next/back buttons inside panels
    document.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.next));
    });

    // ——— Mobile nav ——————————————————————————
    function updateMobileNav() {
      const backBtn = document.getElementById('mob-back');
      const nextBtn = document.getElementById('mob-next');
      backBtn.disabled = currentIndex === 0;
      backBtn.style.opacity = currentIndex === 0 ? '0.4' : '1';
      if (currentIndex === panelOrder.length - 1) {
        nextBtn.innerHTML = '<i class="fa-solid fa-rocket text-xs"></i> Publish event';
      } else {
        nextBtn.innerHTML = 'Continue <i class="fa-solid fa-arrow-right text-xs"></i>';
      }
    }
    document.getElementById('mob-back').addEventListener('click', () => {
      if (currentIndex > 0) activateTab(panelOrder[currentIndex - 1]);
    });
    document.getElementById('mob-next').addEventListener('click', () => {
      if (currentIndex < panelOrder.length - 1) activateTab(panelOrder[currentIndex + 1]);
    });

    // ——— Chips (only used in recurring days-of-week selector now) ——————
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-active');
        if (chip.classList.contains('is-active') && !chip.querySelector('.check')) {
          const icon = document.createElement('i');
          icon.className = 'fa-solid fa-check check';
          chip.insertBefore(icon, chip.firstChild);
        }
      });
    });

    // ——— Segmented buttons (within date-type switcher) ——————————
    document.querySelectorAll('[data-date-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-date-type]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const type = btn.dataset.dateType;
        document.getElementById('single-event-block').classList.toggle('hidden', type !== 'single');
        document.getElementById('recurring-event-block').classList.toggle('hidden', type !== 'recurring');
      });
    });

    // Generic segmented (siblings only)
    document.querySelectorAll('.seg').forEach(seg => {
      if (seg.querySelector('[data-date-type]')) return;
      if (seg.querySelector('[data-discount-type]')) return;
      seg.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          seg.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        });
      });
    });

    // ——— Schedule fields show/hide ————————————————————
    document.querySelectorAll('input[name="event_status"]').forEach(r => {
      r.addEventListener('change', () => {
        const sched = document.getElementById('schedule-fields');
        sched.classList.toggle('hidden', r.value !== 'scheduled' || !r.checked);
      });
    });

    // ——— Title character counter ————————————————————
    const titleInput = document.getElementById('f-title');
    const titleCount = document.getElementById('title-count');
    if (titleInput) {
      titleInput.addEventListener('input', e => {
        titleCount.textContent = e.target.value.length;
      });
    }

    // ——— Dropzone drag highlight ————————————————————
    document.querySelectorAll('.dropzone').forEach(dz => {
      ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, e => {
        e.preventDefault(); dz.classList.add('is-dragover');
      }));
      ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, e => {
        e.preventDefault(); dz.classList.remove('is-dragover');
      }));
    });

    // ——— Fullscreen datepicker ————————————————————
    const fsdp = {
      el: document.getElementById('fsdp'),
      monthLabel: document.getElementById('fsdp-month'),
      daysGrid: document.getElementById('fsdp-days'),
      viewDate: new Date(),
      selected: null,
      target: null,
      MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],

      open(targetField) {
        this.target = targetField;
        const existing = targetField.dataset.value;
        if (existing) {
          this.selected = new Date(existing + 'T00:00:00');
          this.viewDate = new Date(this.selected);
        } else {
          this.selected = null;
          this.viewDate = new Date();
        }
        this.render();
        this.el.classList.remove('hidden');
        document.body.classList.add('fsdp-open');
      },

      close() {
        this.el.classList.add('hidden');
        document.body.classList.remove('fsdp-open');
        this.target = null;
      },

      render() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        this.monthLabel.textContent = `${this.MONTHS[month]} ${year}`;
        this.daysGrid.innerHTML = '';

        // First day of this month; JS has Sun=0..Sat=6, we want Mon=0..Sun=6
        const firstOfMonth = new Date(year, month, 1);
        const offset = (firstOfMonth.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDay = this.selected ? new Date(this.selected).setHours(0,0,0,0) : null;

        const cells = [];
        for (let i = offset - 1; i >= 0; i--) {
          cells.push({ day: daysInPrev - i, date: new Date(year, month - 1, daysInPrev - i), muted: true });
        }
        for (let d = 1; d <= daysInMonth; d++) {
          cells.push({ day: d, date: new Date(year, month, d), muted: false });
        }
        while (cells.length < 42) {
          const last = cells[cells.length - 1].date;
          const next = new Date(last);
          next.setDate(next.getDate() + 1);
          cells.push({ day: next.getDate(), date: next, muted: next.getMonth() !== month });
        }

        cells.forEach(c => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'fsdp-day';
          btn.textContent = c.day;
          if (c.muted) btn.classList.add('is-muted');
          if (c.date.getTime() === today.getTime()) btn.classList.add('is-today');
          if (selectedDay !== null && c.date.getTime() === selectedDay) btn.classList.add('is-selected');
          btn.addEventListener('click', () => {
            this.selected = new Date(c.date);
            if (c.muted) this.viewDate = new Date(c.date);
            this.render();
          });
          this.daysGrid.appendChild(btn);
        });
      },

      navigate(offset) {
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + offset, 1);
        this.render();
      },

      apply() {
        if (this.target && this.selected) {
          const d = this.selected;
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const display = `${d.getDate()} ${this.MONTHS[d.getMonth()]} ${d.getFullYear()}`;
          this.target.dataset.value = iso;
          this.target.querySelector('.df-display').textContent = display;
          this.target.classList.remove('is-empty');
        } else if (this.target && !this.selected) {
          this.target.dataset.value = '';
          this.target.querySelector('.df-display').textContent = 'Select date';
          this.target.classList.add('is-empty');
        }
        this.close();
      },

      setToday() {
        this.selected = new Date();
        this.viewDate = new Date();
        this.render();
      },

      clear() {
        this.selected = null;
        this.render();
      },
    };

    // Open picker when any date-field is clicked
    document.querySelectorAll('[data-datefield]').forEach(field => {
      field.addEventListener('click', () => fsdp.open(field));
    });

    // Wire up picker controls
    document.querySelectorAll('[data-fsdp-close]').forEach(b => b.addEventListener('click', () => fsdp.close()));
    document.querySelector('[data-fsdp-prev]').addEventListener('click', () => fsdp.navigate(-1));
    document.querySelector('[data-fsdp-next]').addEventListener('click', () => fsdp.navigate(1));
    document.querySelector('[data-fsdp-today]').addEventListener('click', () => fsdp.setToday());
    document.querySelector('[data-fsdp-clear]').addEventListener('click', () => fsdp.clear());
    document.querySelector('[data-fsdp-apply]').addEventListener('click', () => fsdp.apply());

    // Close on ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !fsdp.el.classList.contains('hidden')) fsdp.close();
    });

    // ——— Show Cars / Car Clubs conditional toggles ————————————
    function bindConditional(toggleId, contentId) {
      const toggle = document.getElementById(toggleId);
      const content = document.getElementById(contentId);
      if (!toggle || !content) return;
      toggle.addEventListener('change', () => {
        content.classList.toggle('hidden', !toggle.checked);
      });
    }
    // Enable/disable whole panel content
    bindConditional('toggle-show-cars', 'show-cars-content');
    bindConditional('toggle-car-clubs', 'car-clubs-content');
    bindConditional('toggle-traders',   'traders-content');
    // Sub-conditionals
    bindConditional('toggle-show-cars-limit',  'show-cars-limit-input');
    bindConditional('toggle-car-clubs-limit',  'car-clubs-limit-input');
    bindConditional('toggle-car-clubs-ticket', 'car-clubs-ticket-cost');
    bindConditional('toggle-cat-ticket',       'cat-ticket-cost');

    // ——— Discount drawer: type toggle (percentage / fixed) ——————
    document.querySelectorAll('[data-discount-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-discount-type]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const type = btn.dataset.discountType;
        const prefix = document.getElementById('discount-amount-prefix');
        const suffix = document.getElementById('discount-amount-suffix');
        if (!prefix || !suffix) return;
        if (type === 'fixed') {
          prefix.classList.remove('hidden');
          suffix.classList.add('hidden');
          // shift input padding
          const input = prefix.parentElement.querySelector('input');
          if (input) { input.style.paddingLeft = '2rem'; input.style.paddingRight = '14px'; }
        } else {
          prefix.classList.add('hidden');
          suffix.classList.remove('hidden');
          const input = suffix.parentElement.querySelector('input');
          if (input) { input.style.paddingLeft = '14px'; input.style.paddingRight = '2rem'; }
        }
      });
    });

    // ——— Discount drawer: "select all" cascade ——————
    const allTix = document.getElementById('discount-all-tickets');
    const individualTix = document.querySelectorAll('.discount-ticket');
    if (allTix) {
      allTix.addEventListener('change', () => {
        individualTix.forEach(cb => { cb.checked = allTix.checked; });
      });
      individualTix.forEach(cb => {
        cb.addEventListener('change', () => {
          const allChecked = Array.from(individualTix).every(c => c.checked);
          allTix.checked = allChecked;
        });
      });
    }

    // ——— Copy buttons (application links) ——————————————
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        let text = '';
        const type = btn.dataset.copyType;
        if (type === 'url') {
          const input = btn.parentElement.querySelector('input');
          text = input ? input.value : '';
        } else if (type === 'embed') {
          const pre = btn.parentElement.querySelector('pre');
          text = pre ? pre.textContent : '';
        }
        try {
          await navigator.clipboard.writeText(text);
        } catch (e) {
          // Fallback for older browsers / insecure contexts
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch(_) {}
          document.body.removeChild(ta);
        }
        const original = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 1800);
      });
    });

    updateMobileNav();
  </script>
</body>
</html>
