import { useState } from "react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { Attachment } from "@/lib/attachments";

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  size?: "sm" | "md";
}

export function AttachmentPreview({ attachments, onRemove, size = "sm" }: AttachmentPreviewProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const dim = size === "sm" ? "h-12 w-12" : "h-14 w-14";

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {attachments.map((att) => (
          <div key={att.id} className="relative group">
            {att.type === "image" ? (
              <img
                src={att.preview}
                alt={att.file.name}
                className={`${dim} rounded-lg object-cover border border-border/50 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all`}
                onClick={() => setPreviewSrc(att.preview)}
              />
            ) : (
              <div className={`${dim} rounded-lg border border-border/50 bg-secondary/50 flex flex-col items-center justify-center`}>
                <span className="text-[8px] text-muted-foreground font-medium">
                  {att.file.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => onRemove(att.id)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </>
  );
}
