'use client';

import React from 'react';
import katex from 'katex';
import { LessonSection } from '@/components/layout/LessonSection';
import { EpipolarDemo } from '@/components/cv/EpipolarDemo';
import { TriangulationViewer } from '@/components/cv/TriangulationViewer';
import { TriangulationLab } from '@/components/cv/TriangulationLab';

export default function EpipolarPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-24 pb-20">
      <div className="text-center space-y-6 pt-12">
        <h1 className="text-6xl font-serif font-medium text-slate-900 tracking-tight leading-tight italic [text-wrap:balance]">
          Epipolar Geometry
        </h1>
        <p className="text-sm font-sans text-slate-500 uppercase tracking-[0.4em] max-w-lg mx-auto">
          Projective Constraints and Spatial Reconstruction in Stereo Vision
        </p>
        <p className="text-[10px] font-sans text-slate-400 uppercase tracking-[0.25em]">Vol. I · Part 04</p>
        <div className="h-px w-32 bg-slate-200 mx-auto mt-8" />
      </div>

      <LessonSection title={
        <>
          The Fundamental Constraint{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('F', { throwOnError: false }) }} />
        </>
      }>
        <div className="space-y-8">
          <p>
            The <em className="italic">Fundamental Matrix F</em> encapsulates the algebraic representation of epipolar geometry between two uncalibrated views.
            It relates corresponding points in stereo images through a rigorous projective constraint.
          </p>
          <p className="text-lg">
            Given a point in the primary image plane, its correspondence in the secondary view is constrained to a singular <em className="italic">Epipolar Line</em>.
            This search-space reduction is the cornerstone of efficient stereo matching algorithms.
          </p>
          <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
            <EpipolarDemo />
            <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
              Plate 4.1 — Visualization of Epipolar Line Constraints
            </p>
          </div>
        </div>
      </LessonSection>

      <LessonSection title="Principles of Triangulation">
        <p className="text-lg">
          To reconstruct the depth of a scene, we must reverse the projection process. Through <em className="italic">Triangulation</em>,
          we project rays from the optical centers through matching image coordinates. The intersection of these rays in Euclidean space
          defines the 3D position of the point.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <TriangulationLab />
          <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Plate 4.2 — Ray Intersection and Coordinate Crystallization
          </p>
        </div>
      </LessonSection>

      <LessonSection title={
        <>
          Spatial Reconstruction via{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('E', { throwOnError: false }) }} />
        </>
      }>
        <p className="text-lg">
          When camera intrinsics are known, we employ the <em className="italic">Essential Matrix E</em> to recover the precise relative pose
          of the stereo pair. This enabling step allows for the generation of metric 3D point clouds.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <TriangulationViewer />
          <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Plate 4.3 — Sparse 3D Point Cloud Generation
          </p>
        </div>
      </LessonSection>
    </div>
  );
}
