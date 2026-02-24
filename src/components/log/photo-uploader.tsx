"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PhotoUploaderProps = {
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
};

export function PhotoUploader({
  existingUrl,
  onChange,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("JPEG, PNG, WebP のみ対応しています");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("5MB以下のファイルを選択してください");
      return;
    }

    setError(null);
    onChange(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function handleRemove() {
    onChange(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="プレビュー"
            width={128}
            height={128}
            className="h-32 w-32 rounded-lg object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            aria-label="写真を削除"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full p-0 text-xs"
            onClick={handleRemove}
          >
            ✕
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          📷 写真を追加
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
