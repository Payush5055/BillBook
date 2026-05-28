"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function InvoiceActions({
  targetId,
  invoiceNumber,
  autoAction,
  invoiceId,
}: {
  targetId: string;
  invoiceNumber: string;
  autoAction?: "download" | "print" | null;
  invoiceId?: string;
}) {
  const router = useRouter();
  const downloading = useRef(false);
  const hasAutoRun = useRef(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    if (downloading.current) return;
    const element = document.getElementById(targetId);
    if (!element) return;

    downloading.current = true;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
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
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (hasAutoRun.current) return;
    if (autoAction === "download") {
      hasAutoRun.current = true;
      downloadPdf().then(() => {
        if (invoiceId) router.replace(`/invoices/${invoiceId}`);
      });
    }
    if (autoAction === "print") {
      hasAutoRun.current = true;
      window.print();
      if (invoiceId) router.replace(`/invoices/${invoiceId}`);
    }
  }, [autoAction]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button type="button" onClick={downloadPdf} disabled={pdfLoading}>
        <Download className="mr-2 h-4 w-4" />
        {pdfLoading ? "Generating..." : "Download PDF"}
      </Button>
    </div>
  );
}
