import { google } from "googleapis";
import * as fs from "fs";
import { GSheetsWriteRangeInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gsheets_write_range",
  description:
    "Write many cells of a Google Spreadsheet in one call. mode 'update' overwrites the block starting at range's top-left cell; mode 'append' adds the rows after the last filled row of the table found at range (e.g. 'Sheet1!A1'). Values come either inline as a 2D array (rows of cells) or from a local CSV file (csvPath, comma-separated, RFC 4180 quoting). Values are entered as if typed by a user (USER_ENTERED): numbers, dates and formulas are parsed.",
  inputSchema: {
    type: "object",
    properties: {
      spreadsheetId: {
        type: "string",
        description: "ID of the spreadsheet",
      },
      range: {
        type: "string",
        description:
          "A1 range: top-left cell for 'update' (e.g. 'Sheet1!A2'), or the table anchor for 'append' (e.g. 'Sheet1!A1'). Without a sheet name the first sheet is used.",
      },
      values: {
        type: "array",
        items: { type: "array", items: { type: "string" } },
        description: "Rows of cell values. Use either values or csvPath.",
      },
      csvPath: {
        type: "string",
        description:
          "Absolute path to a local CSV file with the rows to write. Use either values or csvPath.",
      },
      skipHeader: {
        type: "boolean",
        description: "Skip the first CSV row (header). Default false.",
      },
      mode: {
        type: "string",
        enum: ["update", "append"],
        description: "'update' (default) or 'append'.",
      },
    },
    required: ["spreadsheetId", "range"],
  },
} as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export async function writeRange(
  args: GSheetsWriteRangeInput,
): Promise<InternalToolResponse> {
  const { spreadsheetId, range } = args;
  const mode = args.mode || "update";

  let values: string[][];
  if (args.csvPath) {
    if (!fs.existsSync(args.csvPath)) {
      return {
        content: [{ type: "text", text: `Error: File not found: ${args.csvPath}` }],
        isError: true,
      };
    }
    values = parseCsv(fs.readFileSync(args.csvPath, "utf-8"));
    if (args.skipHeader) values = values.slice(1);
  } else if (args.values) {
    values = args.values;
  } else {
    return {
      content: [{ type: "text", text: "Error: pass values or csvPath" }],
      isError: true,
    };
  }
  if (!values.length) {
    return {
      content: [{ type: "text", text: "Error: no rows to write" }],
      isError: true,
    };
  }

  const sheets = google.sheets({ version: "v4" });
  let written: string | null | undefined;
  let cells: number | null | undefined;
  if (mode === "append") {
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    written = res.data.updates?.updatedRange;
    cells = res.data.updates?.updatedCells;
  } else {
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    written = res.data.updatedRange;
    cells = res.data.updatedCells;
  }

  return {
    content: [
      {
        type: "text",
        text: `${mode === "append" ? "Appended" : "Updated"} ${values.length} rows (${cells ?? "?"} cells) at ${written}`,
      },
    ],
    isError: false,
  };
}
