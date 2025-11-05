/* eslint-disable @typescript-eslint/no-explicit-any */
import mermaid from "mermaid";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

export type MinimalProject = {
  name?: string;
  sponsor?: string;
  manager?: string;
  creationDate?: string | null;
  businessNeed?: string;
  projectGoal?: string;
  measurableObjectives?: string;
  deliverables?: string;
  outOfScope?: string;
};

export type MinimalWbsRow = {
  wbsId?: string;
  activity?: string;
  fxResourceId?: string | number | "";
  fxMandays?: number;
  abapResourceId?: string | number | "";
  abapMandays?: number;
};

export type MinimalByResource = {
  resourceId: number;
  resourceName: string;
  resourceTitle: string;
  rate: number;
  mandays: number;
  subtotal: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export async function exportProjectCharterPdfStructured(opts: {
  filename?: string;
  project: MinimalProject;
  wbs: MinimalWbsRow[];
  byResource: MinimalByResource[];
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

  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "p" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  let y = margin;

  /* ---------- Title ---------- */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(project.name || "Project Charter", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const created = project.creationDate || new Date().toISOString().slice(0, 10);
  pdf.text(`Start Date: ${created}`, margin, y);
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
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("I. Project Information", margin, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  y += 10;

  const detailBlocks: { label: string; value?: string }[] = [
    { label: "Business Need", value: project.businessNeed },
    { label: "Project Goal", value: project.projectGoal },
    { label: "Measurable Objectives", value: project.measurableObjectives },
    { label: "Deliverables (In Scope)", value: project.deliverables },
    { label: "Out of Scope", value: project.outOfScope },
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
      y = margin;
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
    y = margin;
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
      r.fxMandays ? String(r.fxMandays) : "",
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
    String(fxTotal),
    String(abapTotal),
    String(allTotal),
  ];
  const bodyWithTotalMandays = [...wbsRows, totalsRow];

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["WBS ID", "Activity", "FX md", "ABAP md", "Total md"]],
    body: bodyWithTotalMandays,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 240 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
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
    y = margin;
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
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    // foot: [["", "Total", fmt(totalRate), String(totalMandays), fmt(totalCost)]],
    // foot: [
    //   ["", "", "", "Total Rate", fmt(totalRate)],
    //   ["", "", "", "Total Mandays", String(totalMandays)],
    //   ["", "", "", "Total Cost", fmt(totalCost)],
    // ],
    // footStyles: {
    //   fillColor: [255, 255, 255],
    //   textColor: [0, 0, 0],
    //   fontStyle: "bold",
    // },
    didParseCell(data) {
      const isBody = data.section === "body";
      const isTotalRow = isBody && data.row.index >= costBody.length;
      if (isTotalRow) {
        data.cell.styles.fontStyle = "bold";
      }
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
    y = margin;
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
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "default",
      gantt: { axisFormat: "%b %d" },
    });

    // Render to SVG string
    const { svg } = await mermaid.render(
      "pdf_gantt_" + Date.now().toString(36),
      ganttMermaidCode,
    );
    svgText = svg;
  } else {
    // Fallback: query a live SVG in the DOM if there is one
    const node = document.querySelector<SVGSVGElement>(ganttSvgSelector);
    if (node) svgText = node.outerHTML;
  }

  if (svgText) {
    const dataUrl = await svgTextToPngDataUrl(svgText, 2);
    const imgProps = pdf.getImageProperties(dataUrl);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const availableW = pageWidth - 2 * margin;
    const scale = availableW / imgProps.width;

    pdf.addImage(
      dataUrl,
      "PNG",
      margin,
      y + 8,
      availableW,
      imgProps.height * scale,
      undefined,
      "FAST",
    );
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100);
    pdf.setFontSize(10);
    pdf.text("Gantt diagram not available.", margin, y + 10);
    pdf.setTextColor(0);
  }

  pdf.save(filename);
}
