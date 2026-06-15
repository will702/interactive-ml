'use client';

import React from 'react';
import katex from 'katex';
import { LessonSection } from '@/components/layout/LessonSection';
import { IntrinsicDemo } from '@/components/cv/IntrinsicDemo';
import { ExtrinsicDemo } from '@/components/cv/ExtrinsicDemo';
import { Callout } from '@/components/layout/Callout';

export default function CameraModelPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-24 pb-20">
      <div className="text-center space-y-6 pt-12 max-w-4xl mx-auto">
        <h1 className="text-6xl font-serif font-medium text-slate-900 tracking-tight leading-tight italic [text-wrap:balance]">
          Camera Geometry
        </h1>
        <p className="text-sm font-sans text-slate-500 uppercase tracking-[0.4em] max-w-lg mx-auto">
          Projective Mapping from Euclidean Space to the Image Plane
        </p>
        <p className="text-[10px] font-sans text-slate-400 uppercase tracking-[0.25em]">Vol. I · Part 03</p>
        <div className="h-px w-32 bg-slate-200 mx-auto mt-8" />
      </div>

      <LessonSection title="The Pinhole Paradigm">
        <div className="space-y-8">
          <p>
            In computer vision, the transformation of the three-dimensional world onto a two-dimensional manifold is classically modeled via
            the <em className="italic">Pinhole Camera Model</em>. This mathematical abstraction decomposes the projection into two essential components:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="mt-2 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-base font-serif italic text-slate-700">
                    <strong className="not-italic font-sans font-bold uppercase tracking-widest text-[10px] text-slate-500 mr-2">Extrinsics:</strong>
                    Representing the rigid body transformation{' '}
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(R, t)', { throwOnError: false }) }} />{' '}
                    from world coordinates to the camera frame.
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-2 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-base font-serif italic text-slate-700">
                    <strong className="not-italic font-sans font-bold uppercase tracking-widest text-[10px] text-slate-500 mr-2">Intrinsics:</strong>
                    Defining the internal projection{' '}
                    <span dangerouslySetInnerHTML={{ __html: katex.renderToString('K', { throwOnError: false }) }} />{' '}
                    that maps 3D rays onto discrete pixel coordinates.
                  </span>
                </li>
              </ul>
            </div>
            <Callout title="Instructional Scope" type="info">
              This module explores the relationship between focal length{' '}
              <span dangerouslySetInnerHTML={{ __html: katex.renderToString('f', { throwOnError: false }) }} />{' '}
              and perspectival distortion, while visualizing the relative motion{' '}
              <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(R, t)', { throwOnError: false }) }} />{' '}
              of the optical center.
            </Callout>
          </div>
        </div>
      </LessonSection>

      <LessonSection title="Intrinsic Calibration (K)">
        <p className="mb-12">
          The intrinsic matrix <em className="italic">K</em> encapsulates the internal geometry of the optical system.
          Through the interactive plate below, observe how focal length and principal point offsets distort the projection.
        </p>
        <div className="my-12">
          <IntrinsicDemo />
          <p className="text-[10px] text-center mt-6 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Fig. 3.1 — Focal length and principal point under the intrinsic matrix K
          </p>
        </div>
        <Callout title="Optical Magnification" type="tip">
          Increasing the focal parameters{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('(f_x, f_y)', { throwOnError: false }) }} />{' '}
          effectively narrows the viewing frustum, resulting in a linear magnification of the observed features.
        </Callout>
      </LessonSection>

      <LessonSection title={
        <>
          Extrinsic Orientation{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('[R | t]', { throwOnError: false }) }} />
        </>
      }>
        <p className="mb-12">
          The extrinsic parameters define the camera&apos;s pose relative to a global coordinate system, enabling the transformation of world points into the local optical reference.
        </p>
        <div className="my-12">
          <ExtrinsicDemo />
          <p className="text-[10px] text-center mt-6 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Fig. 3.2 — Camera pose [R | t] relative to the world frame
          </p>
        </div>
        <Callout title="The Optical Axis" type="info">
          In our convention, the Z-axis projects forward into the scene. For an object to remain within the visible frustum, its translation{' '}
          <span dangerouslySetInnerHTML={{ __html: katex.renderToString('T_z', { throwOnError: false }) }} />{' '}
          must remain positive relative to the camera origin.
        </Callout>
      </LessonSection>
    </div>
  );
}
