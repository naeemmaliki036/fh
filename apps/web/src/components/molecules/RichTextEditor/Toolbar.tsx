"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote,
  Minus, Link2, Unlink, ImageIcon, Youtube as YoutubeIcon,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { UploadPopover } from "./UploadPopover";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : disabled
          ? "text-zinc-300 cursor-not-allowed"
          : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-200 mx-0.5" />;
}

interface ToolbarProps {
  editor: Editor;
  onInsertImage: (url: string) => void;
  onInsertVideo: (url: string) => void;
}

export function Toolbar({ editor, onInsertImage, onInsertVideo }: ToolbarProps): React.ReactElement {
  const [activePopover, setActivePopover] = useState<"image" | "video" | null>(null);

  const setLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const handleInsertImage = (url: string) => {
    onInsertImage(url);
    setActivePopover(null);
  };

  const handleInsertVideo = (url: string) => {
    onInsertVideo(url);
    setActivePopover(null);
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-zinc-50 border-b border-zinc-200">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title={editor.isActive("link") ? "Remove Link" : "Add Link"}>
        {editor.isActive("link") ? <Unlink className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </ToolbarButton>
      <div className="relative">
        <ToolbarButton
          onClick={() => setActivePopover(activePopover === "image" ? null : "image")}
          active={activePopover === "image"}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        {activePopover === "image" && (
          <UploadPopover type="image" onInsert={handleInsertImage} onClose={() => setActivePopover(null)} />
        )}
      </div>
      <div className="relative">
        <ToolbarButton
          onClick={() => setActivePopover(activePopover === "video" ? null : "video")}
          active={activePopover === "video"}
          title="Insert Video/YouTube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>
        {activePopover === "video" && (
          <UploadPopover type="video" onInsert={handleInsertVideo} onClose={() => setActivePopover(null)} />
        )}
      </div>
    </div>
  );
}
