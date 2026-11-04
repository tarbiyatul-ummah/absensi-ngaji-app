import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { image, line, rectangle, svg, table, text } from "@pdfme/schemas";
import type { InvoiceData } from "../types";
import { formatMonthLabel, formatRupiah, formatShortDate } from "../utils/invoiceUtils";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const BLACK = "#111827";
const MUTED = "#4B5563";
const BORDER = "#D1D5DB";
const PRIMARY = "#16A34A"; // Emerald / Green for Islamic School / TPQ
const BG_HEADER = "#F3F4F6";

const fieldText = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    content?: string;
    fontSize?: number;
    fontColor?: string;
    alignment?: "left" | "center" | "right";
    verticalAlignment?: "top" | "middle" | "bottom";
    lineHeight?: number;
    bold?: boolean;
  } = {},
) => ({
  name,
  type: "text",
  position: { x, y },
  width,
  height,
  content: options.content ?? "",
  fontSize: Math.max(8, options.fontSize ?? 10),
  alignment: options.alignment ?? "left",
  verticalAlignment: options.verticalAlignment ?? "top",
  lineHeight: options.lineHeight ?? 1.25,
  characterSpacing: 0,
  fontColor: options.fontColor ?? BLACK,
  backgroundColor: "",
  readOnly: false,
  ...(options.bold
    ? {
        textFormat: "inline-markdown",
        fontVariantFallback: "synthetic",
        fontVariants: { bold: "" },
      }
    : {}),
});

const fieldLine = (
  name: string,
  x: number,
  y: number,
  width: number,
  color = BORDER,
) => ({
  name,
  type: "line",
  position: { x, y },
  width,
  height: 0,
  color,
});

const fieldRect = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    borderColor?: string;
    backgroundColor?: string;
    borderWidth?: number;
  } = {},
) => ({
  name,
  type: "rectangle",
  position: { x, y },
  width,
  height,
  borderColor: options.borderColor ?? BORDER,
  borderWidth: options.borderWidth ?? 0.5,
  backgroundColor: options.backgroundColor ?? "",
  readOnly: false,
});

export const generateInvoicePdf = async (invoice: InvoiceData): Promise<void> => {
  const hasLogo = Boolean(invoice.header.showLogo && invoice.header.logoUrl);
  const leftMargin = 15;
  const contentWidth = PAGE_WIDTH - leftMargin * 2; // 180mm

  // Buat Table Schema
  const tableHead = ["No", "Nama Santri", "Kelas", "Bulan Tagihan", "Tarif/Bulan", "Subtotal"];
  const headWidthPercentages = [7, 23, 15, 27, 13, 15];

  const tableRows: string[][] = invoice.students.map((st, idx) => [
    String(idx + 1),
    st.santriNama,
    st.jilidNama || "-",
    st.months.map(formatMonthLabel).join(", "),
    formatRupiah(st.monthlyFee),
    formatRupiah(st.subtotal),
  ]);

  // Adjustments rows
  if (invoice.adjustments && invoice.adjustments.length > 0) {
    invoice.adjustments.forEach((adj) => {
      tableRows.push([
        "",
        adj.label,
        "-",
        "-",
        "-",
        (adj.amount < 0 ? "- " : "+ ") + formatRupiah(Math.abs(adj.amount)),
      ]);
    });
  }

  // Summary Row: Grand Total
  tableRows.push([
    "",
    "TOTAL HARUS DIBAYAR",
    "",
    "",
    "",
    formatRupiah(invoice.grandTotal),
  ]);

  const template: Template = {
    basePdf: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      padding: [0, 0, 0, 0],
    },
    schemas: [
      [
        // KIRI ATAS: Logo & Pengirim / Lembaga
        ...(hasLogo
          ? [
              {
                name: "logo",
                type: invoice.header.logoUrl?.startsWith("data:image/svg") ? "svg" : "image",
                position: { x: leftMargin, y: 15 },
                width: 18,
                height: 18,
              },
            ]
          : []),
        fieldText(
          "org_name",
          hasLogo ? leftMargin + 22 : leftMargin,
          15,
          85,
          7,
          {
            fontSize: 13,
            bold: true,
            fontColor: BLACK,
          },
        ),
        fieldText(
          "org_sub",
          hasLogo ? leftMargin + 22 : leftMargin,
          22,
          85,
          10,
          {
            fontSize: 8.5,
            fontColor: MUTED,
          },
        ),

        // KIRI TENGAH: Bill To (Ditujukan Kepada)
        fieldText("bill_to_label", leftMargin, 35, 80, 5, {
          fontSize: 8.5,
          fontColor: MUTED,
        }),
        fieldText("recipient_name", leftMargin, 40, 80, 7, {
          fontSize: 11,
          bold: true,
          fontColor: BLACK,
        }),

        // KANAN ATAS: INVOICE, Nomor, Tanggal, & Balance Due Bar
        fieldText("doc_title", leftMargin + 90, 15, 90, 9, {
          fontSize: 22,
          bold: true,
          alignment: "right",
          fontColor: BLACK,
        }),
        fieldText("invoice_num", leftMargin + 90, 25, 90, 6, {
          fontSize: 10,
          alignment: "right",
          fontColor: MUTED,
        }),
        fieldText("meta_date", leftMargin + 90, 32, 90, 6, {
          fontSize: 8.5,
          alignment: "right",
          fontColor: MUTED,
        }),

        // Kotak Balance Due Highlight (Abu-abu lembut sesuai Referensi 1)
        fieldRect("balance_due_bg", leftMargin + 90, 39, 90, 8.5, {
          borderColor: "#E2E8F0",
          backgroundColor: "#F1F5F9",
          borderWidth: 0.5,
        }),
        fieldText("balance_due_label", leftMargin + 93, 40.8, 38, 5.5, {
          fontSize: 9,
          fontColor: BLACK,
          bold: true,
        }),
        fieldText("balance_due_val", leftMargin + 130, 40.8, 48, 5.5, {
          fontSize: 9.5,
          fontColor: BLACK,
          bold: true,
          alignment: "right",
        }),

        // TABEL RINCIAN TAGIHAN (Header Gelap Modern)
        {
          name: "invoice_table",
          type: "table",
          position: { x: leftMargin, y: 53 },
          width: contentWidth,
          height: 90,
          content: "[]",
          showHead: true,
          repeatHead: false,
          head: tableHead,
          headWidthPercentages,
          tableStyles: {
            borderWidth: 0.3,
            borderColor: "#E2E8F0",
          },
          headStyles: {
            fontSize: 9,
            characterSpacing: 0,
            alignment: "center",
            verticalAlignment: "middle",
            lineHeight: 1,
            fontColor: "#FFFFFF",
            borderColor: "#1E293B",
            backgroundColor: "#1E293B", // Dark slate / navy sesuai referensi
            borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
            padding: { top: 4, right: 3, bottom: 4, left: 3 },
          },
          bodyStyles: {
            fontSize: 8.5,
            characterSpacing: 0,
            alignment: "left",
            verticalAlignment: "middle",
            lineHeight: 1.1,
            fontColor: BLACK,
            borderColor: "#E2E8F0",
            backgroundColor: "#FFFFFF",
            alternateBackgroundColor: "#F8FAFC",
            borderWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
            padding: { top: 4, right: 4, bottom: 4, left: 4 },
          },
          columnStyles: {
            0: { alignment: "center" },
            1: { alignment: "left" },
            2: { alignment: "center" },
            3: { alignment: "left" },
            4: { alignment: "right" },
            5: { alignment: "right" },
          },
        },

        // Kotak Catatan (Kiri Bawah)
        fieldRect("note_box", leftMargin, 175, 100, 45, {
          borderColor: "#E2E8F0",
          backgroundColor: "#F8FAFC",
          borderWidth: 0.5,
        }),
        fieldText("note_title", leftMargin + 4, 178, 92, 6, {
          fontSize: 9,
          bold: true,
          fontColor: BLACK,
        }),
        fieldText("note_info", leftMargin + 4, 185, 92, 32, {
          fontSize: 8,
          fontColor: MUTED,
          lineHeight: 1.35,
        }),

        // Kotak Rekening Transfer (Kanan, tepat di bawah total tagihan)
        fieldRect("pay_box", leftMargin + 105, 175, contentWidth - 105, 30, {
          borderColor: "#E2E8F0",
          backgroundColor: "#F8FAFC",
          borderWidth: 0.5,
        }),
        fieldText("pay_title", leftMargin + 109, 178, contentWidth - 113, 6, {
          fontSize: 9,
          bold: true,
          fontColor: BLACK,
        }),
        fieldText("pay_info", leftMargin + 109, 185, contentWidth - 113, 18, {
          fontSize: 8,
          fontColor: MUTED,
          lineHeight: 1.35,
        }),

        // Tanda Tangan (Kanan Bawah, di bawah kotak rekening)
        fieldText("sign_place", leftMargin + contentWidth - 65, 215, 60, 6, {
          fontSize: 8.5,
          alignment: "center",
          fontColor: MUTED,
        }),
        fieldText("sign_role", leftMargin + contentWidth - 65, 221, 60, 6, {
          fontSize: 8.5,
          alignment: "center",
          fontColor: MUTED,
        }),
        fieldLine("sign_line", leftMargin + contentWidth - 60, 245, 50, BORDER),
        fieldText("sign_name", leftMargin + contentWidth - 65, 247, 60, 6, {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fontColor: BLACK,
        }),
      ],
    ],
  };

  const orgSubText = [
    invoice.header.address,
    invoice.header.phone ? `Kontak/WA: ${invoice.header.phone}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const dateSub = [
    invoice.issuedDate ? `Date: ${formatShortDate(invoice.issuedDate)}` : "",
    invoice.dueDate ? `Due: ${formatShortDate(invoice.dueDate)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const payLines: string[] = [];
  if (invoice.bankName || invoice.bankAccountNumber) {
    payLines.push(`${invoice.bankName || "-"}`);
    payLines.push(`No. Rek: ${invoice.bankAccountNumber || "-"}`);
    if (invoice.bankAccountHolder) {
      payLines.push(`a.n. ${invoice.bankAccountHolder}`);
    }
  }
  const noteText =
    invoice.notes?.trim() || "Silakan melakukan konfirmasi setelah transfer.";

  const inputs: Record<string, string>[] = [
    {
      ...(hasLogo && invoice.header.logoUrl ? { logo: invoice.header.logoUrl } : {}),
      org_name: invoice.header.organizationName || "LPQ",
      org_sub: orgSubText || "Sistem Informasi Manajemen Santri",
      bill_to_label: "Bill To:",
      recipient_name: invoice.recipientName?.trim() || "Wali Santri",
      doc_title: (invoice.header.title || "INVOICE").toUpperCase(),
      invoice_num: `# ${invoice.invoiceNumber}`,
      meta_date: dateSub || "Date: -",
      balance_due_label: "Balance Due:",
      balance_due_val: formatRupiah(invoice.grandTotal),
      invoice_table: JSON.stringify(tableRows),
      note_title: "Catatan:",
      note_info: noteText,
      pay_title: "Rekening Pembayaran:",
      pay_info: payLines.join("\n") || "-",
      sign_place: invoice.issuedDate
        ? `Diterbitkan pada ${formatShortDate(invoice.issuedDate)}`
        : "",
      sign_role: "Pengurus / Bendahara",
      sign_name: invoice.bankAccountHolder || "( Bendahara Lembaga )",
    },
  ];

  const pdf = await generate({
    template,
    inputs,
    plugins: {
      Text: text,
      Image: image,
      SVG: svg,
      Line: line,
      Rectangle: rectangle,
      Table: table,
    },
  });

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedFileName = `Invoice-${invoice.invoiceNumber.replace(/[\/\\]/g, "-")}.pdf`;

  link.href = url;
  link.download = sanitizedFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

