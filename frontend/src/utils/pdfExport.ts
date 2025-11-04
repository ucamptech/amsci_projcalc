/* eslint-disable @typescript-eslint/no-explicit-any */
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

async function svgElementToPngDataUrl(
  svgEl: SVGSVGElement,
  scale = 2,
): Promise<string> {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = "async";
  img.src = url;

  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = (e) => rej(e);
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(img, 0, 0);

  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/png");
}

export async function exportProjectCharterPdfStructured(opts: {
  filename?: string;
  project: MinimalProject;
  wbs: MinimalWbsRow[];
  byResource: MinimalByResource[];
  ganttSvgSelector?: string; // default '#pc-gantt svg'
}) {
  const timestamp = Date.now();
  const baseName = "project-charter";

  const {
    filename = `${(opts.project.name || baseName).replace(/\s+/g, "-")}-${timestamp}.pdf`,
    project,
    wbs,
    byResource,
    ganttSvgSelector = "#pc-gantt svg",
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
  pdf.text(`Date: ${created}`, margin, y);
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

  /* ---------- Section I: Project Details ---------- */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("I. Project Details", margin, y);
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

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["WBS ID", "Activity", "FX md", "ABAP md", "Total md"]],
    body: wbsRows,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 240 } },
  });
  y = (pdf as any).lastAutoTable.finalY + 16;

  /* ---------- Section III: Cost Summary ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("III. Cost Summary", margin, y);
  y += 10;

  const costBody: RowInput[] = byResource.map((r) => [
    r.resourceName,
    r.resourceTitle,
    fmt(r.rate),
    String(r.mandays),
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

  autoTable(pdf, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Resource", "Title", "Rate", "Mandays", "Subtotal"]],
    body: costBody,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    // foot: [["", "Total", fmt(totalRate), String(totalMandays), fmt(totalCost)]],
    foot: [
      ["", "", "", "Total Rate", fmt(totalRate)],
      ["", "", "", "Total Mandays", String(totalMandays)],
      ["", "", "", "Total Cost", fmt(totalCost)],
    ],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
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

  /* ---------- Section IV: Gantt (Mermaid) ---------- */
  if (y > pageHeight - margin - 80) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("IV. Gantt", margin, y);
  y += 12;

  // Helper: decide if an <svg> is truly renderable (not empty/placeholder)
  function hasRenderableSvg(svg: SVGSVGElement): boolean {
    // Must be an <svg>
    if (!svg || svg.tagName.toLowerCase() !== "svg") return false;

    // Has content
    const inner = (svg.innerHTML || "").replace(/\s+/g, "");
    if (inner.length < 20) return false;

    // Size must be non-zero
    const vb = svg.viewBox?.baseVal;
    const width = vb && vb.width ? vb.width : (svg as any).clientWidth || 0;
    const height = vb && vb.height ? vb.height : (svg as any).clientHeight || 0;
    if (width <= 0 || height <= 0) return false;

    // Mermaid error placeholders often have <div class="error"> outside SVG;
    // if the SVG exists but has just one text node or no <g>, treat as not renderable.
    const hasG = svg.querySelector("g") !== null;
    return hasG;
  }

  const svgEl = document.querySelector(
    ganttSvgSelector,
  ) as SVGSVGElement | null;

  if (svgEl && hasRenderableSvg(svgEl)) {
    const pngDataUrl = await svgElementToPngDataUrl(svgEl, 2);
    const imgWidth = pageWidth - margin * 2;
    const viewBox = svgEl.viewBox.baseVal;
    const svgW =
      viewBox && viewBox.width ? viewBox.width : svgEl.clientWidth || 800;
    const svgH =
      viewBox && viewBox.height ? viewBox.height : svgEl.clientHeight || 400;
    const ratio = imgWidth / svgW;
    let imgHeight = svgH * ratio;

    if (y + imgHeight > pageHeight - margin) {
      const maxH = pageHeight - margin - y;
      if (maxH > 120) imgHeight = maxH;
      else {
        pdf.addPage();
        y = margin;
      }
    }

    pdf.addImage(
      pngDataUrl,
      "PNG",
      margin,
      y,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100);
    pdf.setFontSize(10);
    pdf.text("Gantt diagram not available (no SVG found).", margin, y + 10);
    pdf.setTextColor(0);
  }

  pdf.save(filename);
}
