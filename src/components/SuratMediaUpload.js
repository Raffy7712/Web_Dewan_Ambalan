"use client";

import { useState } from "react";
import CloudinaryMediaUpload from "./CloudinaryMediaUpload";
import { FileUp, X } from "lucide-react";

export default function SuratMediaUpload({
  initialUrl = null,
  onChange,
  label = "Upload lampiran surat",
  suratType = "masuk", // "masuk" atau "keluar"
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [error, setError] = useState(null);

  const handleChange = (urls) => {
    const newUrl = urls.length > 0 ? urls[0] : "";
    setUrl(newUrl);
    setError(null);
    if (onChange) onChange(newUrl);
  };

  const handleClear = () => {
    setUrl("");
    setError(null);
    if (onChange) onChange("");
  };

  const folder = suratType === "masuk" ? "da-alf/surat/masuk" : "da-alf/surat/keluar";

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <FileUp size={16} />
          {label}
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
          Gambar/Foto lampiran surat. Max 1 file.
        </p>
      </label>

      <CloudinaryMediaUpload
        initialUrls={url ? [url] : []}
        mediaType="image"
        maxFiles={1}
        onChange={handleChange}
        folder={folder}
      />

      {url && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline truncate flex-1"
            title={url}
          >
            {url.split("/").pop().slice(0, 50)}…
          </a>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
            title="Hapus"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
