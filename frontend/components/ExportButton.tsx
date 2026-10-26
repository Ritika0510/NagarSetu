"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AlertTriangle, Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  procedureId: string;
  targetRef: RefObject<HTMLDivElement | null>;
}

type ExportState = "idle" | "loading" | "success" | "error";

const MIN_SPINNER_MS = 1000;
const RESULT_VISIBLE_MS = 2000;

async function generatePdf(target: HTMLDivElement, procedureId: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(target, {
    scale: 2,
    backgroundColor: "#F8FAFC",
  });
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const margin = 20;
  const imgWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageContentHeight = pdf.internal.pageSize.getHeight() - margin * 2;
  const pxPerPt = canvas.width / imgWidth;
  const sliceHeightPx = Math.floor(pageContentHeight * pxPerPt);

  // Long checklists continue on extra pages instead of being squashed onto one.
  let offset = 0;
  let page = 0;
  while (offset < canvas.height) {
    const sliceHeight = Math.min(sliceHeightPx, canvas.height - offset);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    context.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, imgWidth, sliceHeight / pxPerPt);
    offset += sliceHeight;
    page += 1;
  }
  pdf.save(`nagarsetu-${procedureId}.pdf`);
}

export function ExportButton({ procedureId, targetRef }: ExportButtonProps) {
  const [exportState, setExportState] = useState<ExportState>("idle");
  const resetTimer = useRef<number | null>(null);
  const mounted = useRef<boolean>(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const showResult = (next: "success" | "error"): void => {
    if (!mounted.current) return;
    setExportState(next);
    resetTimer.current = window.setTimeout(() => {
      setExportState("idle");
      resetTimer.current = null;
    }, RESULT_VISIBLE_MS);
  };

  const handleExport = async (): Promise<void> => {
    const target = targetRef.current;
    if (!target || exportState === "loading") return;

    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setExportState("loading");
    const startedAt = Date.now();

    let succeeded = false;
    try {
      await generatePdf(target, procedureId);
      succeeded = true;
    } catch (error) {
      console.error("PDF export failed:", error);
    }

    // The spinner shows for at least 1s, and "Saved" only appears once the file is really saved.
    const remaining = Math.max(0, MIN_SPINNER_MS - (Date.now() - startedAt));
    if (remaining > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
    }
    showResult(succeeded ? "success" : "error");
  };

  const label =
    exportState === "loading"
      ? "Exporting"
      : exportState === "success"
        ? "Saved"
        : exportState === "error"
          ? "Export failed"
          : "Export PDF";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleExport()}
      disabled={exportState === "loading"}
      data-html2canvas-ignore="true"
      className="h-auto gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-shadow duration-150 ease-out hover:bg-white hover:shadow-md"
    >
      {exportState === "loading" ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : exportState === "success" ? (
        <Check aria-hidden="true" className="h-4 w-4 text-success-600" />
      ) : exportState === "error" ? (
        <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-600" />
      ) : (
        <Download aria-hidden="true" className="h-4 w-4" />
      )}
      {label}
      <span role="status" className="sr-only">
        {exportState === "idle" ? "" : label}
      </span>
    </Button>
  );
}

export default ExportButton;
