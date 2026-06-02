"use client";

import { CKEditorComponentProps } from "@/src/types/shared";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Type your content here...",
  minHeight = "280px",
  onReady,
}: CKEditorComponentProps) => {
  const skipExternalSyncRef = useRef(false);
  const lastSyncedValueRef = useRef<string | undefined>(undefined);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3 text-slate-800 dark:text-slate-200",
        style: `min-height: ${minHeight}`,
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      skipExternalSyncRef.current = true;
      onChange(ed.getHTML());
    },
    onCreate: ({ editor: ed }) => {
      onReady?.(ed);
    },
  });

  useEffect(() => {
    if (!editor) return;
    onReady?.(editor);
  }, [editor, onReady]);

  useEffect(() => {
    if (!editor) return;
    const next = value ?? "";
    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      lastSyncedValueRef.current = next;
      return;
    }
    if (lastSyncedValueRef.current === next) return;
    const current = editor.getHTML();
    if (current === next || (current === "<p></p>" && next === "")) return;
    editor.commands.setContent(next, false);
    lastSyncedValueRef.current = next;
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return (
      <div
        className="rounded-lg border border-gray-200 dark:border-(--card-border-color) bg-gray-50 dark:bg-page-body animate-pulse"
        style={{ minHeight }}
      />
    );
  }

  const ToolBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-(--table-hover) transition-colors",
        active && "bg-(--text-green-primary)/10 text-(--text-green-primary)",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="rich-text-editor rounded-lg overflow-hidden border-0 bg-transparent">
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-200 dark:border-(--card-border-color) bg-white dark:bg-(--dark-sidebar)">
        <ToolBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolBtn>
        <ToolBtn title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolBtn>
        <span className="w-px h-6 bg-gray-200 dark:bg-(--card-border-color) mx-1 self-center" />
        <ToolBtn title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </ToolBtn>
        <ToolBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolBtn>
        <ToolBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolBtn>
        <ToolBtn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={16} />
        </ToolBtn>
        <ToolBtn title="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={16} />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} className="rich-text-editor-content bg-gray-50 dark:bg-page-body [&_.ProseMirror]:min-h-[inherit]" />
    </div>
  );
};

export default RichTextEditor;
