import type { ParsedDiffFile } from "@getpaseo/protocol/messages";
import { z } from "zod";

export const ViewedFileRevisionsSchema = z.record(z.string(), z.string());
export type ViewedFileRevisions = z.infer<typeof ViewedFileRevisionsSchema>;

export type ViewedFileUpdate =
  | { kind: "toggle"; file: ParsedDiffFile }
  | { kind: "invalidate"; revisions: ViewedFileRevisions };

export function updateViewedFileRevisions(
  revisions: ViewedFileRevisions,
  update: ViewedFileUpdate,
): ViewedFileRevisions {
  const next = { ...revisions };
  if (update.kind === "invalidate") {
    for (const [path, revision] of Object.entries(update.revisions)) {
      if (next[path] === revision) delete next[path];
    }
    return next;
  }
  const revision = viewedFileRevision(update.file);
  if (next[update.file.path] === revision) delete next[update.file.path];
  else return { ...next, [update.file.path]: revision };
  return next;
}

export function viewedFileRevision(file: ParsedDiffFile): string {
  return JSON.stringify(file);
}

export function restoreViewedFiles(
  revisions: Readonly<Record<string, string>>,
  files: readonly ParsedDiffFile[],
): Map<string, ParsedDiffFile> {
  const viewedFiles = new Map<string, ParsedDiffFile>();
  for (const file of files) {
    const revision = revisions[file.path];
    if (revision !== undefined && revision === viewedFileRevision(file)) {
      viewedFiles.set(file.path, file);
    }
  }
  return viewedFiles;
}
