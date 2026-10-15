import { google } from "googleapis";
import { GDriveCreateFolderInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_create_folder",
  description:
    "Create a new folder in Google Drive. Can create nested folders by specifying parentFolderId. Supports Shared Drives.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the folder to create",
      },
      parentFolderId: {
        type: "string",
        description:
          "ID of the parent folder or Shared Drive. If not provided, creates in the root of My Drive.",
      },
    },
    required: ["name"],
  },
} as const;

export async function createFolder(
  args: GDriveCreateFolderInput,
): Promise<InternalToolResponse> {
  const drive = google.drive("v3");

  const fileMetadata: any = {
    name: args.name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (args.parentFolderId) {
    fileMetadata.parents = [args.parentFolderId];
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, name, webViewLink",
    supportsAllDrives: true,
  });

  return {
    content: [
      {
        type: "text",
        text: `Created folder "${res.data.name}"\nID: ${res.data.id}\nLink: ${res.data.webViewLink}`,
      },
    ],
    isError: false,
  };
}
