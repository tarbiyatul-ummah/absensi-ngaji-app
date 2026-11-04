import React from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import type { InvoiceData } from "../types";
import { InvoiceLivePreview } from "../components/finance/InvoiceLivePreview";

export const downloadInvoiceImageFromElement = async (
  element: HTMLElement,
  invoiceNumber: string,
): Promise<void> => {
  const dataUrl = await toPng(element, {
    quality: 0.98,
    pixelRatio: 2, // 2x high resolution for sharp output
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const link = document.createElement("a");
  const cleanNumber = invoiceNumber.replace(/[\/\\]/g, "-");
  link.download = `Invoice-${cleanNumber}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportInvoiceAsImage = async (
  invoice: InvoiceData,
  status = "unpaid",
): Promise<void> => {
  // Jika elemen preview invoice sudah ter-render di DOM
  const existingEl = document.getElementById("invoice-printable-area");
  if (existingEl && existingEl.offsetParent !== null) {
    await downloadInvoiceImageFromElement(existingEl, invoice.invoiceNumber);
    return;
  }

  // Jika dipanggil dari list (off-screen container)
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "720px";
  container.style.zIndex = "-1000";
  container.style.backgroundColor = "#ffffff";
  document.body.appendChild(container);

  const root = createRoot(container);
  try {
    root.render(React.createElement(InvoiceLivePreview, { invoice, status }));
    // Tunggu mounting & styling selesai
    await new Promise((resolve) => setTimeout(resolve, 200));
    const targetEl = (container.firstElementChild as HTMLElement) || container;
    await downloadInvoiceImageFromElement(targetEl, invoice.invoiceNumber);
  } finally {
    root.unmount();
    container.remove();
  }
};

