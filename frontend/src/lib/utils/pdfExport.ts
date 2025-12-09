/* eslint-disable @typescript-eslint/no-explicit-any */
import mermaid from "mermaid";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type {
  CostByResource,
  MinimalProject,
  MinimalWbsItem,
} from "@/types/project.type";

/* ---------- Company Branding ---------- */
const COMPANY_NAME = "ACEA Managed Services and Consulting, Inc.";
const LOGO_URL = "/amsci-logo.png";

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function exportProjectToPdf(opts: {
  filename?: string;
  project: MinimalProject;
  wbs: MinimalWbsItem[];
  byResource: CostByResource[];
  ganttSvgSelector?: string; // default '#pc-gantt svg'
  ganttMermaidCode?: string | null;
}) {
  const timestamp = Date.now();
  const baseName = "project-charter";

  const {
    filename = `${(opts.project.name || baseName).replace(/\s+/g, "-")}-${timestamp}.pdf`,
    project,
    wbs,
    byResource,
    ganttSvgSelector = "#pc-gantt svg",
    ganttMermaidCode = null,
  } = opts;

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "p" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;

  /* ---------------- Header / Footer ---------------- */
  const headerHeight = 60;
  const headerPaddingX = 16;
  const headerBg = [60, 63, 65] as const;

  const footerHeight = 24;
  const footerY = (ph: number) => ph - footerHeight + 8;

  const generatedOn = new Date().toLocaleString();

  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await urlToDataUrl(LOGO_URL);
  } catch (err) {
    console.warn(err);
  }

  function drawHeader(currentPdf: jsPDF) {
    const pw = currentPdf.internal.pageSize.getWidth();
    // band
    currentPdf.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    currentPdf.rect(0, 0, pw, headerHeight, "F");

    // logo
    if (logoDataUrl) {
      try {
        const props = currentPdf.getImageProperties(logoDataUrl);
        const maxLogoH = headerHeight - 20;
        const maxLogoW = 160;
        const scale = Math.min(maxLogoW / props.width, maxLogoH / props.height);
        const w = props.width * scale;
        const h = props.height * scale;
        currentPdf.addImage(
          logoDataUrl,
          "PNG",
          headerPaddingX,
          (headerHeight - h) / 2,
          w,
          h,
          undefined,
          "FAST",
        );
      } catch (err) {
        console.warn(err);
      }
    }

    // company name (right)
    currentPdf.setTextColor(255);
    currentPdf.setFont("helvetica", "bold");
    currentPdf.setFontSize(12);
    currentPdf.text(COMPANY_NAME, pw - headerPaddingX, headerHeight / 2 + 4, {
      align: "right",
    });

    currentPdf.setTextColor(0);
  }

  function drawFooter(currentPdf: jsPDF, pageIndex: number, pageCount: number) {
    const pw = currentPdf.internal.pageSize.getWidth();
    const ph = currentPdf.internal.pageSize.getHeight();

    // text
    currentPdf.setFont("helvetica", "normal");
    currentPdf.setFontSize(9);
    currentPdf.setTextColor(80);
    currentPdf.text(`Generated on: ${generatedOn}`, margin, footerY(ph));
    currentPdf.text(
      `Page ${pageIndex} of ${pageCount}`,
      pw - margin,
      footerY(ph),
      {
        align: "right",
      },
    );
    currentPdf.setTextColor(0);
  }

  // Start layout below the header
  let y = margin + headerHeight;

  /* ---------- Project name ---------- */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(project.name || "Project Charter", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const created = project.startDate || new Date().toISOString().slice(0, 10);
  pdf.text(`Start date: ${created}`, margin, y);
  y += 16;
  if (project.sponsor) {
    pdf.text(`Sponsor: ${project.sponsor}`, margin, y);
    y += 16;
  }
  if (project.manager) {
    pdf.text(`Manager: ${project.manager}`, margin, y);
    y += 16;
  }

  y += 8;

  /* ---------- Section I: Project Information ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin + headerHeight;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("I. Project information", margin, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  y += 10;

  const detailBlocks: { label: string; value?: string }[] = [
    { label: "Business need/Problem", value: project.businessNeed },
    { label: "Project goal", value: project.projectGoal },
    { label: "Measurable objectives", value: project.measurableObjectives },
    { label: "In-scope deliverables", value: project.deliverables },
    { label: "Out-of-scope items", value: project.outOfScope },
  ];

  const wrapText = (text: string, widthPt: number) =>
    pdf.splitTextToSize(text, widthPt) as string[];

  for (const b of detailBlocks) {
    // if (!b.value) continue;
    pdf.setFont("helvetica", "bold");
    pdf.text(`${b.label}:`, margin, y);
    y += 14;

    if (!b.value) continue;
    pdf.setFont("helvetica", "normal");
    const lines = wrapText(b.value, pageWidth - margin * 2);
    const blockHeight = lines.length * 14;

    if (y + blockHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin + headerHeight;
    }

    lines.forEach((line) => {
      pdf.text(line, margin, y);
      y += 14;
    });
    y += 8;
  }
  y += 14;

  /* ---------- Section II: WBS Table ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin + headerHeight;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("II. High-Level WBS with Estimated Effort", margin, y);
  y += 10;

  const wbsRows: RowInput[] = wbs.map((r) => {
    const total = (Number(r.fxMandays) || 0) + (Number(r.abapMandays) || 0);
    return [
      r.wbsId || "",
      r.activity || "",
      r.fxStartDate || "",
      r.fxMandays ? String(r.fxMandays) : "",
      r.abapStartDate || "",
      r.abapMandays ? String(r.abapMandays) : "",
      total ? String(total) : "",
    ];
  });

  const fxTotal = wbs.reduce((s, r) => s + (Number(r.fxMandays) || 0), 0);
  const abapTotal = wbs.reduce((s, r) => s + (Number(r.abapMandays) || 0), 0);
  const allTotal = fxTotal + abapTotal;

  const totalsRow: RowInput = [
    "Total",
    "",
    "",
    String(fxTotal),
    "",
    String(abapTotal),
    String(allTotal),
  ];
  const bodyWithTotalMandays = [...wbsRows, totalsRow];

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [
      [
        "WBS ID",
        "Activity",
        "FX Start",
        "FX md",
        "ABAP Start",
        "ABAP md",
        "Total md",
      ],
    ],
    body: bodyWithTotalMandays,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [60, 63, 65], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 100 },
      2: { cellWidth: 80 },
      3: { cellWidth: 70, halign: "right" },
      4: { cellWidth: 80 },
      5: { cellWidth: 70, halign: "right" },
      6: { cellWidth: 70, halign: "right" },
    },
    didParseCell(data) {
      const isTotalsRow =
        data.section === "body" && data.row.index === wbsRows.length;
      if (isTotalsRow) data.cell.styles.fontStyle = "bold";
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 16;

  /* ---------- Section III: Cost Computation ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin + headerHeight;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("III. Cost Computation", margin, y);
  y += 10;

  const costBody: RowInput[] = byResource.map((r) => [
    r.resourceName,
    r.resourceTitle,
    fmt(r.rate),
    r.mandays ? String(r.mandays) : "",
    fmt(r.subtotal),
  ]);
  const totalRate = byResource.reduce((s, r) => s + (Number(r.rate) || 0), 0);
  const totalMandays = byResource.reduce(
    (s, r) => s + (Number(r.mandays) || 0),
    0,
  );
  const totalCost = byResource.reduce(
    (s, r) => s + (Number(r.subtotal) || 0),
    0,
  );

  const totalRows: RowInput[] = [
    ["Total", "", fmt(totalRate), String(totalMandays), fmt(totalCost)],
  ];
  const bodyWithTotals = [...costBody, ...totalRows];

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Resource", "Title", "Rate", "Mandays", "Subtotal"]],
    body: bodyWithTotals,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [60, 63, 65], textColor: 255 },
    didParseCell(data) {
      const isBody = data.section === "body";
      const isTotalRow = isBody && data.row.index >= costBody.length;
      if (isTotalRow) data.cell.styles.fontStyle = "bold";
    },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { cellWidth: 160 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 16;
  y += 12;

  /* ---------- Section IV: Gantt Chart (Mermaid) ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin + headerHeight;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("IV. Gantt Chart", margin, y);
  y += 12;

  // --- Normalize an SVG string  ---
  const normalizeSvg = (svgText: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      const svg = doc.documentElement as unknown as SVGSVGElement;
      const hasW = svg.hasAttribute("width");
      const hasH = svg.hasAttribute("height");
      if (!hasW || !hasH) {
        const vb = svg.getAttribute("viewBox");
        if (vb) {
          const [, , vbW, vbH] = vb.split(/\s+/).map(Number);
          if (!hasW) svg.setAttribute("width", `${vbW || 800}`);
          if (!hasH) svg.setAttribute("height", `${vbH || 400}`);
        } else {
          if (!hasW) svg.setAttribute("width", "800");
          if (!hasH) svg.setAttribute("height", "400");
        }
      }
      if (!svg.getAttribute("xmlns")) {
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      return new XMLSerializer().serializeToString(svg);
    } catch {
      return svgText;
    }
  };

  // --- Convert SVG text into a PNG data URL ---
  async function svgTextToPngDataUrl(
    svgText: string,
    scale = 2,
  ): Promise<string> {
    const normalized = normalizeSvg(svgText);
    const blob = new Blob([normalized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    const width = img.width || 800;
    const height = img.height || 400;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width * scale));
    canvas.height = Math.max(1, Math.floor(height * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error("Canvas 2D not available");
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0);

    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/png");
  }

  // --- If Mermaid code is provided ---
  let svgText: string | null = null;

  if (ganttMermaidCode && ganttMermaidCode.trim().length > 0) {
    // Initialize Mermaid
    // mermaid.initialize({
    //   startOnLoad: false,
    //   securityLevel: "loose",
    //   theme: "default",
    //   gantt: { axisFormat: "%b %d" },
    // });
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "neutral",
      gantt: {
        axisFormat: "%b %d",
        barHeight: 60,
        barGap: 10,
        useWidth: 800,
      },
      themeVariables: {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: "16px",
        ganttTitleHeight: 50,
      },
    });

    // Render to SVG string
    const { svg } = await mermaid.render(
      "pdf_gantt_" + Date.now().toString(36),
      ganttMermaidCode,
    );
    svgText = svg;
  } else {
    const node = document.querySelector<SVGSVGElement>(ganttSvgSelector);
    if (node) svgText = node.outerHTML;
  }

  // Draw the Gantt chart, scaled to fit both width & remaining height
  if (svgText) {
    const dataUrl = await svgTextToPngDataUrl(svgText, 2);
    const imgProps = pdf.getImageProperties(dataUrl);

    const availableW = pageWidth - 2 * margin;

    // If not enough vertical space, start a new page
    const remainingH = pageHeight - margin - footerHeight - y - 8;
    const minUsefulH = 240;
    if (remainingH < minUsefulH) {
      pdf.addPage();
      y = margin + headerHeight;
    }

    // Fit to current page inc footer
    const maxDrawableH = pageHeight - margin - footerHeight - y - 8;
    const scaleW = availableW / imgProps.width;
    const desiredHeight = imgProps.height * scaleW;
    const drawH = Math.min(Math.max(desiredHeight, minUsefulH), maxDrawableH);
    const drawW = availableW; // fill width

    pdf.addImage(
      dataUrl,
      "PNG",
      margin,
      y + 8,
      drawW,
      drawH,
      undefined,
      "FAST",
    );
    y += drawH + 20;
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100);
    pdf.setFontSize(10);
    pdf.text("Gantt diagram not available.", margin, y + 10);
    pdf.setTextColor(0);
    y += 28;
  }

  /* ---------- Section V: Authorization ---------- */
  y += 20;

  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin + headerHeight;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("V. Authorization", margin, y);
  y += 10;

  const authRows: RowInput[] = [
    ["Project Management Office", "", "", ""],
    ["Project Sponsor", "", "", ""],
  ];

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Role", "Name", "Signature", "Date"]],
    body: authRows,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [60, 63, 65], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { cellWidth: 140 },
      2: { cellWidth: 140 },
      3: { cellWidth: 90, halign: "center" },
    },
  });
  y = (pdf as any).lastAutoTable.finalY + 16;

  /* ---------- Paint header & footer on all pages ---------- */
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    drawHeader(pdf);
    drawFooter(pdf, i, pageCount);
  }

  pdf.save(filename);
}
