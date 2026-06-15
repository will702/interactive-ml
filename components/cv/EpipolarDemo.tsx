'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImageUploader } from './ImageUploader';
import { computeFundamental } from '@/lib/cv/api';
import { MousePointer2, Calculator, Info, Loader2 } from 'lucide-react';

export function EpipolarDemo() {
  const [image1, setImage1] = useState<string | null>('/left01.jpg');
  const [image2, setImage2] = useState<string | null>('/right01.jpg');
  const [fMatrix, setFMatrix] = useState<number[][] | null>(null);
  const [inliers, setInliers] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgNaturalDims, setImgNaturalDims] = useState({ w: 640, h: 480 });

  // Points stored in image (natural) coordinate space
  const [points, setPoints] = useState<{ x: number, y: number, color: string }[]>([]);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  const colors = ['#6366F1', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'];

  // Display dimensions: fixed width, height maintains aspect ratio
  const DISPLAY_W = 640;
  const displayH = imgNaturalDims.h > 0
    ? Math.round(imgNaturalDims.h * DISPLAY_W / imgNaturalDims.w)
    : 480;
  const scaleX = imgNaturalDims.w / DISPLAY_W;
  const scaleY = imgNaturalDims.h / displayH;

  useEffect(() => {
    if (!image1) return;
    const img = new window.Image();
    img.onload = () => setImgNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = image1;
  }, [image1]);

  const handleComputeF = async () => {
    if (!image1 || !image2) return;
    setIsProcessing(true);
    setError(null);
    setFMatrix(null);
    setPoints([]);

    try {
      const res = await computeFundamental(image1, image2, 3000, 0.75, 1.0);
      setFMatrix((res as { F_matrix: number[][] }).F_matrix);
      setInliers((res as { inlier_count: number }).inlier_count);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImage1Click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!fMatrix || !canvas1Ref.current) return;
    const rect = canvas1Ref.current.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;

    const imgX = dispX * scaleX;
    const imgY = dispY * scaleY;

    const color = colors[points.length % colors.length];
    setPoints([...points, { x: imgX, y: imgY, color }]);
  };

  useEffect(() => {
    if (!canvas1Ref.current || !canvas2Ref.current || !fMatrix) return;
    const ctx1 = canvas1Ref.current.getContext('2d');
    const ctx2 = canvas2Ref.current.getContext('2d');
    if (!ctx1 || !ctx2) return;

    const DW = canvas1Ref.current.width;
    const DH = canvas1Ref.current.height;

    ctx1.clearRect(0, 0, DW, DH);
    ctx2.clearRect(0, 0, DW, DH);

    points.forEach(p => {
      const dx = p.x / scaleX;
      const dy = p.y / scaleY;

      ctx1.beginPath();
      ctx1.arc(dx, dy, 6, 0, 2 * Math.PI);
      ctx1.fillStyle = p.color;
      ctx1.fill();
      ctx1.lineWidth = 2;
      ctx1.strokeStyle = 'white';
      ctx1.stroke();

      const p3 = [p.x, p.y, 1];
      const a = fMatrix[0][0]*p3[0] + fMatrix[0][1]*p3[1] + fMatrix[0][2]*p3[2];
      const b = fMatrix[1][0]*p3[0] + fMatrix[1][1]*p3[1] + fMatrix[1][2]*p3[2];
      const c = fMatrix[2][0]*p3[0] + fMatrix[2][1]*p3[1] + fMatrix[2][2]*p3[2];

      const a_d = a * scaleX;
      const b_d = b * scaleY;

      ctx2.beginPath();
      if (Math.abs(b_d) > 1e-6) {
        const x0 = 0, x1 = DW;
        const y0 = -(a_d * x0 + c) / b_d;
        const y1 = -(a_d * x1 + c) / b_d;
        ctx2.moveTo(x0, y0);
        ctx2.lineTo(x1, y1);
      } else if (Math.abs(a_d) > 1e-6) {
        const x0 = -c / a_d;
        ctx2.moveTo(x0, 0);
        ctx2.lineTo(x0, DH);
      }
      ctx2.strokeStyle = p.color;
      ctx2.lineWidth = 3;
      ctx2.stroke();
    });

  }, [points, fMatrix, scaleX, scaleY]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ImageUploader label="Left View" currentImage={image1} onImageUpload={setImage1} />
        <ImageUploader label="Right View" currentImage={image2} onImageUpload={setImage2} />
      </div>

      <div className="flex flex-col items-center justify-center space-y-6">
        <button
          onClick={handleComputeF}
          disabled={isProcessing || !image1 || !image2}
          className="group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-3xl transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Calculator size={18} />}
          {isProcessing ? 'Solving Geometry...' : 'Compute Fundamental Matrix'}
        </button>
        {error && <p className="text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 px-6 py-3 rounded-2xl border border-rose-100 dark:border-rose-800">{error}</p>}
        {inliers != null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-800/50 text-xs font-black uppercase tracking-widest">
            RANSAC Inliers: {inliers}
          </div>
        )}
      </div>

      {fMatrix ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="flex items-start gap-4 mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Info size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Interactive Constraint Check</p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                The Fundamental Matrix is now estimated. <span className="text-indigo-600 dark:text-indigo-400 font-black">Click on the left image</span> to project its corresponding epipolar line onto the right view.
              </p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 justify-center items-center">
            {/* Image 1 */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projective Plane 1</span>
              <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800" style={{ width: DISPLAY_W, height: displayH }}>
                <Image src={image1!} alt="Image 1" fill className="object-contain" unoptimized />
                <canvas
                  ref={canvas1Ref}
                  width={DISPLAY_W}
                  height={displayH}
                  className="absolute inset-0 cursor-crosshair z-10"
                  onClick={handleImage1Click}
                />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                 <MousePointer2 size={14} />
                 Click to select point
              </div>
            </div>

            {/* Image 2 */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projective Plane 2</span>
              <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800" style={{ width: DISPLAY_W, height: displayH }}>
                <Image src={image2!} alt="Image 2" fill className="object-contain" unoptimized />
                <canvas
                  ref={canvas2Ref}
                  width={DISPLAY_W}
                  height={displayH}
                  className="absolute inset-0 pointer-events-none z-10"
                />
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                 <Calculator size={14} />
                 Constrained line projection
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-64 bg-slate-100 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-400">
           <Calculator size={48} strokeWidth={1} className="opacity-20" />
           <p className="font-bold uppercase tracking-widest text-xs">Awaiting Matrix Computation</p>
        </div>
      )}
    </div>
  );
}
