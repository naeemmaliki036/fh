"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Pencil, Eye } from "lucide-react";

import { ResizableImage } from "./ResizableImage";
import { ResizableYoutube } from "./ResizableYoutube";
import { Toolbar } from "./Toolbar";
import { Preview } from "./Preview";

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder: placeholderText,
  minHeight = "min-h-[60vh]",
}: RichTextEditorProps): React.ReactElement | null {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExt.configure({ openOnClick: false }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      ResizableYoutube.configure({ width: 640, height: 360 }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholderText ?? "Start writing..." }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: `${minHeight} p-4 focus:outline-none [&_img]:cursor-pointer`,
      },
    },
  });

  // Sync external content changes into the editor
  useEffect(() => {
    if (!editor) return;
    const next = content ?? "";
    if (editor.getHTML() === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) return null;

  const handleInsertImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  const handleInsertVideo = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    } else {
      const filename = url.split("/").pop()?.split("?")[0] ?? "video";
      editor.chain().focus().insertContent(
        `<p><a href="${url}" target="_blank" rel="noopener noreferrer">📹 Video: ${filename}</a></p>`
      ).run();
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      {/* Edit / Preview tab toggle */}
      <div className="flex items-center gap-0 bg-zinc-50 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            mode === "edit"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
            mode === "preview"
              ? "border-primary text-primary"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
      </div>

      {mode === "preview" ? (
        <Preview html={editor.getHTML()} />
      ) : (
        <>
          <Toolbar
            editor={editor}
            onInsertImage={handleInsertImage}
            onInsertVideo={handleInsertVideo}
          />
          <div className={`overflow-y-auto ${minHeight}`}>
            <EditorContent editor={editor} />
          </div>
        </>
      )}
    </div>
  );
}
