"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";

export interface PickedFile {
  file: File;
  id: string;
}

interface Props {
  label: string;
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  multiple?: boolean;
}

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_MB = 10;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileDropzone({ label, files, onChange, multiple = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const incoming = Array.from(list);
      const tooBig = incoming.find((f) => f.size > MAX_MB * 1024 * 1024);
      if (tooBig) {
        setError(`${tooBig.name} is over ${MAX_MB}MB`);
        return;
      }
      const unsupported = incoming.find(
        (f) => !ACCEPT.split(",").includes(f.type)
      );
      if (unsupported) {
        setError(`${unsupported.name} isn't a PDF or image`);
        return;
      }
      setError(null);
      const picked = incoming.map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      }));
      onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
    },
    [files, multiple, onChange]
  );

  const removeFile = (id: string) => onChange(files.filter((f) => f.id !== id));

  if (files.length > 0) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
        {files.map(({ file, id }) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--ink)]">{file.name}</p>
              <p className="text-xs text-[var(--muted)]">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => removeFile(id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white"
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {multiple && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--muted)] hover:bg-gray-50"
          >
            + Add another page
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver
            ? "border-[var(--brand)] bg-[var(--brand-tint)]"
            : "border-[var(--border)] bg-[var(--panel)] hover:border-gray-300"
        }`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[var(--ink)]">
          <Upload className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
        <span className="text-xs text-[var(--muted)]">Max {MAX_MB}MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-xs text-[var(--red)]">{error}</p>}
    </div>
  );
}
