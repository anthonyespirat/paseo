import type { ParsedDiffFile } from "@getpaseo/protocol/messages";

export function changedViewedFilePaths(
  viewedFiles: ReadonlyMap<string, ParsedDiffFile>,
  files: readonly ParsedDiffFile[],
): string[] {
  const currentFiles = new Map(files.map((file) => [file.path, file]));
  return Array.from(viewedFiles, ([path, viewedFile]) =>
    currentFiles.get(path) === viewedFile ? null : path,
  ).filter((path): path is string => path !== null);
}

export function viewedFileRevision(file: ParsedDiffFile): string {
  return JSON.stringify(file);
}

export function restoreViewedFiles(
  revisions: Readonly<Record<string, string>>,
  files: readonly ParsedDiffFile[],
): Map<string, ParsedDiffFile> {
  return new Map(
    files
      .filter((file) => revisions[file.path] === viewedFileRevision(file))
      .map((file) => [file.path, file]),
  );
}

export function serializeViewedFiles(
  viewedFiles: ReadonlyMap<string, ParsedDiffFile>,
): Record<string, string> {
  return Object.fromEntries(
    Array.from(viewedFiles, ([path, file]) => [path, viewedFileRevision(file)]),
  );
}
