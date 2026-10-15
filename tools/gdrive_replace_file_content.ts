import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import {
  GDriveReplaceFileContentInput,
  InternalToolResponse,
} from "./types.js";

export const schema = {
  name: "gdrive_replace_file_content",
  description:
    "Replace the content of an existing Google Drive file with a local file, keeping its ID, link, name and sharing permissions. For a Google Sheet, upload a CSV: it replaces the whole spreadsheet content (CSV holds one sheet, other tabs are dropped). For a Google Doc, upload .docx/.txt/.html.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the existing Drive file to overwrite",
      },
      localPath: {
        type: "string",
        description: "Absolute path to the local file with the new content",
      },
      mimeType: {
        type: "string",
        description:
          "MIME type of the local file. If not provided, detected from the extension (.csv → text/csv).",
      },
    },
    required: ["fileId", "localPath"],
  },
} as const;

const MIME_MAP: Record<string, string> = {
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".txt": "text/plain",
  ".html": "text/html",
  ".md": "text/markdown",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function replaceFileContent(
  args: GDriveReplaceFileContentInput,
): Promise<InternalToolResponse> {
  const { fileId, localPath } = args;

  if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
    return {
      content: [{ type: "text", text: `Error: File not found: ${localPath}` }],
      isError: true,
    };
  }

  const mimeType =
    args.mimeType ||
    MIME_MAP[path.extname(localPath).toLowerCase()] ||
    "application/octet-stream";

  const drive = google.drive("v3");
  const res = await drive.files.update({
    fileId,
    media: { mimeType, body: fs.createReadStream(localPath) },
    fields: "id, name, mimeType, modifiedTime, webViewLink",
    supportsAllDrives: true,
  });

  return {
    content: [
      {
        type: "text",
        text: `Replaced content of "${res.data.name}" (${res.data.mimeType})\nID: ${res.data.id}\nModified: ${res.data.modifiedTime}\nLink: ${res.data.webViewLink}`,
      },
    ],
    isError: false,
  };
}
