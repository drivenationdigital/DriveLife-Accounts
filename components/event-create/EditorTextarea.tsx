"use client";

import { useCallback, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

/**
 * WYSIWYG editor used in the Description, Show Cars, Car Clubs, and
 * Trader-category panels. Built on TipTap (a ProseMirror wrapper)
 * with a small toolbar for the formatting we expose to organisers:
 * bold / italic / strike / bullet list / numbered list / link.
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
