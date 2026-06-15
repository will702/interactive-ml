'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { LessonSection } from '@/components/layout/LessonSection';
import { ConvAnimation } from '@/components/cv/ConvAnimation';
import { KernelEditor } from '@/components/cv/KernelEditor';
import { ImageUploader } from '@/components/cv/ImageUploader';
import { ImageCompare } from '@/components/cv/ImageCompare';
import katex from 'katex';
import { KERNELS, ASYMMETRIC_KERNEL } from '@/lib/cv/kernels';
import { applyKernel, convVsCorr } from '@/lib/cv/api';
import { Cpu, Repeat, Square, Loader2, ChevronDown } from 'lucide-react';

export default function FilteringPage() {
  const [activeKernel, setActiveKernel] = useState(KERNELS['Box Blur 3x3']);
  const [sourceImage, setSourceImage] = useState<string | null>('/fruits.jpg');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conv vs Corr state
  const [cvcKernelName, setCvcKernelName] = useState('Asymmetric Shift');
  const [cvcSource, setCvcSource] = useState<string | null>('/fruits.jpg');
  const [cvcConv, setCvcConv] = useState<string | null>(null);
  const [cvcCorr, setCvcCorr] = useState<string | null>(null);
  const [cvcProcessing, setCvcProcessing] = useState(false);
  const [cvcError, setCvcError] = useState<string | null>(null);

  const handleApplyKernel = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await applyKernel(sourceImage, activeKernel);
      setResultImage(`data:image/jpeg;base64,${res.result_image}`);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvVsCorr = async () => {
    if (!cvcSource) return;
    setCvcProcessing(true);
    setCvcError(null);
    try {
      const kernel = cvcKernelName === 'Asymmetric Shift' ? ASYMMETRIC_KERNEL : KERNELS[cvcKernelName];
      const res = await convVsCorr(cvcSource, kernel);
      setCvcConv(`data:image/jpeg;base64,${res.convolution}`);
      setCvcCorr(`data:image/jpeg;base64,${res.correlation}`);
    } catch (e: unknown) {
      setCvcError((e as Error).message);
    } finally {
      setCvcProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-24 pb-20">
      <div className="text-center space-y-6 pt-12">
        <h1 className="text-6xl font-serif font-medium text-slate-900 tracking-tight leading-tight italic [text-wrap:balance]">
          Image Filtering
        </h1>
        <p className="text-sm font-sans text-slate-500 uppercase tracking-[0.4em] max-w-lg mx-auto">
          Principles of Spatial Convolution and Linear Operators
        </p>
        <p className="text-[10px] font-sans text-slate-400 uppercase tracking-[0.25em]">Vol. I · Part 01</p>
        <div className="h-px w-32 bg-slate-200 mx-auto mt-8" />
      </div>

      <LessonSection title="The Anatomy of Convolution">
        <p>
          Convolution is the fundamental operation for image filtering. It involves sliding a small matrix
          called a <em className="italic">kernel</em> over an image. At each position, we multiply the kernel
          values with the underlying image pixels and sum them up to produce a single new pixel in the output image.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <ConvAnimation />
          <p className="text-[10px] text-center mt-6 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Fig. 1.1 — Visualization of the sliding kernel operator
          </p>
        </div>
        <p className="mt-8">
          The mathematical operation for a kernel{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('H', { throwOnError: false }) }} />{' '}
          and image{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('I', { throwOnError: false }) }} />{' '}
          at pixel{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(x, y)', { throwOnError: false }) }} />{' '}
          is expressed as:
        </p>
        <div className="my-10 bg-[#F9F8F6] p-10 rounded-sm border border-slate-200/60 shadow-inner relative overflow-hidden">
          <div className="relative z-10">
            <div dangerouslySetInnerHTML={{ __html: katex.renderToString('(I * H)[x, y] = \\sum_{i=-k}^k \\sum_{j=-k}^k I[x-i, y-j] \\cdot H[i, j]', { throwOnError: false, displayMode: true }) }} />
          </div>
          <div className="absolute top-0 right-0 p-4 font-sans text-[8px] font-bold text-slate-300 uppercase vertical-text">
            Eq. 1.01
          </div>
        </div>
      </LessonSection>

      <LessonSection title="Interactive Laboratory">
        <p className="mb-12">
          Different kernels produce different effects. A <em className="italic">Box Blur</em> averages neighboring pixels,
          while an <em className="italic">Edge Detector</em> like Sobel highlights gradients. Observe the transformation below.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-10">
            <ImageUploader
              label="Input Media"
              currentImage={sourceImage}
              onImageUpload={(b64) => { setSourceImage(b64); setResultImage(null); }}
            />
            <KernelEditor
              kernel={activeKernel}
              onChange={setActiveKernel}
            />
            <button
              onClick={handleApplyKernel}
              disabled={isProcessing || !sourceImage}
              className="group w-full py-4 bg-indigo-900 text-white font-sans font-bold uppercase tracking-[0.2em] text-[10px] rounded-sm hover:bg-indigo-950 disabled:opacity-30 transition-all shadow-md active:scale-95 flex items-center justify-center gap-3"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Cpu size={14} />}
              {isProcessing ? 'Processing...' : 'Apply Operator'}
            </button>
            {error && <p className="text-rose-900 text-[10px] font-sans font-bold bg-rose-50 p-4 border border-rose-100 uppercase tracking-widest">{error}</p>}
          </div>

          <div className="lg:col-span-2">
            <div className="relative group rounded-sm overflow-hidden border border-slate-200 shadow-xl bg-slate-50 min-h-[400px] flex items-center justify-center">
              {sourceImage && resultImage ? (
                <ImageCompare image1={sourceImage} image2={resultImage} alt1="Original" alt2="Filtered" />
              ) : sourceImage ? (
                 <div className="relative w-full aspect-video">
                   <Image src={sourceImage} alt="Source" fill className="object-contain" unoptimized />
                 </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <Square size={48} strokeWidth={1} className="opacity-20" />
                  <p className="font-sans font-bold uppercase tracking-[0.2em] text-[9px]">Select Input to Begin</p>
                </div>
              )}
            </div>
            <p className="text-[9px] text-center mt-4 font-sans font-bold text-slate-300 uppercase tracking-widest">
              Plate 1.A — Output Comparison View
            </p>
          </div>
        </div>
      </LessonSection>

      <LessonSection title="Correlation vs. Convolution">
        <div className="space-y-8">
          <p>
            In deep learning, what we call &ldquo;convolution&rdquo; is mathematically often <strong>correlation</strong>.
            The only difference is that true mathematical convolution requires flipping the kernel horizontally
            and vertically ({' '}
            <span dangerouslySetInnerHTML={{ __html: katex.renderToString('180^\\circ', { throwOnError: false }) }} />{' '}
            rotation) before sliding it over the image.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-10 border border-slate-100 shadow-sm rounded-sm">
            <div className="space-y-6">
              <h4 className="font-sans font-bold uppercase tracking-[0.2em] text-[9px] text-slate-400">Reference Operator</h4>
              <div className="bg-[#F9F8F6] p-6 border border-slate-200/60 flex flex-col items-center gap-6">
                 <div className="w-full relative">
                    <select
                      value={cvcKernelName}
                      onChange={(e) => setCvcKernelName(e.target.value)}
                      className="w-full p-3 pr-10 border border-slate-200 rounded-sm bg-white text-slate-900 font-sans font-bold text-[10px] uppercase tracking-widest appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-900 transition-all"
                    >
                      <option value="Asymmetric Shift">Asymmetric Shift</option>
                      {Object.keys(KERNELS).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                 </div>
                 <div className="text-center">
                    <div dangerouslySetInnerHTML={{ __html: katex.renderToString(cvcKernelName === 'Asymmetric Shift'
                      ? 'K = \\begin{bmatrix} 0 & 0 & 0 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}'
                      : `\\text{${cvcKernelName}}`, { throwOnError: false, displayMode: true }) }} />
                    <p className="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-widest mt-4">
                      {cvcKernelName === 'Asymmetric Shift' ? 'Notice directional shift disparity' : 'Symmetric operator parity'}
                    </p>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <ImageUploader
                label="Target Selection"
                currentImage={cvcSource}
                onImageUpload={setCvcSource}
              />
              <button
                onClick={handleConvVsCorr}
                disabled={cvcProcessing || !cvcSource}
                className="w-full py-4 bg-indigo-900 text-white font-sans font-bold uppercase tracking-[0.2em] text-[10px] rounded-sm hover:bg-indigo-950 disabled:opacity-30 transition-all shadow-md active:scale-95 flex items-center justify-center gap-3"
              >
                {cvcProcessing ? <Loader2 className="animate-spin" size={14} /> : <Repeat size={14} />}
                {cvcProcessing ? 'Computing...' : 'Differentiate'}
              </button>
              {cvcError && <p className="text-rose-900 text-[10px] font-sans font-bold bg-rose-50 p-4 border border-rose-100 uppercase tracking-widest">{cvcError}</p>}
            </div>
          </div>

          {cvcConv && cvcCorr && (
            <div className="space-y-6 pt-8">
              <div className="flex justify-between items-center px-4">
                <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-slate-300">Observation A: Correlation</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-slate-300">Observation B: Convolution</span>
              </div>
              <div className="rounded-sm overflow-hidden border border-slate-200 shadow-2xl bg-white">
                <ImageCompare image1={cvcCorr} image2={cvcConv} alt1="Correlation" alt2="Convolution" />
              </div>
              <p className="text-[9px] text-center mt-4 font-sans font-bold text-slate-300 uppercase tracking-widest">
                Fig. 1.2 — Disparity between correlation and convolution
              </p>
            </div>
          )}
        </div>
      </LessonSection>
    </div>
  );
}
