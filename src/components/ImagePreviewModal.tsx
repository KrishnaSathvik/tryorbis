import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImagePreviewModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt = "Preview", onClose }: ImagePreviewModalProps) {
  if (!src) return null;
  return (
    <Dialog open={!!src} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background/95 backdrop-blur-sm border-border/50 rounded-2xl">
        <VisuallyHidden><DialogTitle>Image Preview</DialogTitle></VisuallyHidden>
        <img
          src={src}
          alt={alt}
          className="w-full h-full max-h-[85vh] object-contain rounded-xl"
        />
      </DialogContent>
    </Dialog>
  );
}
