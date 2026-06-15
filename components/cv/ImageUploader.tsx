'use client';

import React, { useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  currentImage?: string | null;
  label?: string;
}

export function ImageUploader({ onImageUpload, currentImage, label = "Upload Image" }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        onImageUpload(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-4 items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Choose File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {currentImage && (
          <div className="h-16 w-16 relative rounded overflow-hidden border border-gray-300 dark:border-gray-700">
            <Image src={currentImage} alt="Preview" fill className="object-cover" unoptimized />
          </div>
        )}
      </div>
    </div>
  );
}
