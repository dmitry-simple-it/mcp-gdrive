import { schema as gdriveSearchSchema, search } from './gdrive_search.js';
import { schema as gdriveReadFileSchema, readFile } from './gdrive_read_file.js';
import { schema as gdriveListFolderSchema, listFolder } from './gdrive_list_folder.js';
import { schema as gdriveCreateFolderSchema, createFolder } from './gdrive_create_folder.js';
import { schema as gdriveMoveFileSchema, moveFile } from './gdrive_move_file.js';
import { schema as gdriveUploadFileSchema, uploadFile } from './gdrive_upload_file.js';
import { schema as gsheetsUpdateCellSchema, updateCell } from './gsheets_update_cell.js';
import { schema as gsheetsReadSchema, readSheet } from './gsheets_read.js';
import { schema as gdocsEditSchema, editDocument } from './gdocs_edit.js';
import { schema as gdriveReplaceFileContentSchema, replaceFileContent } from './gdrive_replace_file_content.js';
import { schema as gsheetsWriteRangeSchema, writeRange } from './gsheets_write_range.js';
import {
  Tool,
  GDriveSearchInput,
  GDriveReadFileInput,
  GDriveListFolderInput,
  GDriveCreateFolderInput,
  GDriveMoveFileInput,
  GDriveUploadFileInput,
  GSheetsUpdateCellInput,
  GSheetsReadInput,
  GDocsEditInput,
  GDriveReplaceFileContentInput,
  GSheetsWriteRangeInput
} from './types.js';

export const tools: [
  Tool<GDriveSearchInput>,
  Tool<GDriveReadFileInput>,
  Tool<GDriveListFolderInput>,
  Tool<GDriveCreateFolderInput>,
  Tool<GDriveMoveFileInput>,
  Tool<GDriveUploadFileInput>,
  Tool<GSheetsUpdateCellInput>,
  Tool<GSheetsReadInput>,
  Tool<GDocsEditInput>,
  Tool<GDriveReplaceFileContentInput>,
  Tool<GSheetsWriteRangeInput>
] = [
  {
    ...gdriveSearchSchema,
    handler: search,
  },
  {
    ...gdriveReadFileSchema,
    handler: readFile,
  },
  {
    ...gdriveListFolderSchema,
    handler: listFolder,
  },
  {
    ...gdriveCreateFolderSchema,
    handler: createFolder,
  },
  {
    ...gdriveMoveFileSchema,
    handler: moveFile,
  },
  {
    ...gdriveUploadFileSchema,
    handler: uploadFile,
  },
  {
    ...gsheetsUpdateCellSchema,
    handler: updateCell,
  },
  {
    ...gsheetsReadSchema,
    handler: readSheet,
  },
  {
    ...gdocsEditSchema,
    handler: editDocument,
  },
  {
    ...gdriveReplaceFileContentSchema,
    handler: replaceFileContent,
  },
  {
    ...gsheetsWriteRangeSchema,
    handler: writeRange,
  }
];