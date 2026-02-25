import { useRef, useCallback } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { Attachment, getAttachmentType, validateFile, imageToBase64, readTextFile, extractPdfText } from "@/lib/attachments";

interface FileUploadProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function FileUpload({ attachments, onAttachmentsChange, disabled, maxFiles = 3 }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) { toast.error(error); return null; }

    const type = getAttachmentType(file);
    if (!type) { toast.error("Unsupported file type"); return null; }

    const attachment: Attachment = {
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      type,
    };

    try {
      if (type === "image") {
        attachment.base64 = await imageToBase64(file);
      } else if (type === "text") {
        attachment.base64 = await readTextFile(file);
      } else if (type === "pdf") {
        attachment.base64 = await extractPdfText(file);
      }
    } catch {
      toast.error(`Failed to process ${file.name}`);
      return null;
    }

    return attachment;
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxFiles - attachments.length;
    if (remaining <= 0) { toast.error(`Max ${maxFiles} files allowed`); return; }

    const toProcess = fileArray.slice(0, remaining);
    const results = await Promise.all(toProcess.map(processFile));
    const valid = results.filter(Boolean) as Attachment[];
    if (valid.length > 0) onAttachmentsChange([...attachments, ...valid]);
  }, [attachments, maxFiles, onAttachmentsChange, processFile]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv"
        multiple
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || attachments.length >= maxFiles}
        className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        title="Attach images or files"
      >
        <Paperclip className="h-4 w-4" />
      </button>
    </>
  );
}
