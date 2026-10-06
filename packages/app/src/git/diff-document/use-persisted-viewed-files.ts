import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ParsedDiffFile } from "@getpaseo/protocol/messages";
import { z } from "zod";
import { readValidatedJson } from "@/storage/validated-storage";
import { restoreViewedFiles, serializeViewedFiles } from "./viewed-files";

const ViewedFileRevisionsSchema = z.record(z.string(), z.string());

export function usePersistedViewedFiles(
  storageKey: string | null,
  files: readonly ParsedDiffFile[],
) {
  const [viewedFiles, setViewedFiles] = useState<Map<string, ParsedDiffFile>>(() => new Map());
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    if (!storageKey) {
      setViewedFiles(new Map());
      setLoadedStorageKey(null);
      return;
    }
    let cancelled = false;
    setLoadedStorageKey(null);
    void readValidatedJson(AsyncStorage, storageKey, ViewedFileRevisionsSchema)
      .then((revisions) => {
        if (cancelled) return undefined;
        setViewedFiles(restoreViewedFiles(revisions ?? {}, filesRef.current));
        setLoadedStorageKey(storageKey);
        return undefined;
      })
      .catch(() => {
        if (cancelled) return undefined;
        setViewedFiles(new Map());
        setLoadedStorageKey(storageKey);
        return undefined;
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey || !storageKey) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(serializeViewedFiles(viewedFiles))).catch(
      () => {},
    );
  }, [loadedStorageKey, storageKey, viewedFiles]);

  return [viewedFiles, setViewedFiles] as const;
}
