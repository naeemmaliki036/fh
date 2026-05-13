"use client";

interface PreviewProps {
  html: string;
}

export function Preview({ html }: PreviewProps): React.ReactElement {
  const enhanced = html
    .replace(
      /<a\s+href="([^"]+)"[^>]*>📹[^<]*<\/a>/g,
      (_match, url: string) =>
        `<video controls src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;"></video>`,
    )
    .replace(
      /<a\s+href="(https?:\/\/[^"]+(?:\.mp4|\.webm|\.mov|\.ogg)[^"]*)"[^>]*>[^<]*<\/a>/gi,
      (_match, url: string) =>
        `<video controls src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;"></video>`,
    );

  return (
    <div
      className={[
        "min-h-[60vh] p-4 bg-white",
        "[&_p]:mb-3 [&_p]:leading-relaxed",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2",
        "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3",
        "[&_li]:mb-1",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500 [&_blockquote]:my-3",
        "[&_hr]:border-zinc-200 [&_hr]:my-4",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_s]:line-through",
        "[&_video]:max-w-full [&_video]:rounded-lg",
        "[&_iframe]:max-w-full [&_iframe]:rounded-lg",
        "[&_img]:max-w-full [&_img]:rounded-md",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: enhanced }}
    />
  );
}
