'use client';

import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface ImageCompareProps {
  image1: string;
  image2: string;
  alt1?: string;
  alt2?: string;
}

export function ImageCompare({ image1, image2, alt1 = "Before", alt2 = "After" }: ImageCompareProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={image1} alt={alt1} />}
        itemTwo={<ReactCompareSliderImage src={image2} alt={alt2} />}
        className="w-full aspect-video object-contain"
      />
    </div>
  );
}
