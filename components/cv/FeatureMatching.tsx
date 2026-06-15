'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageUploader } from './ImageUploader';
import { SliderPanel } from './SliderPanel';
import { matchFeatures } from '@/lib/cv/api';
import { Zap, Loader2, Link as LinkIcon } from 'lucide-react';

export function FeatureMatching() {
  const [image1, setImage1] = useState<string | null>('/left01.jpg');
  const [image2, setImage2] = useState<string | null>('/right01.jpg');
  const [result, setResult] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nFeatures, setNFeatures] = useState(1000);
  const [ratio, setRatio] = useState(0.75);

  const processMatching = React.useCallback(async () => {
    if (!image1 || !image2) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await matchFeatures(image1, image2, nFeatures, ratio);
      setResult(`data:image/jpeg;base64,${res.result_image}`);
      setMatchCount(res.match_count);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [image1, image2, nFeatures, ratio]);

  useEffect(() => {
    if (image1 && image2) {
      const timer = setTimeout(() => processMatching(), 300);
      return () => clearTimeout(timer);
    }
  }, [image1, image2, processMatching]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6">
          <ImageUploader label="Left Image" currentImage={image1} onImageUpload={setImage1} />
          <ImageUploader label="Right Image" currentImage={image2} onImageUpload={setImage2} />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <SliderPanel
            title="Matching Parameters (ORB)"
            sliders={[
              { label: 'Max Features', min: 100, max: 5000, step: 100, value: nFeatures, onChange: setNFeatures },
              { label: "Lowe's Ratio Test", min: 0.5, max: 0.95, step: 0.05, value: ratio, onChange: setRatio },
            ]}
          />

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-2">
              <Zap size={18} className="text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest text-xs">Matching Status</h4>
            </div>
            {isProcessing ? (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Loader2 className="animate-spin" size={20} />
                <span>Computing descriptors & matching...</span>
              </div>
            ) : matchCount !== null ? (
              <p className="text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                Found <span className="text-2xl font-bold">{matchCount}</span> consistent feature correspondences across both images using the Hamming distance.
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic font-medium">Ready to correlate features...</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-rose-500 text-sm font-medium bg-rose-50 dark:bg-rose-900/20 p-4 rounded-sm border border-rose-100 dark:border-rose-800 text-center">{error}</p>}

      <div className="relative group">
        <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 min-h-[400px] flex items-center justify-center">
          {result ? (
            <Image src={result} alt="Matches" fill className="object-contain" unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-600">
              <LinkIcon size={64} strokeWidth={1} className="opacity-20" />
              <p className="font-bold uppercase tracking-[0.2em] text-xs">Awaiting Correlation</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
               <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 border-4 border-slate-500/20 border-t-slate-200 rounded-full animate-spin"></div>
                 <span className="text-slate-200 font-bold uppercase tracking-widest text-xs">Hamming Distance...</span>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
