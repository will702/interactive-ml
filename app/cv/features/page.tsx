'use client';

import React from 'react';
import { LessonSection } from '@/components/layout/LessonSection';
import { HarrisDemo } from '@/components/cv/HarrisDemo';
import { FeatureMatching } from '@/components/cv/FeatureMatching';
import { HomographyDemo } from '@/components/cv/HomographyDemo';

export default function FeaturesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-24 pb-20">
      <div className="text-center space-y-6 pt-12">
        <h1 className="text-6xl font-serif font-medium text-slate-900 tracking-tight leading-tight italic [text-wrap:balance]">
          Feature Detection
        </h1>
        <p className="text-sm font-sans text-slate-500 uppercase tracking-[0.4em] max-w-lg mx-auto">
          Identification of Invariant Interest Points and Descriptor Localities
        </p>
        <p className="text-[10px] font-sans text-slate-400 uppercase tracking-[0.25em]">Vol. I · Part 02</p>
        <div className="h-px w-32 bg-slate-200 mx-auto mt-8" />
      </div>

      <LessonSection title="The Harris Operator">
        <p>
          Corners are the most significant local features within an image, characterized by high variance in all directions.
          The <em className="italic">Harris Corner Detector</em> analyzes the local auto-correlation function, effectively measuring intensity changes
          through gradient analysis in the spatial domain.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <HarrisDemo />
          <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Plate 2.1 — Gradient Analysis and Corner Response
          </p>
        </div>
      </LessonSection>

      <LessonSection title="Correspondence & Descriptors">
        <p>
          Beyond simple detection, the challenge of computer vision lies in <em className="italic">matching</em> features across disparate viewpoints.
          Modern algorithms like ORB utilize binary descriptors to represent the neighborhood of a point in a rotationally invariant manner.
        </p>
        <p className="mt-8">
          To ensure robustness, we apply <em className="italic">Lowe&apos;s Ratio Test</em>, filtering matches by comparing the distance of the nearest neighbor
          to that of the second-nearest. This statistical thresholding preserves only the most unique correspondences.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <FeatureMatching />
          <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Plate 2.2 — Keypoint Correspondence under Euclidean Transformation
          </p>
        </div>
      </LessonSection>

      <LessonSection title="Homography & Perspective Projection">
        <p>
          Given a set of point correspondences between two images of a planar surface, we can compute a <em className="italic">Homography</em>:
          a 3x3 projective transformation matrix that maps coordinates from one image plane to another.
        </p>
        <div className="my-16 p-8 bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-sm">
          <HomographyDemo />
          <p className="text-[10px] text-center mt-8 font-sans font-bold text-slate-300 uppercase tracking-widest">
            Plate 2.3 — Planar Warping via Perspective Rectification
          </p>
        </div>
        <p className="mt-8">
          In practice, we employ <em className="italic">RANSAC (Random Sample Consensus)</em> to iteratively estimate this matrix while effectively
          rejecting outlier matches that do not conform to the geometry of the scene.
        </p>
      </LessonSection>
    </div>
  );
}
