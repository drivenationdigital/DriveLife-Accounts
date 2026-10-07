"use client";

import { useCallback, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import DOMPurify from "isomorphic-dompurify";

/**
 * WYSIWYG editor used in the Description, Show Cars, Car Clubs, and
 * Trader-category panels. Built on TipTap (a ProseMirror wrapper)
 * with a small toolbar for the formatting we expose to organisers:
 * bold / italic / underline / strike / bullet list / numbered list /
 * link.
 *
 * Pasted content is reduced to that same set (see cleanPastedHtml):
 * anything copied from a website, Word or Google Docs arrives as plain
 * paragraphs, lists and links with no divs, spans, styles or images.
 *
 * Output is HTML - that's what TipTap produces and what the WP
 * backend stores in ACF text fields. The `value` prop is treated as
 * the source of truth: when it changes externally (e.g. on a
 * HYDRATE from the load-event flow), the editor's content syncs.
 *
 * Bundle impact is ~80kb gzipped, scoped to the (editor) route
 * group only - the rest of the app doesn't pay for it.
 */
export function EditorTextarea({
  id,
  value,
  onChange,
  placeholder,
  minHeight = 140,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Minimum visible height in px. Replaces the old `rows` prop. */
  minHeight?: number;
}) {
  const editor = useEditor({
    extensions: [
      // StarterKit covers paragraphs, bold, italic, lists, undo, etc.
      StarterKit.configure({
        // Headings aren't in our toolbar; drop them so a pasted H1
        // doesn't render huge inside our small box.
        heading: false,
        // StarterKit v3 bundles its own Link; ours below carries the
        // rel/target settings, so the bundled one is switched off.
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    immediatelyRender: false, // SSR-safe (avoids hydration mismatch)
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-sm max-w-none focus:outline-none px-4 py-4 text-ink-900",
        style: `min-height: ${minHeight}px`,
        ...(id ? { id } : {}),
      },
      // Strip everything but basic formatting from pasted HTML before
      // ProseMirror parses it.
      transformPastedHTML: cleanPastedHtml,
    },
    onUpdate({ editor }) {
      // TipTap returns "<p></p>" for an empty editor - collapse to ""
      // so consumers can treat empty consistently.
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes back into the editor - this is what
  // makes HYDRATE work. Compare against current HTML so we don't
  // fight the user's typing or move their caret on every keystroke.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current === next) return;
    if (current === "<p></p>" && next === "") return;
    // emitUpdate=false → don't fire onUpdate (which would loop us
    // straight back into this effect).
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/10 transition relative">
      <Toolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {/* Manually-rendered placeholder. TipTap's placeholder
            extension exists but adds weight for our single-paragraph
            default. This is enough - visible only when the editor's
            empty. */}
        {placeholder && editor?.isEmpty && (
          <p className="absolute top-4 left-4 text-ink-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Toolbar
// ============================================================

function Toolbar({ editor }: { editor: Editor | null }) {
  const promptForLink = useCallback(() => {
    if (!editor) return;
    const previous = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("Link URL", previous);
    if (url === null) return; // cancel
    if (url === "") {
      // Empty input → remove the link.
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  const buttons: ToolbarButton[] = [
    {
      key: "bold",
      icon: "fa-solid fa-bold",
      title: "Bold",
      isActive: () => !!editor?.isActive("bold"),
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      icon: "fa-solid fa-italic",
      title: "Italic",
      isActive: () => !!editor?.isActive("italic"),
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      icon: "fa-solid fa-underline",
      title: "Underline",
      isActive: () => !!editor?.isActive("underline"),
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      key: "strike",
      icon: "fa-solid fa-strikethrough",
      title: "Strikethrough",
      isActive: () => !!editor?.isActive("strike"),
      onClick: () => editor?.chain().focus().toggleStrike().run(),
    },
    { key: "divider-1", divider: true },
    {
      key: "bulletList",
      icon: "fa-solid fa-list-ul",
      title: "Bullet list",
      isActive: () => !!editor?.isActive("bulletList"),
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      icon: "fa-solid fa-list-ol",
      title: "Numbered list",
      isActive: () => !!editor?.isActive("orderedList"),
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    { key: "divider-2", divider: true },
    {
      key: "link",
      icon: "fa-solid fa-link",
      title: "Link",
      isActive: () => !!editor?.isActive("link"),
      onClick: promptForLink,
    },
  ];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-ink-200 bg-ink-50 flex-wrap">
      {buttons.map((btn) => {
        if ("divider" in btn) {
          return (
            <div
              key={btn.key}
              className="w-px h-4 bg-ink-200 mx-1"
              aria-hidden
            />
          );
        }
        const active = btn.isActive();
        const cls = [
          "w-8 h-8 rounded transition flex items-center justify-center",
          active
            ? "bg-white text-ink-900 shadow-sm"
            : "text-ink-500 hover:bg-white hover:text-ink-900",
          editor ? "cursor-pointer" : "opacity-40 cursor-not-allowed",
        ].join(" ");
        return (
          <button
            key={btn.key}
            type="button"
            className={cls}
            title={btn.title}
            aria-label={btn.title}
            aria-pressed={active}
            onClick={btn.onClick}
            disabled={!editor}
          >
            <i className={`${btn.icon} text-xs`} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

type ToolbarButton =
  | {
      key: string;
      icon: string;
      title: string;
      isActive: () => boolean;
      onClick: () => void;
    }
  | { key: string; divider: true };

// ============================================================
// Paste cleaning
// ============================================================

/** The only tags a paste may contribute - the toolbar's own set. */
const PASTE_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "strike",
  "a",
  "ul",
  "ol",
  "li",
];

/** Block-level containers that become paragraphs (or unwrap when they
 *  hold other blocks). Headings are demoted on purpose. */
const BLOCK_TO_PARAGRAPH =
  "div, section, article, header, footer, main, aside, nav, figure, figcaption, blockquote, pre, address, details, summary, h1, h2, h3, h4, h5, h6, table, thead, tbody, tfoot, tr, td, th, dl, dt, dd, center";

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "MAIN",
  "ASIDE",
  "NAV",
  "FIGURE",
  "FIGCAPTION",
  "BLOCKQUOTE",
  "PRE",
  "ADDRESS",
  "DETAILS",
  "SUMMARY",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TD",
  "TH",
  "UL",
  "OL",
  "LI",
  "DL",
  "DT",
  "DD",
  "CENTER",
  "HR",
]);

/** Replace an element with its children. */
function unwrap(el: Element) {
  el.replaceWith(...Array.from(el.childNodes));
}

/** Replace an element with a `<tag>` holding the same children. */
function retag(el: Element, tag: string) {
  const next = el.ownerDocument.createElement(tag);
  next.append(...Array.from(el.childNodes));
  el.replaceWith(next);
}

/**
 * Reduce pasted HTML to paragraphs, lists, links and bold / italic /
 * underline / strikethrough.
 *
 * Why not just DOMPurify with an allowlist: purifying alone unwraps a
 * stripped <div> into its text, so three pasted lines of a web page
 * collapse into one paragraph, and Google Docs' bold/italic live in
 * inline styles on <span>s (and its "normal" <b> wrapper would make
 * everything bold). The DOM pass first keeps the line structure and
 * turns those styles into the semantic tags the editor understands;
 * DOMPurify then enforces the allowlist on what is left.
 *
 * Only ever called in the browser (a paste), so DOMParser is available.
 */
function cleanPastedHtml(html: string): string {
  if (!html || typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  // Google Docs wraps the whole paste in <b style="font-weight:normal">.
  body.querySelectorAll("b, strong").forEach((el) => {
    if (/font-weight\s*:\s*(normal|[1-4]00)\b/i.test(el.getAttribute("style") ?? "")) {
      unwrap(el);
    }
  });

  // Inline-style formatting → semantic tags, innermost first so a span
  // carrying two styles nests correctly.
  Array.from(body.querySelectorAll("span, font"))
    .reverse()
    .forEach((el) => {
      const style = el.getAttribute("style") ?? "";
      const bold = /font-weight\s*:\s*(bold|bolder|[5-9]00)\b/i.test(style);
      const italic = /font-style\s*:\s*italic/i.test(style);
      const underline = /text-decoration(-line)?\s*:\s*[^;]*underline/i.test(style);
      const strike = /text-decoration(-line)?\s*:\s*[^;]*line-through/i.test(style);
      // Each wrap puts the previous wrapper (and the span) inside the
      // new one, so two styles nest as <u><em>…</em></u>.
      const wrapIn = (tag: string) => {
        const wrapper = doc.createElement(tag);
        el.replaceWith(wrapper);
        wrapper.appendChild(el);
      };
      if (bold) wrapIn("strong");
      if (italic) wrapIn("em");
      if (underline) wrapIn("u");
      if (strike) wrapIn("s");
      // The span itself has nothing left to say.
      unwrap(el);
    });

  // Block containers: a paragraph when they only hold inline content,
  // otherwise unwrapped so their own block children stand on their own.
  // Deepest first (querySelectorAll is document order), so a container
  // is judged on its children AFTER those have been converted.
  Array.from(body.querySelectorAll(BLOCK_TO_PARAGRAPH))
    .reverse()
    .forEach((el) => {
      const hasBlockChild = Array.from(el.children).some((c) =>
        BLOCK_TAGS.has(c.tagName),
      );
      if (hasBlockChild) {
        unwrap(el);
      } else {
        retag(el, "p");
      }
    });

  // A paragraph directly inside a list item renders as a line break in
  // the item; unwrap it so items stay single-line like typed ones.
  body.querySelectorAll("li > p:only-child").forEach(unwrap);

  const cleaned = DOMPurify.sanitize(body.innerHTML, {
    ALLOWED_TAGS: PASTE_ALLOWED_TAGS,
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });

  // Empty paragraphs left behind by stripped images, spacer divs and
  // Word's blank lines.
  return cleaned.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
}
