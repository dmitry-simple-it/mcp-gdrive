import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { GDriveUploadFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_upload_file",
  description:
    "Upload a local file to Google Drive. Supports uploading to a specific folder and Shared Drives.",
  inputSchema: {
    type: "object",
    properties: {
      localPath: {
        type: "string",
        description: "Absolute path to the local file to upload",
      },
      name: {
        type: "string",
        description:
          "Name for the file in Google Drive. If not provided, uses the local filename.",
      },
      parentFolderId: {
        type: "string",
        description:
          "ID of the parent folder or Shared Drive to upload into. If not provided, uploads to the root of My Drive.",
      },
      mimeType: {
        type: "string",
        description:
          "MIME type of the file. If not provided, it will be auto-detected from the file extension.",
      },
      convertTo: {
        type: "string",
        enum: ["google-doc", "google-sheet", "google-slide"],
        description:
          "Convert uploaded file to a Google Workspace format. Supported values: 'google-doc' (Google Docs), 'google-sheet' (Google Sheets), 'google-slide' (Google Slides).",
      },
    },
    required: ["localPath"],
  },
} as const;

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".zip": "application/zip",
  ".md": "text/markdown",
  ".html": "text/html",
};

function detectMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

export async function uploadFile(
  args: GDriveUploadFileInput,
): Promise<InternalToolResponse> {
  const localPath = args.localPath;

  if (!fs.existsSync(localPath)) {
    return {
      content: [{ type: "text", text: `Error: File not found: ${localPath}` }],
      isError: true,
    };
  }

  const stat = fs.statSync(localPath);
  if (!stat.isFile()) {
    return {
      content: [
        { type: "text", text: `Error: Path is not a file: ${localPath}` },
      ],
      isError: true,
    };
  }

  const drive = google.drive("v3");
  const fileName = args.name || path.basename(localPath);
  const mimeType = args.mimeType || detectMimeType(localPath);

  const CONVERT_MAP: Record<string, string> = {
    "google-doc": "application/vnd.google-apps.document",
    "google-sheet": "application/vnd.google-apps.spreadsheet",
    "google-slide": "application/vnd.google-apps.presentation",
  };

  const fileMetadata: any = {
    name: fileName,
  };

  if (args.convertTo && CONVERT_MAP[args.convertTo]) {
    fileMetadata.mimeType = CONVERT_MAP[args.convertTo];
  }

  if (args.parentFolderId) {
    fileMetadata.parents = [args.parentFolderId];
  }

  const media = {
    mimeType,
    body: fs.createReadStream(localPath),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink, size",
    supportsAllDrives: true,
  });

  const sizeKB = res.data.size
    ? (parseInt(res.data.size) / 1024).toFixed(1)
    : "unknown";

  return {
    content: [
      {
        type: "text",
        text: `Uploaded "${res.data.name}" (${sizeKB} KB)\nID: ${res.data.id}\nLink: ${res.data.webViewLink}`,
      },
    ],
    isError: false,
  };
}
