"use client";

import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceActions({
  targetId,
  invoiceNumber,
  autoAction,
}: {
  targetId: string;
  invoiceNumber: string;
  autoAction?: "download" | "print" | null;
}) {
  const downloading = useRef(false);
  const hasAutoRun = useRef(false);

  const downloadPdf = async () => {
    if (downloading.current) return;
    const element = document.getElementById(targetId);
    if (!element) return;

    downloading.current = true;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${invoiceNumber}.pdf`);
    } finally {
      downloading.current = false;
    }
  };

  useEffect(() => {
    if (hasAutoRun.current) return;
    if (autoAction === "download") {
      hasAutoRun.current = true;
      void downloadPdf();
    }
    if (autoAction === "print") {
      hasAutoRun.current = true;
      window.print();
    }
  }, [autoAction]);

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button type="button" onClick={downloadPdf}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  );
}
