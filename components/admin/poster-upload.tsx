"use client";

import { useState, useRef } from "react";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PosterUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PosterUpload({ onUpload, isUploading }: PosterUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB");
      return;
    }

    await onUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
          isDragOver
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Extracting events...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Claude is analyzing the poster
            </p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Upload event poster</p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              JPG, PNG, or WebP up to 10MB
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
