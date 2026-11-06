import * as XLSX from "xlsx";
import Papa from "papaparse";

export function parseFileToRows(
  buffer: Buffer,
  mimetype: string,
  originalFileName: string,
): Record<string, string>[] {
  const isCsv =
    mimetype === "text/csv" ||
    mimetype === "application/vnd.ms-excel" ||
    originalFileName.toLowerCase().endsWith(".csv");

  if (isCsv) {
    const text = buffer.toString("utf-8").replace(/^\uFFFF/, '');
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data;
  }
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
}
