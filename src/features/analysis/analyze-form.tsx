"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useState } from "react";
import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";
import { createZipArchive, shouldIgnorePath, type ZipFileInput } from "@/utils/client-zip";
import { FolderIcon, ZipArchiveIcon, SpinnerIcon, UploadCloudIcon } from "@/components/icons";

type InputMode = "GitUrl" | "Folder" | "Zip";
const MAX_ZIP_BYTES = 100 * 1024 * 1024;

function validateRepositoryUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "The repository URL must use HTTP or HTTPS.";
    }
    if (url.pathname.split("/").filter(Boolean).length < 2) {
      return "Enter a complete public repository URL, including owner and repository name.";
    }
    return "";
  } catch {
    return "Enter a valid public Git repository URL.";
  }
}

export function AnalyzeForm() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("GitUrl");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [folderInfo, setFolderInfo] = useState<{ name: string; fileCount: number; sizeBytes: number } | null>(null);
  const [packingFolder, setPackingFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function changeMode(nextMode: InputMode) {
    setMode(nextMode);
    setError("");
  }

  function chooseZip(file?: File) {
    setError("");
    if (!file) {
      setZipFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setZipFile(null);
      setError("Only .zip repository archives are accepted.");
      return;
    }
    if (file.size > MAX_ZIP_BYTES) {
      setZipFile(null);
      setError("The ZIP archive must be 100 MB or smaller.");
      return;
    }
    setZipFile(file);
    setFolderInfo(null);
  }

  async function handleFolderFiles(fileList: FileList | File[]) {
    setError("");
    setPackingFolder(true);

    try {
      const filesToPack: ZipFileInput[] = [];
      let totalBytes = 0;
      let detectedFolderName = "repository";

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
        
        // Extract top-level folder name if available
        const pathSegments = relativePath.split(/[/\\]/);
        if (pathSegments.length > 1 && detectedFolderName === "repository") {
          detectedFolderName = pathSegments[0];
        }

        // Filter out build and temporary artifacts
        if (shouldIgnorePath(relativePath)) {
          continue;
        }

        const buffer = await file.arrayBuffer();
        filesToPack.push({
          path: relativePath,
          data: new Uint8Array(buffer),
        });
        totalBytes += file.size;
      }

      if (filesToPack.length === 0) {
        setError("No eligible source code files were found in the selected folder.");
        setPackingFolder(false);
        return;
      }

      if (totalBytes > MAX_ZIP_BYTES) {
        setError("The total folder size exceeds the 100 MB limit.");
        setPackingFolder(false);
        return;
      }

      const generatedZip = createZipArchive(filesToPack, `${detectedFolderName}.zip`);
      setZipFile(generatedZip);
      setFolderInfo({
        name: detectedFolderName,
        fileCount: filesToPack.length,
        sizeBytes: totalBytes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process folder files.");
    } finally {
      setPackingFolder(false);
    }
  }

  async function handleFolderInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      await handleFolderFiles(event.target.files);
    }
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    setError("");

    const items = event.dataTransfer.items;
    if (!items || items.length === 0) {
      if (event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith(".zip")) {
          chooseZip(file);
        } else {
          await handleFolderFiles(event.dataTransfer.files);
        }
      }
      return;
    }

    setPackingFolder(true);
    const collectedFiles: ZipFileInput[] = [];
    let detectedName = "repository";

    try {
      async function scanEntry(entry: any, currentPath = ""): Promise<void> {
        if (entry.isFile) {
          const file: File = await new Promise((resolve, reject) => entry.file(resolve, reject));
          const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
          if (!shouldIgnorePath(relPath)) {
            const buf = await file.arrayBuffer();
            collectedFiles.push({
              path: relPath,
              data: new Uint8Array(buf),
            });
          }
        } else if (entry.isDirectory) {
          if (!currentPath) {
            detectedName = entry.name;
          }
          const reader = entry.createReader();
          const readEntries = async (): Promise<any[]> => {
            let entries: any[] = [];
            let batch: any[] = [];
            do {
              batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
              entries = entries.concat(batch);
            } while (batch.length > 0);
            return entries;
          };
          const children = await readEntries();
          const dirPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          if (!shouldIgnorePath(dirPath)) {
            for (const child of children) {
              await scanEntry(child, dirPath);
            }
          }
        }
      }

      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) {
          await scanEntry(entry);
        }
      }

      if (collectedFiles.length === 0) {
        setError("No valid source files found in the dropped folder.");
        setPackingFolder(false);
        return;
      }

      const totalBytes = collectedFiles.reduce((acc, f) => acc + f.data.length, 0);
      const generatedZip = createZipArchive(collectedFiles, `${detectedName}.zip`);
      setZipFile(generatedZip);
      setFolderInfo({
        name: detectedName,
        fileCount: collectedFiles.length,
        sizeBytes: totalBytes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error reading dropped folder.");
    } finally {
      setPackingFolder(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "GitUrl") {
      const validationError = validateRepositoryUrl(repositoryUrl.trim());
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (!zipFile) {
      setError(
        mode === "Folder"
          ? "Please select or drop a repository folder before starting."
          : "Choose a ZIP archive before starting the analysis.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const analysis = await analysisGateway.create(
        mode === "GitUrl"
          ? { type: "GitUrl", repositoryUrl: repositoryUrl.trim() }
          : { type: "Zip", file: zipFile! },
      );
      router.push(`/projects/${encodeURIComponent(analysis.id)}/overview`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The analysis could not be created. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="analysis-form" onSubmit={submit} noValidate>
      <div className="input-tabs" role="tablist" aria-label="Repository input type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "GitUrl"}
          className={mode === "GitUrl" ? "active" : ""}
          onClick={() => changeMode("GitUrl")}
        >
          Public Git URL
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "Folder"}
          className={mode === "Folder" ? "active" : ""}
          onClick={() => changeMode("Folder")}
        >
          Upload Folder
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "Zip"}
          className={mode === "Zip" ? "active" : ""}
          onClick={() => changeMode("Zip")}
        >
          Upload ZIP
        </button>
      </div>

      <div className="analysis-field">
        {mode === "GitUrl" && (
          <label>
            <span>Repository URL</span>
            <input
              type="url"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/organization/repository"
              autoComplete="url"
              aria-describedby="repository-hint"
            />
            <small id="repository-hint">
              Enter any public GitHub or Git repository URL. RepoLens will clone, scan, and render diagrams automatically.
            </small>
          </label>
        )}

        {mode === "Folder" && (
          <label
            className={`file-drop ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              borderColor: isDragging ? "#0b8f68" : undefined,
              backgroundColor: isDragging ? "rgba(11, 143, 104, 0.05)" : undefined,
            }}
          >
            <input
              type="file"
              // @ts-expect-error webkitdirectory is supported across modern browsers
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderInputChange}
            />
            <span className="upload-mark" aria-hidden="true">
              {packingFolder ? <SpinnerIcon size={20} /> : <FolderIcon size={20} />}
            </span>
            <strong>
              {packingFolder
                ? "Packaging folder client-side…"
                : folderInfo
                  ? `Folder: ${folderInfo.name} (${folderInfo.fileCount} source files)`
                  : "Drag & drop a folder here, or click to browse"}
            </strong>
            <small>
              {folderInfo
                ? `${(folderInfo.sizeBytes / 1024 / 1024).toFixed(2)} MB ready for analysis`
                : "Select any local code repository folder (skips .git, bin, obj & node_modules)"}
            </small>
          </label>
        )}

        {mode === "Zip" && (
          <label
            className={`file-drop ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              chooseZip(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => chooseZip(event.target.files?.[0])}
            />
            <span className="upload-mark" aria-hidden="true">
              <UploadCloudIcon size={22} />
            </span>
            <strong>{zipFile && !folderInfo ? zipFile.name : "Choose or drop a repository ZIP"}</strong>
            <small>
              {zipFile && !folderInfo
                ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB selected`
                : "ZIP archive up to 100 MB"}
            </small>
          </label>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="submit-row">
        <p>
          Repository content is statically analyzed and never executed.
          <span>{usesMockAnalysis ? " Local mock mode is active." : " Connected to the backend API."}</span>
        </p>
        <button className="button primary" type="submit" disabled={submitting || packingFolder}>
          {submitting ? "Analyzing repository…" : packingFolder ? "Preparing files…" : "Start analysis & view diagrams"}
        </button>
      </div>
    </form>
  );
}
