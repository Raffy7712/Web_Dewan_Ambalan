"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, AlertCircle, X } from "lucide-react";

export default function CloudinaryMediaUpload({
  initialUrls = [],
  initialMediaTypes = {},
  mediaType = "image",
  onChange,
  maxFiles = mediaType === "image" ? 10 : 5,
}) {
  const [items, setItems] = useState(
    initialUrls.map((url, idx) => ({
      id: `${Date.now()}-${idx}`,
      url,
      mediaType: initialMediaTypes[url] || mediaType,
      uploading: false,
      error: null,
    }))
  );
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
        <p className="font-medium">⚠️ Cloudinary belum dikonfigurasi</p>
        <p className="text-xs mt-1">
          Tambahkan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dan NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ke .env.local
        </p>
      </div>
    );
  }

  const notifyChange = (newItems) => {
    setItems(newItems);
    if (onChange) {
      const urls = newItems.map((item) => item.url);
      const mediaTypes = newItems.reduce(
        (acc, item) => {
          acc[item.url] = item.mediaType;
          return acc;
        },
        {}
      );
      onChange(urls, mediaTypes);
    }
  };

  const isValidMediaFile = (file) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allValidTypes = [...validImageTypes, ...validVideoTypes];

    if (!allValidTypes.includes(file.type)) {
      return { valid: false, error: `Format tidak didukung: ${file.type || "unknown"}` };
    }

    // Max file size: 100MB
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File terlalu besar (max 100MB): ${(file.size / 1024 / 1024).toFixed(1)}MB` };
    }

    return { valid: true };
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    const availableSlots = maxFiles - items.length;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    for (const file of filesToUpload) {
      // Validate file type and size
      const validation = isValidMediaFile(file);
      if (!validation.valid) {
        setItems((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            url: "",
            mediaType: mediaType,
            uploading: false,
            error: validation.error,
          },
        ]);
        continue;
      }

      const itemId = `${Date.now()}-${Math.random()}`;

      // Add item with uploading state
      setItems((prev) => [
        ...prev,
        {
          id: itemId,
          url: "",
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          uploading: true,
          error: null,
        },
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("resource_type", "auto");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.error?.message || `Upload failed: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Update item with success
        setItems((prev) => {
          const updated = prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  url: data.secure_url,
                  mediaType: data.resource_type === "video" ? "video" : "image",
                  uploading: false,
                  error: null,
                }
              : item
          );
          notifyChange(updated);
          return updated;
        });
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  uploading: false,
                  error: error.message || "Upload gagal",
                }
              : item
          )
        );
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    handleUpload(e.target.files);
  };

  const handleDelete = (itemId) => {
    const newItems = items.filter((item) => item.id !== itemId);
    notifyChange(newItems);
  };

  const isFull = items.length >= maxFiles;

  return (
    <div className="space-y-4">
      {!isFull && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={mediaType === "image" ? "image/jpeg,image/png,image/gif,image/webp,image/svg+xml" : "video/mp4,video/webm,video/quicktime"}
            onChange={handleFileInput}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            }`}
          >
            <Upload size={32} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Drag & drop atau klik untuk upload {mediaType === "image" ? "foto" : "video"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tersisa {maxFiles - items.length} dari {maxFiles} slot
            </p>
          </div>
        </>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Upload: {items.length}/{maxFiles}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded bg-slate-100 p-3 dark:bg-slate-800"
              >
                <div className="min-w-0 flex-1">
                  {item.uploading && (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        Uploading…
                      </span>
                    </div>
                  )}
                  {item.error && (
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-400 truncate">
                        {item.error}
                      </span>
                    </div>
                  )}
                  {item.url && !item.uploading && !item.error && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline dark:text-emerald-400 truncate block"
                      title={item.url}
                    >
                      {item.url.split("/").pop().slice(0, 40)}…
                    </a>
                  )}
                </div>
                {!item.uploading && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="ml-2 flex-shrink-0 p-1 hover:bg-red-100 rounded dark:hover:bg-red-900/30"
                    title="Hapus"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
