import type {
  CostByResource,
  ProjectInit,
  SignersInit,
  WBSItem,
} from "@/types/project.type";
import { DEFAULT_ACTIVITIES, DEFAULT_RESOURCES } from "../constants/project";

import ExcelJS from "exceljs";

type Props = {
  project: ProjectInit;
  wbs: WBSItem[];
  signers: SignersInit[];
  byResource: CostByResource[];
};

export async function exportProjectToExcel({
  project,
  wbs,
  signers,
  byResource,
}: Props): Promise<void> {
  // Create workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Charter App";
  wb.created = new Date();

  // One worksheet only
  const ws = wb.addWorksheet("Project Charter");

  ws.columns = [
    { header: "", key: "c1", width: 28 }, // A
    { header: "", key: "c2", width: 60 }, // B
    { header: "", key: "c3", width: 60 }, // C
    { header: "", key: "c4", width: 28 }, // D
    { header: "", key: "c5", width: 22 }, // E
    { header: "", key: "c6", width: 16 }, // F
    { header: "", key: "c7", width: 22 }, // G
    { header: "", key: "c8", width: 16 }, // H
  ] as ExcelJS.Column[];

  const setRowStyles = (
    row: ExcelJS.Row,
    opts: { bold?: boolean } = {},
  ): void => {
    row.alignment = { vertical: "middle", wrapText: true };
    if (opts.bold) row.font = { bold: true };
  };

  const addSpacer = (n = 1): void => {
    for (let i = 0; i < n; i++) ws.addRow([]);
  };

  // -----------------------------
  // SECTION I: Initiation (A–C)
  // -----------------------------
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = "I. Project Charter (Initiation)";
  ws.getCell("A1").font = { bold: true, size: 14 };
  addSpacer();

  const charterRows: Array<[string, string, string]> = [
    [
      "Project Name",
      project.name ?? "",
      "The formal, unique name of the project.",
    ],
    [
      "Project Sponsor",
      project.sponsor ?? "",
      "The individual who authorizes the project and provides financial resources. (Required Sign-off)",
    ],
    [
      "Project Manager",
      project.manager ?? "",
      "The individual responsible for managing the project to meet its objectives.",
    ],
    [
      "Creation Date / Version",
      `${project.startDate ?? ""} / ${project.version ?? ""}`,
      "Date the charter was created/last revised (e.g., v1.0).",
    ],
    [
      "Business Need/Problem",
      project.businessNeed ?? "",
      "Clearly state the problem or opportunity the project addresses. (Why are we doing this?)",
    ],
    [
      "Project Goal",
      project.projectGoal ?? "",
      "A high-level statement of what the project will achieve. (e.g., To implement a new Data Extraction Tool.)",
    ],
    [
      "Measurable Objectives",
      project.measurableObjectives ?? "",
      "List 3–5 SMART objectives. (e.g., Achieve 99% data accuracy on migrated records.)",
    ],
    [
      "In-Scope Deliverables",
      project.deliverables ?? "",
      "Major, tangible outputs (e.g., Fully tested DM Tool; End-User Training Materials; Formal Data Migration Sign-off.)",
    ],
    [
      "Out-of-Scope Items",
      project.outOfScope ?? "",
      "Clearly state what is not included to prevent scope creep.",
    ],
  ];

  const startRow = ws.rowCount + 1;
  charterRows.forEach((r) => {
    const row = ws.addRow([r[0], r[1], r[2]]);
    setRowStyles(row);
  });

  const endRow = ws.rowCount;
  for (let i = startRow; i <= endRow; i++) {
    const descCell = ws.getCell(`C${i}`);
    descCell.font = { italic: true };
    descCell.alignment = { vertical: "middle", wrapText: false };
  }

  addSpacer(2);

  // -----------------------------
  // SECTION II: WBS Breakdown (A–F)
  // -----------------------------
  const wbsTitleRowNum = ws.rowCount + 1;
  ws.mergeCells(`A${wbsTitleRowNum}:H${wbsTitleRowNum}`);
  ws.getCell(`A${wbsTitleRowNum}`).value =
    "II. High-Level WBS Breakdown with Estimated Effort";
  ws.getCell(`A${wbsTitleRowNum}`).font = { bold: true, size: 14 };
  addSpacer();

  const wbsHeader = ws.addRow([
    "WBS ID",
    "Activity",
    "FX Resource",
    "FX Start Date",
    "Mandays",
    "ABAP Resource",
    "ABAP Start Date",
    "Mandays",
  ]);
  setRowStyles(wbsHeader, { bold: true });

  const resJson = DEFAULT_RESOURCES;

  const getResourceName = (id: number | null | undefined): string => {
    const numId = typeof id === "string" ? Number(id) : id;
    const found = resJson.find((f) => f.id === numId);
    return found ? found.name : (id?.toString() ?? "");
  };

  const getActivityName = (activityId?: number | null): string => {
    if (!activityId) return "";
    const found = DEFAULT_ACTIVITIES.find((a) => a.id === activityId);
    return found?.activity ?? "";
  };

  const wbsStartRow = ws.rowCount + 1;

  wbs.forEach((r) => {
    const fxMandays = Number.isFinite(r.fxMandays) ? r.fxMandays : 0;
    const abapMandays = Number.isFinite(r.abapMandays) ? r.abapMandays : 0;

    const row = ws.addRow([
      r.wbsId ?? "",
      getActivityName(r.activityId),
      getResourceName(r.fxResourceId),
      r.fxStartDate ?? "",
      fxMandays,
      getResourceName(r.abapResourceId),
      r.abapStartDate ?? "",
      abapMandays,
    ]);

    row.getCell(5).numFmt = "0.00";
    row.getCell(8).numFmt = "0.00";
    setRowStyles(row);
  });

  const wbsEndRow = ws.rowCount;

  const wbsTotal = ws.addRow([
    "TOTAL ESTIMATED EFFORT",
    "",
    "FX Total",
    "",
    { formula: `SUM(E${wbsStartRow}:E${wbsEndRow})`, result: 0 },
    "ABAP Total",
    "",
    { formula: `SUM(H${wbsStartRow}:H${wbsEndRow})`, result: 0 },
  ]);
  setRowStyles(wbsTotal, { bold: true });
  wbsTotal.getCell(5).numFmt = "0.00";
  wbsTotal.getCell(8).numFmt = "0.00";

  addSpacer(2);

  // -----------------------------
  // SECTION III: Cost Breakdown (A-E)
  // -----------------------------
  const compTitleRowNum = ws.rowCount + 1;
  ws.mergeCells(`A${compTitleRowNum}:E${compTitleRowNum}`);
  ws.getCell(`A${compTitleRowNum}`).value = "III. Cost Breakdown";
  ws.getCell(`A${compTitleRowNum}`).font = { bold: true, size: 14 };
  addSpacer();

  const compHeader = ws.addRow([
    "Resource",
    "Title",
    "Rate",
    "Mandays",
    "Total",
  ]);
  setRowStyles(compHeader, { bold: true });

  const compStartRow = ws.rowCount + 1;

  byResource.forEach((r) => {
    const currentRow = ws.rowCount + 1;
    const row = ws.addRow([
      r.resourceName ?? "",
      r.resourceTitle ?? "",
      r.rate ?? "",
      r.mandays ?? "",
      r.subtotal ?? "",
    ]);

    // Apply number formats
    row.getCell(3).numFmt = '"₱"#,##0.00'; // rate
    row.getCell(4).numFmt = "0.00"; // mandays
    row.getCell(5).numFmt = '"₱"#,##0.00'; // total

    row.getCell(5).value = {
      formula: `C${currentRow}*D${currentRow}`,
      result: (r.rate ?? 0) * (r.mandays ?? 0),
    };

    setRowStyles(row);
  });
  const compEndRow = ws.rowCount;

  const totalRow = ws.addRow([
    "TOTAL",
    "",
    { formula: `SUM(C${compStartRow}:C${compEndRow})`, result: 0 },
    { formula: `SUM(D${compStartRow}:D${compEndRow})`, result: 0 },
    { formula: `SUM(E${compStartRow}:E${compEndRow})`, result: 0 },
  ]);
  setRowStyles(totalRow, { bold: true });

  totalRow.getCell(3).numFmt = '"₱"#,##0.00';
  totalRow.getCell(4).numFmt = "0.00";
  totalRow.getCell(5).numFmt = '"₱"#,##0.00';

  addSpacer(2);

  // -----------------------------
  // SECTION IV: Authorization (A–D)
  // -----------------------------
  const authTitleRowNum = ws.rowCount + 1;
  ws.mergeCells(`A${authTitleRowNum}:D${authTitleRowNum}`);
  ws.getCell(`A${authTitleRowNum}`).value = "IV. Authorization";
  ws.getCell(`A${authTitleRowNum}`).font = { bold: true, size: 14 };
  addSpacer();

  const authHeader = ws.addRow(["Role", "Name", "Signature", "Date"]);
  setRowStyles(authHeader, { bold: true });

  signers.forEach((s) => {
    const row = ws.addRow([
      s.role ?? "",
      s.name ?? "",
      s.signature ?? "",
      s.date ?? "",
    ]);
    setRowStyles(row);
  });

  // -----------------------------
  // BORDERS & STYLES
  // -----------------------------
  const thinBorder: Partial<ExcelJS.Border> = {
    style: "thin",
    color: { argb: "FFD1D5DB" },
  };

  const addHeaderBorder = (
    row: ExcelJS.Row,
    fromCol: number,
    toCol: number,
  ): void => {
    for (let c = fromCol; c <= toCol; c++) {
      const cell = ws.getRow(row.number).getCell(c);
      cell.border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: thinBorder,
      } as ExcelJS.Borders;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" }, // subtle gray
      } as ExcelJS.Fill;
    }
  };

  addHeaderBorder(wbsHeader, 1, 8);
  addHeaderBorder(authHeader, 1, 4);

  ws.eachRow((row) => {
    row.alignment = { vertical: "middle", wrapText: true };
  });

  // -----------------------------
  // SAVE FILE
  // -----------------------------
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `project-charter-${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
