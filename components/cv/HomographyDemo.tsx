'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageUploader } from './ImageUploader';
import { SliderPanel } from './SliderPanel';
import { estimateHomography } from '@/lib/cv/api';
import { Wand2, Loader2, ShieldCheck } from 'lucide-react';

export function HomographyDemo() {
  const [image1, setImage1] = useState<string | null>('/left01.jpg');
  const [image2, setImage2] = useState<string | null>('/right01.jpg');
  const [result, setResult] = useState<string | null>(null);
  const [inliers, setInliers] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nFeatures, setNFeatures] = useState(3000);
  const [ratio, setRatio] = useState(0.75);
  const [ransac, setRansac] = useState(5.0);

  const processHomography = React.useCallback(async () => {
    if (!image1 || !image2) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await estimateHomography(image1, image2, nFeatures, ratio, ransac);
      setResult(`data:image/jpeg;base64,${res.result_image}`);
      setInliers(res.inlier_count);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [image1, image2, nFeatures, ratio, ransac]);

  useEffect(() => {
    if (image1 && image2) {
      const timer = setTimeout(() => processHomography(), 400);
      return () => clearTimeout(timer);
    }
  }, [image1, image2, processHomography]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6">
          <ImageUploader label="Source (Image 1)" currentImage={image1} onImageUpload={setImage1} />
          <ImageUploader label="Target (Image 2)" currentImage={image2} onImageUpload={setImage2} />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <SliderPanel
            title="Geometric Solver (RANSAC)"
            sliders={[
              { label: 'Max Features', min: 1000, max: 5000, step: 500, value: nFeatures, onChange: setNFeatures },
              { label: "Lowe's Ratio", min: 0.5, max: 0.95, step: 0.05, value: ratio, onChange: setRatio },
              { label: 'RANSAC Threshold', min: 1.0, max: 20.0, step: 1.0, value: ransac, onChange: setRansac },
            ]}
          />

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 p-6 rounded-sm">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                 <h4 className="font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-widest text-xs">Solver Consensus</h4>
               </div>
               {inliers !== null && !isProcessing && (
                 <span className="bg-indigo-900 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest">Verified</span>
               )}
             </div>

             {isProcessing ? (
               <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-bold">
                 <Loader2 className="animate-spin" size={20} />
                 <span>Estimating homography matrix...</span>
               </div>
             ) : inliers !== null ? (
               <div className="space-y-1">
                 <p className="text-indigo-900 dark:text-indigo-200 text-lg font-bold leading-none">
                    <span className="text-3xl font-black">{inliers}</span> Inliers
                 </p>
                 <p className="text-indigo-600 dark:text-indigo-400/70 text-sm font-medium">Successfully matched points after outlier rejection.</p>
               </div>
             ) : (
               <p className="text-slate-400 text-sm italic font-medium">Ready to compute perspective warp...</p>
             )}
          </div>
        </div>
      </div>

      {error && <p className="text-rose-500 text-sm font-medium bg-rose-50 dark:bg-rose-900/20 p-4 rounded-sm border border-rose-100 dark:border-rose-800 text-center">{error}</p>}

      <div className="relative group">
        <div className="relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl aspect-video bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          {result ? (
            <Image src={result} alt="Warped Overlay" fill className="object-contain" unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
              <Wand2 size={64} strokeWidth={1} className="opacity-40 animate-pulse" />
              <p className="font-bold uppercase tracking-[0.2em] text-xs">Awaiting Warp</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
               <div className="relative">
                 <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
                 <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
               </div>
               <span className="text-indigo-900 dark:text-indigo-100 font-black uppercase tracking-widest text-xs">Solving RANSAC...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
