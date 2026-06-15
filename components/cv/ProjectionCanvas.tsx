'use client';

import React, { useRef, useEffect } from 'react';
import { CUBE_VERTICES, CUBE_EDGES, buildIntrinsicMatrix, projectPoints } from '@/lib/cv/projection';

interface ProjectionCanvasProps {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  skew?: number;
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
  tz: number;
  width?: number;
  height?: number;
}

export function ProjectionCanvas({
  fx, fy, cx, cy, skew = 0,
  rx, ry, rz, tx, ty, tz,
  width = 640, height = 480
}: ProjectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background - Ivory Scientific Plate
    ctx.fillStyle = '#FDFCFB';
    ctx.fillRect(0, 0, width, height);

    // Compute projection
    const K = buildIntrinsicMatrix(fx, fy, cx, cy, skew);
    const rvec = [rx, ry, rz];
    const tvec = [tx, ty, tz];

    const pixels = projectPoints(CUBE_VERTICES, K, rvec, tvec);

    // Draw cube edges - Charcoal / Oxford Blue
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // Dotted lines for a technical feel
    ctx.beginPath();

    for (const [i, j] of CUBE_EDGES) {
      const p1 = pixels[i];
      const p2 = pixels[j];

      // Skip if behind camera
      if (p1.z <= 0 || p2.z <= 0) continue;

      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Draw vertices
    ctx.setLineDash([]);
    ctx.fillStyle = '#0f172a';
    for (const p of pixels) {
      if (p.z <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [fx, fy, cx, cy, skew, rx, ry, rz, tx, ty, tz, width, height]);

  return (
    <div className="flex flex-col items-center justify-center w-full group">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto rounded-sm shadow-inner border border-slate-100 bg-[#FDFCFB]"
      />
      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] mt-6 text-slate-300 group-hover:text-indigo-900/40 transition-colors">
        Fig 3.B — Projective Manifold (Image Plane)
      </p>
    </div>
  );
}
