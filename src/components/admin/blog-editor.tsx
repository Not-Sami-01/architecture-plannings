"use client";

import { useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  RedoIcon,
  TableIcon,
  UndoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUploadPostImage } from "@/hooks/admin/use-upload-post-image";

type BlogEditorProps = {
  /** Current sanitized HTML; the form field it wires into. */
  value: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

/**
 * TipTap 3 rich-text editor (plan 6). `immediatelyRender: false` keeps SSR
 * safe (the editor only mounts client-side); every change writes sanitized-
 * on-save HTML into the parent form field. Images upload through the admin
 * multipart route and land in content as `/api/posts/images/:id`.
 */
export function BlogEditor({ value, onChange }: BlogEditorProps) {
  const { actions: uploadActions, loadings: uploadLoadings } = useUploadPostImage();

  const uploadImage = useCallback(
    async (file: File) => {
      const { url } = await uploadActions.upload({ file, filename: file.name });
      return url;
    },
    [uploadActions]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: "Start writing… use H2/H3 for section headings.",
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "blog-prose min-h-[40svh] rounded-md border bg-background px-4 py-3",
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const pickImage = () => {
    if (!editor || uploadLoadings.uploading) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const src = await uploadImage(file);
        editor.chain().focus().setImage({ src, alt: file.name }).run();
      } catch {
        // Mutation hook already toasts the error.
      }
    };
    input.click();
  };

  if (!editor) {
    return (
      <div className="h-[40svh] animate-pulse rounded-md border bg-muted" aria-hidden />
    );
  }

  const { isActive } = editor;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-0.5 rounded-md border p-1">
        <ToolbarButton
          label="Bold"
          active={isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon />
        </ToolbarButton>
        <ToolbarButton label="Link" active={isActive("link")} onClick={setLink}>
          <Link2Icon />
        </ToolbarButton>
        <ToolbarButton label="Image" onClick={pickImage} disabled={uploadLoadings.uploading}>
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Table"
          active={isActive("table")}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
        >
          <TableIcon />
        </ToolbarButton>
        <ToolbarButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <MinusIcon />
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoIcon />
        </ToolbarButton>
        <span className="ml-auto px-2 text-xs text-muted-foreground tabular-nums">
          {editor.storage.characterCount.characters().toLocaleString()} chars
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
