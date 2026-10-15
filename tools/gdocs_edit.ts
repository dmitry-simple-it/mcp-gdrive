import { google } from "googleapis";
import { GDocsEditInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdocs_edit",
  description:
    "Edit a Google Document by replacing text. Finds all occurrences of old_text and replaces them with new_text. Use gdrive_read_file first to see the document content.",
  inputSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "ID of the Google Document (from the URL)",
      },
      old_text: {
        type: "string",
        description: "The text to find and replace",
      },
      new_text: {
        type: "string",
        description: "The replacement text",
      },
      match_case: {
        type: "boolean",
        description: "Whether to match case (default: true)",
      },
    },
    required: ["documentId", "old_text", "new_text"],
  },
} as const;

export async function editDocument(
  args: GDocsEditInput,
): Promise<InternalToolResponse> {
  const { documentId, old_text, new_text, match_case = true } = args;
  const docs = google.docs({ version: "v1" });

  try {
    const response = await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: {
                text: old_text,
                matchCase: match_case,
              },
              replaceText: new_text,
            },
          },
        ],
      },
    });

    const replies = response.data.replies;
    const occurrences =
      replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;

    if (occurrences === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No occurrences of "${old_text}" found in the document.`,
          },
        ],
        isError: false,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Replaced ${occurrences} occurrence(s) of "${old_text}" with "${new_text}".`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error editing document: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
