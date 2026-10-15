import { google } from "googleapis";
import { GDriveListFolderInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_list_folder",
  description: "List contents of a folder in Google Drive by folder ID",
  inputSchema: {
    type: "object",
    properties: {
      folderId: {
        type: "string",
        description: "The ID of the folder to list contents of",
      },
      pageToken: {
        type: "string",
        description: "Token for the next page of results",
        optional: true,
      },
      pageSize: {
        type: "number",
        description: "Number of results per page (max 100)",
        optional: true,
      },
    },
    required: ["folderId"],
  },
} as const;

export async function listFolder(
  args: GDriveListFolderInput,
): Promise<InternalToolResponse> {
  const drive = google.drive("v3");

  const res = await drive.files.list({
    q: `'${args.folderId}' in parents and trashed = false`,
    pageSize: args.pageSize || 20,
    pageToken: args.pageToken,
    orderBy: "folder,name",
    fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });

  const files = res.data.files || [];

  const fileList = files
    .map((file: any) => {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      const icon = isFolder ? '📁' : '📄';
      const size = file.size ? ` (${formatSize(file.size)})` : '';
      return `${icon} ${file.name}${size}\n   ID: ${file.id}`;
    })
    .join("\n\n");

  let response = `Found ${files.length} items:\n\n${fileList}`;

  if (res.data.nextPageToken) {
    response += `\n\nMore results available. Use pageToken: ${res.data.nextPageToken}`;
  }

  return {
    content: [
      {
        type: "text",
        text: response,
      },
    ],
    isError: false,
  };
}

function formatSize(bytes: string): string {
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
