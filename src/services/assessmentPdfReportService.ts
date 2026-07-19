import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { image, line, rectangle, svg, table, text } from "@pdfme/schemas";

export interface AssessmentPdfScore {
  label: string;
  score: number;
  maxScore: number;
}

export interface AssessmentPdfReportRow {
  studentName: string;
  birthDateLabel: string;
  levelName: string;
  levelLabel: string;
  mentorName: string;
  mentorLabel: string;
  assessmentName: string;
  organizationName: string;
  logoUrl: string;
  academicYearLabel: string;
  semesterLabel: string;
  minimumScore: number;
  attendancePresent: number;
  attendancePermission: number;
  attendanceAbsent: number;
  scores: AssessmentPdfScore[];
  notes: string;
}

export type AssessmentPdfProgress = {
  current: number;
  total: number;
  message: string;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const BLACK = "#111111";
const MUTED = "#666666";
const BORDER = "#D6D6D6";
const CHART = "#F97316";
const CHART_SOFT = "#FED7AA";
const FALLBACK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#111111"/><path d="M20 33.5c4.8-9.4 12.3-14.9 24-17.5-1.7 10.7-7 19.2-16.8 25.3 5.6.2 10.7-1.5 15.3-5.1-3.7 8.2-10.7 12.8-20 12.8-4.7 0-8.5-1.5-11.5-4.4 4.7-.6 7.7-4.3 9-11.1Z" fill="#ffffff"/></svg>`;
const TRANSPARENT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"></svg>`;
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lWkI6QAAAABJRU5ErkJggg==";

const waitFrame = () =>
  new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }

    setTimeout(resolve, 0);
  });

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

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
    readOnly?: boolean;
    bold?: boolean;
  } = {},
) => ({
  name,
  type: "text",
  position: { x, y },
  width,
  height,
  content: options.content ?? "",
  fontSize: Math.max(12, options.fontSize ?? 12),
  alignment: options.alignment ?? "left",
  verticalAlignment: options.verticalAlignment ?? "top",
  lineHeight: options.lineHeight ?? 1.25,
  characterSpacing: 0,
  fontColor: options.fontColor ?? BLACK,
  backgroundColor: "",
  readOnly: options.readOnly ?? false,
  ...(options.bold
    ? {
        textFormat: "inline-markdown",
        fontVariantFallback: "synthetic",
        fontVariants: {
          bold: "",
        },
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

const fieldSvg = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  name,
  type: "svg",
  position: { x, y },
  width,
  height,
});

const fieldImage = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  name,
  type: "image",
  position: { x, y },
  width,
  height,
});

const fieldRect = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  name,
  type: "rectangle",
  position: { x, y },
  width,
  height,
  rotate: 0,
  opacity: 1,
  borderWidth: 0.3,
  borderColor: BLACK,
  color: "",
  radius: 0,
  readOnly: true,
  required: false,
  content: "",
});

const tableLineBorderWidth = {
  top: 0.1,
  right: 0,
  bottom: 0.1,
  left: 0,
};

const tablePadding = {
  top: 5,
  right: 5,
  bottom: 5,
  left: 5,
};

const fieldTable = (
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  head: string[],
  headWidthPercentages: number[],
  options: {
    showHead?: boolean;
    columnStyles?: Record<string, Record<string, string>>;
  } = {},
) => ({
  name,
  type: "table",
  position: { x, y },
  width,
  height,
  content: "[]",
  showHead: options.showHead ?? true,
  repeatHead: false,
  head,
  headWidthPercentages,
  tableStyles: {
    borderWidth: 0,
    borderColor: BLACK,
  },
  headStyles: {
    fontSize: 13,
    characterSpacing: 0,
    alignment: "center",
    verticalAlignment: "middle",
    lineHeight: 1,
    fontColor: BLACK,
    borderColor: BLACK,
    backgroundColor: "#FFFFFF",
    borderWidth: {
      top: 0.1,
      right: 0,
      bottom: 0,
      left: 0,
    },
    padding: tablePadding,
  },
  bodyStyles: {
    fontSize: 13,
    characterSpacing: 0,
    alignment: "center",
    verticalAlignment: "middle",
    lineHeight: 1,
    fontColor: BLACK,
    borderColor: BLACK,
    backgroundColor: "#FFFFFF",
    alternateBackgroundColor: "#FFFFFF",
    borderWidth: tableLineBorderWidth,
    padding: {
      top: 6,
      right: 5,
      bottom: 5,
      left: 5,
    },
  },
  columnStyles: options.columnStyles ?? {},
  required: false,
  readOnly: false,
});

const decodeSvgDataUrl = (dataUrl: string) => {
  const [, metadata = "", payload = ""] =
    dataUrl.match(/^data:image\/svg\+xml([^,]*),(.*)$/) ?? [];

  if (!payload) return "";

  if (metadata.includes(";base64")) {
    try {
      return atob(payload);
    } catch {
      return "";
    }
  }

  try {
    return decodeURIComponent(payload);
  } catch {
    return "";
  }
};

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });

const convertImageDataUrlToPng = (dataUrl: string) =>
  new Promise<string>((resolve) => {
    if (typeof Image === "undefined" || typeof document === "undefined") {
      resolve("");
      return;
    }

    const imageElement = new Image();

    imageElement.addEventListener("load", () => {
      const width = imageElement.naturalWidth || imageElement.width || 64;
      const height = imageElement.naturalHeight || imageElement.height || 64;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        resolve("");
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(imageElement, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    });
    imageElement.addEventListener("error", () => resolve(""));
    imageElement.src = dataUrl;
  });

const normalizeSvgContent = (content: string) => {
  const svgStart = content.indexOf("<svg");
  if (svgStart < 0) return "";

  return content.slice(svgStart).trim();
};

const isPdfmeImageDataUrl = (dataUrl: string) =>
  dataUrl.startsWith("data:image/png") ||
  dataUrl.startsWith("data:image/jpeg") ||
  dataUrl.startsWith("data:image/jpg");

const getLogoAssets = async (logoUrl: string) => {
  const trimmedLogoUrl = logoUrl.trim();

  const fallback = {
    logoSvg: FALLBACK_LOGO_SVG,
    logoImage: TRANSPARENT_PNG,
  };

  if (!trimmedLogoUrl) return fallback;

  if (trimmedLogoUrl.startsWith("data:image/svg+xml")) {
    return {
      logoSvg: normalizeSvgContent(decodeSvgDataUrl(trimmedLogoUrl)) || FALLBACK_LOGO_SVG,
      logoImage: TRANSPARENT_PNG,
    };
  }

  if (isPdfmeImageDataUrl(trimmedLogoUrl)) {
    return {
      logoSvg: TRANSPARENT_LOGO_SVG,
      logoImage: trimmedLogoUrl,
    };
  }

  if (trimmedLogoUrl.startsWith("data:image/")) {
    const pngDataUrl = await convertImageDataUrlToPng(trimmedLogoUrl);

    return pngDataUrl
      ? {
          logoSvg: TRANSPARENT_LOGO_SVG,
          logoImage: pngDataUrl,
        }
      : fallback;
  }

  try {
    const response = await fetch(trimmedLogoUrl);
    if (!response.ok) return fallback;

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("svg") || trimmedLogoUrl.endsWith(".svg")) {
      const content = await response.text();

      return {
        logoSvg: normalizeSvgContent(content) || FALLBACK_LOGO_SVG,
        logoImage: TRANSPARENT_PNG,
      };
    }

    const dataUrl = await readBlobAsDataUrl(await response.blob());

    if (isPdfmeImageDataUrl(dataUrl)) {
      return {
        logoSvg: TRANSPARENT_LOGO_SVG,
        logoImage: dataUrl,
      };
    }

    const pngDataUrl = await convertImageDataUrlToPng(dataUrl);

    return pngDataUrl
      ? {
          logoSvg: TRANSPARENT_LOGO_SVG,
          logoImage: pngDataUrl,
        }
      : fallback;
  } catch {
    return fallback;
  }
};

const getRadarPoint = (
  index: number,
  total: number,
  ratio: number,
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const pointRadius = radius * ratio;

  return {
    x: centerX + Math.cos(angle) * pointRadius,
    y: centerY + Math.sin(angle) * pointRadius,
  };
};

const createRadarSvg = (scores: AssessmentPdfScore[], minimumScore: number) => {
  const width = 720;
  const height = 720;
  const centerX = width / 2;
  const centerY = height / 2 + 12;
  const radius = 210;
  const total = Math.max(scores.length, 3);
  const normalizedScores =
    scores.length >= 3
      ? scores
      : [
          ...scores,
          ...Array.from({ length: 3 - scores.length }, (_, index) => ({
            label: `Butir ${scores.length + index + 1}`,
            score: 0,
            maxScore: 100,
          })),
        ];

  const polygon = (ratio: number) =>
    normalizedScores
      .map((_, index) => {
        const point = getRadarPoint(index, total, ratio, centerX, centerY, radius);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      })
      .join(" ");

  const scorePoints = normalizedScores
    .map((item, index) => {
      const ratio = Math.max(0, Math.min(1, item.score / item.maxScore));
      const point = getRadarPoint(index, total, ratio, centerX, centerY, radius);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");

  const minPoints = normalizedScores
    .map((item, index) => {
      const ratio = Math.max(0, Math.min(1, minimumScore / item.maxScore));
      const point = getRadarPoint(index, total, ratio, centerX, centerY, radius);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    })
    .join(" ");

  const axis = normalizedScores
    .map((_, index) => {
      const point = getRadarPoint(index, total, 1, centerX, centerY, radius);
      return `<line x1="${centerX}" y1="${centerY}" x2="${point.x.toFixed(
        1,
      )}" y2="${point.y.toFixed(1)}" stroke="${BORDER}" stroke-width="1.5" />`;
    })
    .join("");

  const labels = normalizedScores
    .map((item, index) => {
      const point = getRadarPoint(index, total, 1.32, centerX, centerY, radius);
      const anchor =
        Math.abs(point.x - centerX) < 24
          ? "middle"
          : point.x > centerX
            ? "start"
            : "end";
      return `<text x="${point.x.toFixed(1)}" y="${point.y.toFixed(
        1,
      )}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Arial, sans-serif">
        <tspan x="${point.x.toFixed(1)}" dy="-14" font-size="36" font-weight="700" fill="${BLACK}">${item.score}/${item.maxScore}</tspan>
        <tspan x="${point.x.toFixed(1)}" dy="40" font-size="34" font-weight="600" fill="${MUTED}">${escapeXml(
          truncate(item.label, 18),
        )}</tspan>
      </text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF"/>
    ${[0.25, 0.5, 0.75, 1]
      .map(
        (ratio) =>
          `<polygon points="${polygon(
            ratio,
          )}" fill="none" stroke="${BORDER}" stroke-width="1.5"/>`,
      )
      .join("")}
    ${axis}
    <polygon points="${minPoints}" fill="${CHART_SOFT}" fill-opacity="0.42" stroke="${CHART_SOFT}" stroke-width="2"/>
    <polygon points="${scorePoints}" fill="${CHART}" fill-opacity="0.82" stroke="${CHART}" stroke-width="3"/>
    ${labels}
  </svg>`;
};

const buildTemplate = (organizationName: string): Template => {
  const schemas: any[] = [
    fieldImage("logo-image", 20, 20, 20.11, 20.11),
    fieldSvg("logo-lembaga", 20, 20, 20.11, 20.11),
    fieldText("judul-rapor", 41, 20, 128, 14, {
      fontSize: 30,
      alignment: "center",
      lineHeight: 1,
    }),
    fieldText("nama-lembaga", 49, 35.74, 112, 8, {
      fontSize: 16,
      alignment: "center",
      lineHeight: 1,
    }),
    fieldLine("divider", 20, 48, 170, BLACK),
    fieldText("namaLabel", 20, 54, 32, 6, {
      content: "Nama:",
      fontSize: 13,
      readOnly: true,
    }),
    fieldText("nama-anak", 54, 54, 56, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("birthDateLabel", 20, 64, 32, 6, {
      content: "Tanggal Lahir:",
      fontSize: 13,
      readOnly: true,
    }),
    fieldText("tanggal-lahir", 54, 64, 56, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("label-guru", 20, 74, 32, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("guru", 54, 74, 56, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("nama-tingkat", 114, 54, 32, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("tingkat", 145.75, 54, 44, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("tahunAjaranLabel", 114, 64, 32, 6, {
      content: "Tahun Ajaran:",
      fontSize: 13,
      readOnly: true,
    }),
    fieldText("tahun-ajaran", 145.75, 64, 44, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldText("semesterLabel", 114, 74, 32, 6, {
      content: "Semester:",
      fontSize: 13,
      readOnly: true,
    }),
    fieldText("semester", 145.75, 74, 44, 6, {
      fontSize: 13,
      lineHeight: 1,
    }),
    fieldSvg("radar-chart", 14, 82, 90, 90),
    fieldTable(
      "tabel-nilai",
      108,
      96.12,
      82,
      56,
      ["Butir Penilaian", "Nilai"],
      [72, 28],
      {
        columnStyles: {
          alignment: {
            "0": "left",
            "1": "center",
          },
        },
      },
    ),
    fieldText("attendanceLabel", 20, 178, 42, 6, {
      content: "**Tabel Kehadiran:**",
      fontSize: 13,
      readOnly: true,
      bold: true,
    }),
    fieldTable(
      "tabel-kehadiran",
      20,
      186,
      80,
      46.76,
      ["Status", "Jumlah"],
      [72, 28],
      {
        showHead: false,
        columnStyles: {
          alignment: {
            "0": "left",
            "1": "center",
          },
        },
      },
    ),
    fieldText("catatanLabel", 110, 178, 42, 6, {
      content: "**Catatan:**",
      fontSize: 13,
      readOnly: true,
      bold: true,
    }),
    fieldRect("kotakCatatan", 110, 186, 80, 37.5),
    fieldText("isi-catatan", 114, 189, 71.97, 29.9, {
      fontSize: 13,
      lineHeight: 1.2,
    }),
  ];

  return {
    basePdf: {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      padding: [0, 0, 0, 0],
      staticSchema: [
        fieldLine("footerLine", 20, 279, 170, "#999999"),
        fieldText("footerInfo", 20, 282, 122.51, 10, {
          content: `Rapor pembelajaran ${organizationName}`,
          fontSize: 13,
          verticalAlignment: "middle",
          readOnly: true,
        }),
        fieldText("pageNumber", 145, 282, 45, 10, {
          content: "Hal {currentPage} dari {totalPages}",
          fontSize: 13,
          alignment: "right",
          verticalAlignment: "middle",
          readOnly: true,
        }),
      ],
    },
    schemas: [schemas],
  };
};

const buildInput = (
  row: AssessmentPdfReportRow,
  logoSvg: string,
  logoImage: string,
) => {
  const input: Record<string, string> = {
    "logo-image": logoImage,
    "logo-lembaga": logoSvg,
    "judul-rapor": row.assessmentName,
    "nama-lembaga": row.organizationName,
    "nama-anak": row.studentName,
    "tanggal-lahir": row.birthDateLabel,
    "label-guru": `${row.mentorLabel}:`,
    guru: row.mentorName,
    "nama-tingkat": `${row.levelLabel}:`,
    tingkat: row.levelName,
    "tahun-ajaran": row.academicYearLabel,
    semester: row.semesterLabel,
    "tabel-kehadiran": JSON.stringify([
      ["Hadir", String(row.attendancePresent)],
      ["Izin", String(row.attendancePermission)],
      ["Alfa", String(row.attendanceAbsent)],
    ]),
    "radar-chart": createRadarSvg(row.scores, row.minimumScore),
    "tabel-nilai": JSON.stringify(
      row.scores.map((score) => [
        score.label,
        `${score.score}/${score.maxScore}`,
      ]),
    ),
    "isi-catatan": row.notes || "Tidak ada catatan tambahan.",
  };

  return input;
};

export const generateAssessmentPdfReport = async (
  rows: AssessmentPdfReportRow[],
  fileName: string,
  onProgress?: (progress: AssessmentPdfProgress) => void,
) => {
  const template = buildTemplate(rows[0]?.organizationName ?? "");
  const { logoSvg, logoImage } = await getLogoAssets(rows[0]?.logoUrl ?? "");
  const inputs: Record<string, string>[] = [];

  for (const [index, row] of rows.entries()) {
    onProgress?.({
      current: index + 1,
      total: rows.length,
      message: `Menyiapkan halaman ${index + 1}/${rows.length}`,
    });
    inputs.push(buildInput(row, logoSvg, logoImage));
    await waitFrame();
  }

  onProgress?.({
    current: rows.length,
    total: rows.length,
    message: "Membuat file PDF...",
  });

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

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  onProgress?.({
    current: rows.length,
    total: rows.length,
    message: "PDF selesai dibuat.",
  });
};
