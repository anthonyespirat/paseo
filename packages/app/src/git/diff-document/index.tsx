import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ParsedDiffFile } from "@getpaseo/protocol/messages";
import { withUnistyles } from "react-native-unistyles";
import { RenderProfile } from "@/utils/render-profiler";
import { createDiffPalette, retainDiffPalette } from "./palette";
import { DiffSurface } from "./surface";
import type { DiffDocumentProps, DiffHeaderTypography, DiffPalette } from "./types";
import { usePersistedViewedFiles } from "./use-persisted-viewed-files";
import { changedViewedFilePaths } from "./viewed-files";

export type { DiffDocumentProps, WorkingDiffMode } from "./types";

type ThemedDiffDocumentProps = DiffDocumentProps & {
  palette: DiffPalette;
  headerTypography: DiffHeaderTypography;
};

const EMPTY_PATHS: string[] = [];

function ThemedDiffDocument(props: ThemedDiffDocumentProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const paletteRef = useRef(props.palette);
  paletteRef.current = retainDiffPalette(paletteRef.current, props.palette);
  const palette = paletteRef.current;
  const collapseState = props.mode.kind === "working" ? props.collapseState : null;
  const viewedFilesStorageKey =
    props.mode.kind === "working" ? props.mode.viewedFilesStorageKey : null;
  const [viewedFiles, setViewedFiles] = usePersistedViewedFiles(viewedFilesStorageKey, props.files);
  const paths = collapseState?.paths ?? EMPTY_PATHS;
  const collapsedFilePaths = useMemo(() => new Set(paths), [paths]);
  const changedViewedPaths = useMemo(
    () => changedViewedFilePaths(viewedFiles, props.files),
    [props.files, viewedFiles],
  );
  const toggleFile = useCallback(
    (path: string) => {
      if (!collapseState) return;
      const next = collapsedFilePaths.has(path)
        ? paths.filter((entry) => entry !== path)
        : [...paths, path];
      collapseState.onChange(next);
    },
    [collapseState, collapsedFilePaths, paths],
  );
  useEffect(() => {
    if (changedViewedPaths.length === 0) return;
    const changedPaths = new Set(changedViewedPaths);
    setViewedFiles((current) => {
      const next = new Map(current);
      changedPaths.forEach((path) => next.delete(path));
      return next;
    });
    if (!collapseState) return;
    const next = paths.filter((path) => !changedPaths.has(path));
    if (next.length !== paths.length) collapseState.onChange(next);
  }, [changedViewedPaths, collapseState, paths, setViewedFiles]);
  const toggleFileViewed = useCallback(
    (file: ParsedDiffFile) => {
      const isViewed = viewedFiles.get(file.path) === file;
      setViewedFiles((current) => {
        const next = new Map(current);
        if (isViewed) next.delete(file.path);
        else next.set(file.path, file);
        return next;
      });
      if (!collapseState) return;
      if (isViewed) {
        collapseState.onChange(paths.filter((path) => path !== file.path));
      } else if (!collapsedFilePaths.has(file.path)) {
        collapseState.onChange([...paths, file.path]);
      }
    },
    [collapseState, collapsedFilePaths, paths, setViewedFiles, viewedFiles],
  );
  return (
    <DiffSurface
      {...props}
      palette={palette}
      collapsedFilePaths={collapsedFilePaths}
      onToggleFile={toggleFile}
      viewedFiles={viewedFiles}
      onToggleFileViewed={toggleFileViewed}
      selectedPath={selectedPath}
      onSelectPath={setSelectedPath}
    />
  );
}

const StyledDiffDocument = withUnistyles(ThemedDiffDocument, (theme) => ({
  palette: createDiffPalette(theme),
  headerTypography: {
    family: theme.fontFamily.ui,
    size: theme.fontSize.base,
    statSize: theme.fontSize.sm,
  },
}));

export function DiffDocument(props: DiffDocumentProps) {
  return (
    <RenderProfile id="DiffDocument">
      <StyledDiffDocument {...props} />
    </RenderProfile>
  );
}
