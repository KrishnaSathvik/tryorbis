import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { downloadMarkdownFile } from "@/lib/downloadMarkdown";
import { cn } from "@/lib/utils";
import {
  buildValidationMarkdown,
  validationMarkdownFilename,
  type ValidationMarkdownReport,
} from "@/lib/validationMarkdown";

type ValidationMarkdownExportProps = {
  report: ValidationMarkdownReport;
  className?: string;
};

export function ValidationMarkdownExport({
  report,
  className,
}: ValidationMarkdownExportProps) {
  const handleExport = () => {
    try {
      const markdown = buildValidationMarkdown(report);
      const filename = validationMarkdownFilename(report.ideaText);
      downloadMarkdownFile(markdown, filename);
      track("export_markdown", { type: "validation" });
      toast.success("Markdown report exported");
    } catch {
      toast.error("Couldn’t export this report");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-full", className)}
      onClick={handleExport}
    >
      <FileDown aria-hidden className="h-4 w-4" />
      Export Markdown
    </Button>
  );
}
