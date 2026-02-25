// ─── Attachment utilities ───

export interface Attachment {
  id: string;
  file: File;
  preview: string; // object URL or data URI
  type: "image" | "pdf" | "text";
  base64?: string;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_IMAGE_DIMENSION = 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf", "text/plain", "text/csv"];

export function getAttachmentType(file: File): "image" | "pdf" | "text" | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("text/")) return "text";
  return null;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Unsupported file type. Use images, PDFs, or text files.";
  return null;
}

/** Resize image to max dimension and return base64 data URI */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

/** Read text file content */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/** Build multimodal content array for the AI API */
export function buildMultimodalContent(
  text: string,
  attachments: Attachment[]
): string | Array<{ type: string; text?: string; image_url?: { url: string } }> {
  if (attachments.length === 0) return text;

  const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
  
  // Add text context from file attachments first
  const textParts: string[] = [text];
  attachments.forEach((a) => {
    if (a.type === "text" && a.base64) {
      textParts.push(`\n\n[Attached file: ${a.file.name}]\n${a.base64}`);
    }
  });
  
  parts.push({ type: "text", text: textParts.join("") });

  // Add images
  attachments
    .filter((a) => a.type === "image" && a.base64)
    .forEach((a) => {
      parts.push({
        type: "image_url",
        image_url: { url: a.base64! },
      });
    });

  return parts;
}
