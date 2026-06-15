'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageUploader } from './ImageUploader';
import { SliderPanel } from './SliderPanel';
import { harrisCorners } from '@/lib/cv/api';
import { Sparkles, Loader2 } from 'lucide-react';

export function HarrisDemo() {
  const [image, setImage] = useState<string | null>('/fruits.jpg');
  const [result, setResult] = useState<string | null>(null);
  const [cornerCount, setCornerCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blockSize, setBlockSize] = useState(2);
  const [ksize, setKsize] = useState(3);
  const [k, setK] = useState(0.04);
  const [threshold, setThreshold] = useState(0.01);

  const processImage = React.useCallback(async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await harrisCorners(image, blockSize, ksize, k, threshold);
      setResult(`data:image/jpeg;base64,${res.result_image}`);
      setCornerCount(res.corner_count);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [image, blockSize, ksize, k, threshold]);

  useEffect(() => {
    if (image) {
      const timer = setTimeout(() => processImage(), 300);
      return () => clearTimeout(timer);
    }
  }, [image, processImage]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      <div className="lg:col-span-1 space-y-8">
        <ImageUploader label="Source Image" currentImage={image} onImageUpload={setImage} />

        <SliderPanel
          title="Harris Parameters"
          sliders={[
            { label: 'Block Size', min: 2, max: 10, step: 1, value: blockSize, onChange: setBlockSize },
            { label: 'Sobel K-Size', min: 3, max: 7, step: 2, value: ksize, onChange: setKsize },
            { label: 'k (Sensitivity)', min: 0.01, max: 0.1, step: 0.01, value: k, onChange: setK },
            { label: 'Threshold Ratio', min: 0.001, max: 0.1, step: 0.001, value: threshold, onChange: setThreshold },
          ]}
        />
        {error && <p className="text-rose-500 text-sm font-medium bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-800">{error}</p>}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="relative group">
          <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-50 dark:bg-slate-900 shadow-sm flex items-center justify-center">
            {result ? (
              <Image src={result} alt="Harris Corners" fill className="object-contain p-2" unoptimized />
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                ) : (
                  <Sparkles className="w-10 h-10 opacity-20" />
                )}
                <p className="text-sm font-bold uppercase tracking-widest">{isProcessing ? 'Detecting Corners...' : 'Ready for detection'}</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-sm shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">Analyzing gradients...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {cornerCount !== null && !isProcessing && (
          <div className="flex items-center justify-center gap-3 py-3 px-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-sm border border-indigo-100 dark:border-indigo-800 w-fit mx-auto">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            <p className="font-bold text-indigo-900 dark:text-indigo-200 tracking-tight">
              Corners detected: <span className="text-xl ml-1">{cornerCount}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
