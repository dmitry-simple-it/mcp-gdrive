import { google } from "googleapis";
import { GDriveMoveFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_move_file",
  description:
    "Move a file or folder to a different parent folder in Google Drive. Supports Shared Drives.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file or folder to move",
      },
      newParentId: {
        type: "string",
        description: "ID of the destination folder",
      },
    },
    required: ["fileId", "newParentId"],
  },
} as const;

export async function moveFile(
  args: GDriveMoveFileInput,
): Promise<InternalToolResponse> {
  const drive = google.drive("v3");

  // Get current parents
  const file = await drive.files.get({
    fileId: args.fileId,
    fields: "id, name, parents",
    supportsAllDrives: true,
  });

  const previousParents = (file.data.parents || []).join(",");

  const res = await drive.files.update({
    fileId: args.fileId,
    addParents: args.newParentId,
    removeParents: previousParents,
    fields: "id, name, parents, webViewLink",
    supportsAllDrives: true,
  });

  return {
    content: [
      {
        type: "text",
        text: `Moved "${res.data.name}" to new folder\nID: ${res.data.id}\nLink: ${res.data.webViewLink}`,
      },
    ],
    isError: false,
  };
}
