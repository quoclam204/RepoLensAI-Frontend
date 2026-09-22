"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { analysisGateway, usesMockAnalysis } from "@/services/analysis-gateway";

type InputMode = "GitUrl" | "Zip";
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
      setError("Choose a ZIP archive before starting the analysis.");
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
        <button type="button" role="tab" aria-selected={mode === "GitUrl"} className={mode === "GitUrl" ? "active" : ""} onClick={() => changeMode("GitUrl")}>Public Git URL</button>
        <button type="button" role="tab" aria-selected={mode === "Zip"} className={mode === "Zip" ? "active" : ""} onClick={() => changeMode("Zip")}>Upload ZIP</button>
      </div>

      <div className="analysis-field">
        {mode === "GitUrl" ? (
          <label>
            <span>Repository URL</span>
            <input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/organization/repository" autoComplete="url" aria-describedby="repository-hint" />
            <small id="repository-hint">The repository must be publicly accessible without credentials.</small>
          </label>
        ) : (
          <label className="file-drop">
            <input type="file" accept=".zip,application/zip" onChange={(event) => chooseZip(event.target.files?.[0])} />
            <span className="upload-mark" aria-hidden="true">↑</span>
            <strong>{zipFile?.name ?? "Choose a repository ZIP"}</strong>
            <small>{zipFile ? `${(zipFile.size / 1024 / 1024).toFixed(1)} MB selected` : "ZIP only, up to 100 MB"}</small>
          </label>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="submit-row">
        <p>
          Repository content is treated as untrusted input and is never executed by the frontend.
          <span>{usesMockAnalysis ? " Local mock mode is active." : " Connected to the backend API."}</span>
        </p>
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? "Creating analysis…" : "Start analysis"}
        </button>
      </div>
    </form>
  );
}
