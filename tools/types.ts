// Define base types for our tool system
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: readonly string[];
  };
  handler: (args: T) => Promise<InternalToolResponse>;
}

// Our internal tool response format
export interface InternalToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}

// Input types for each tool
export interface GDriveSearchInput {
  query: string;
  pageToken?: string;
  pageSize?: number;
}

export interface GDriveReadFileInput {
  fileId: string;
}

export interface GDriveListFolderInput {
  folderId: string;
  pageToken?: string;
  pageSize?: number;
}

export interface GSheetsUpdateCellInput {
  fileId: string;
  range: string;
  value: string;
}

export interface GSheetsReadInput {
  spreadsheetId: string;
  ranges?: string[]; // Optional A1 notation ranges like "Sheet1!A1:B10"
  sheetId?: number; // Optional specific sheet ID
  valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA"; // How values should be rendered
}

export interface GDriveCreateFolderInput {
  name: string;
  parentFolderId?: string;
}

export interface GDriveMoveFileInput {
  fileId: string;
  newParentId: string;
}

export interface GDriveUploadFileInput {
  localPath: string;
  name?: string;
  parentFolderId?: string;
  mimeType?: string;
  convertTo?: string;
}

export interface GDocsEditInput {
  documentId: string;
  old_text: string;
  new_text: string;
  match_case?: boolean;
}

export interface GSheetsFindInput {
  spreadsheetId: string;
  searchValue: string;
  sheetName?: string; // Optional sheet name to search in (if not provided, searches all sheets)
  matchType?: "exact" | "contains" | "regex"; // Default: "contains"
  valueTypeFilter?: "string" | "boolean" | "number" | "formula"; // Optional filter by value type
}


export interface GDriveReplaceFileContentInput {
  fileId: string;
  localPath: string;
  mimeType?: string;
}

export interface GSheetsWriteRangeInput {
  spreadsheetId: string;
  range: string;
  values?: string[][];
  csvPath?: string;
  skipHeader?: boolean;
  mode?: "update" | "append";
}
