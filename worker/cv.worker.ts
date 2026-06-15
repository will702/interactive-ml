/// <reference lib="webworker" />

/* eslint-disable @typescript-eslint/no-explicit-any */

// Declare the cv object for the worker context
declare const cv: any;

// Self-hosted OpenCV.js (see public/vendor/). Resolved against the page
// origin because relative paths resolve against the bundled worker chunk.
const OPENCV_URL = new URL('/vendor/opencv.js', self.location.origin).href;

function signalWhenReady() {
  const checkReady = () => {
    if (typeof cv !== 'undefined' && cv.Mat) {
      postMessage({ type: 'READY' });
    } else {
      setTimeout(checkReady, 100);
    }
  };

  if (typeof cv !== 'undefined' && cv.onRuntimeInitialized) {
    const original = cv.onRuntimeInitialized;
    cv.onRuntimeInitialized = () => {
      if (original) original();
      postMessage({ type: 'READY' });
    };
  } else {
    checkReady();
  }
}

/**
 * Handle worker initialization
 */
async function initOpenCV() {
  try {
    try {
      importScripts(OPENCV_URL);
    } catch {
      // importScripts is unavailable in module workers — fall back to
      // fetching the script and evaluating it in the global scope.
      const res = await fetch(OPENCV_URL);
      if (!res.ok) throw new Error(`fetch ${OPENCV_URL} → HTTP ${res.status}`);
      (0, eval)(await res.text());
    }
    signalWhenReady();
  } catch (e) {
    console.error('Failed to load OpenCV in worker:', e);
    const detail = e instanceof Error ? e.message : String(e);
    postMessage({ type: 'ERROR', error: `Failed to load OpenCV.js: ${detail}` });
  }
}

initOpenCV();

/**
 * Helper to convert ImageData to cv.Mat
 */
function imageDataToMat(imageData: ImageData): any {
  return cv.matFromImageData(imageData);
}

/**
 * Helper to convert cv.Mat back to ImageData
 */
function matToImageData(mat: any): ImageData {
  const dst = new cv.Mat();
  if (mat.channels() === 1) {
    cv.cvtColor(mat, dst, cv.COLOR_GRAY2RGBA);
  } else if (mat.channels() === 3) {
    cv.cvtColor(mat, dst, cv.COLOR_RGB2RGBA);
  } else {
    mat.copyTo(dst);
  }
  
  const imageData = new ImageData(
    new Uint8ClampedArray(dst.data),
    dst.cols,
    dst.rows
  );
  dst.delete();
  return imageData;
}

// ===================================================================
// Pure-JS epipolar geometry helpers
// cv.findFundamentalMat / cv.triangulatePoints / cv.recoverPose AND
// cv.SVDecomp are NOT exported in the standard docs.opencv.org build.
// All implemented here with pure-JS Jacobi eigendecomposition.
// ===================================================================

/** General matrix multiply: A(rA×cA) × B(cA×cB) → flat row-major result */
function mmul(A: number[], rA: number, cA: number, B: number[], cB: number): number[] {
  const C = new Array(rA * cB).fill(0);
  for (let i = 0; i < rA; i++)
    for (let k = 0; k < cA; k++) {
      const aik = A[i * cA + k];
      for (let j = 0; j < cB; j++)
        C[i * cB + j] += aik * B[k * cB + j];
    }
  return C;
}

/** Transpose A(r×c) → A^T(c×r), flat row-major */
function mtrG(A: number[], r: number, c: number): number[] {
  const T = new Array(r * c).fill(0);
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++)
      T[j * r + i] = A[i * c + j];
  return T;
}

/**
 * Jacobi cyclic eigendecomposition of real symmetric n×n matrix.
 * Returns { values: eigenvalues (descending), V: eigenvectors as COLUMNS, flat row-major }
 */
function jacobiEig(Ain: number[], n: number): { values: number[], V: number[] } {
  const S = Ain.slice();
  const V: number[] = Array.from({ length: n * n }, (_, i) => (Math.floor(i / n) === i % n ? 1 : 0));
  for (let sweep = 0; sweep < 60; sweep++) {
    let offDiag = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        offDiag += S[i * n + j] * S[i * n + j];
    if (offDiag < 1e-28) break;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const Spq = S[p * n + q];
        if (Math.abs(Spq) < 1e-15) continue;
        const Spp = S[p * n + p], Sqq = S[q * n + q];
        const theta = (Sqq - Spp) / (2 * Spq);
        // Math.sign(0)=0 breaks equal-eigenvalue case; use explicit sign
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(1 + t * t), s = t * c;
        for (let k = 0; k < n; k++) {
          if (k !== p && k !== q) {
            const Skp = S[k * n + p], Skq = S[k * n + q];
            S[k * n + p] = S[p * n + k] = c * Skp - s * Skq;
            S[k * n + q] = S[q * n + k] = s * Skp + c * Skq;
          }
        }
        S[p * n + p] = c*c*Spp - 2*s*c*Spq + s*s*Sqq;
        S[q * n + q] = s*s*Spp + 2*s*c*Spq + c*c*Sqq;
        S[p * n + q] = S[q * n + p] = 0;
        for (let k = 0; k < n; k++) {
          const Vkp = V[k * n + p], Vkq = V[k * n + q];
          V[k * n + p] = c * Vkp - s * Vkq;
          V[k * n + q] = s * Vkp + c * Vkq;
        }
      }
    }
  }
  const vals = Array.from({ length: n }, (_, i) => S[i * n + i]);
  const order = vals.map((v, i) => [v, i] as [number, number]).sort((a, b) => b[0] - a[0]);
  const sortedVals = order.map(x => x[0]);
  const sortedV = new Array(n * n).fill(0);
  for (let j = 0; j < n; j++) {
    const origJ = order[j][1];
    for (let i = 0; i < n; i++) sortedV[i * n + j] = V[i * n + origJ];
  }
  return { values: sortedVals, V: sortedV };
}

/**
 * Economy SVD of A (m×n, m≥n).
 * Returns { U: m×n, S: n singular values (desc), Vt: n×n } — all flat row-major.
 */
function svdEco(A: number[], m: number, n: number): { U: number[], S: number[], Vt: number[] } {
  const At = mtrG(A, m, n);
  const AtA = mmul(At, n, m, A, n);
  const { values, V } = jacobiEig(AtA, n);
  const S = values.map(v => Math.sqrt(Math.max(0, v)));
  const Vt = mtrG(V, n, n);
  const U = new Array(m * n).fill(0);
  for (let j = 0; j < n; j++) {
    const sig = S[j];
    if (sig < 1e-12) continue;
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += A[i * n + k] * V[k * n + j];
      U[i * n + j] = sum / sig;
    }
  }
  // For rank-deficient matrices (e.g. essential matrix is always rank 2),
  // zero-singular-value U columns are left as zeros above.
  // For 3×3: complete the orthonormal basis via cross product.
  // U is row-major: col j = [U[j], U[3+j], U[6+j]]
  if (m === 3 && n === 3 && S[2] < 1e-12) {
    // u2 = col0 × col1
    U[2] = U[3]*U[7] - U[6]*U[4];
    U[5] = U[6]*U[1] - U[0]*U[7];
    U[8] = U[0]*U[4] - U[3]*U[1];
    // Normalize (should already be unit, but guard against float error)
    const nu = Math.hypot(U[2], U[5], U[8]) || 1;
    U[2] /= nu; U[5] /= nu; U[8] /= nu;
  }
  return { U, S, Vt };
}

/**
 * Null space of A (m×n): returns the right singular vector for the
 * smallest singular value — i.e. the last column of V.
 */
function nullVec(A: number[], m: number, n: number): number[] {
  const At = mtrG(A, m, n);
  const AtA = mmul(At, n, m, A, n);
  const { V } = jacobiEig(AtA, n);
  // Last column of V (smallest eigenvalue)
  const result = new Array(n);
  for (let i = 0; i < n; i++) result[i] = V[i * n + (n - 1)];
  return result;
}

/** 3×3 (flat, row-major) × 3-vector */
function m3v(M: number[], v: number[]): number[] {
  return [
    M[0]*v[0]+M[1]*v[1]+M[2]*v[2],
    M[3]*v[0]+M[4]*v[1]+M[5]*v[2],
    M[6]*v[0]+M[7]*v[1]+M[8]*v[2],
  ];
}

/** 3×3 × 3×3 (flat row-major) */
function m3m(A: number[], B: number[]): number[] {
  const C = new Array(9).fill(0);
  for (let i=0;i<3;i++) for(let k=0;k<3;k++) for(let j=0;j<3;j++) C[i*3+j]+=A[i*3+k]*B[k*3+j];
  return C;
}

/** 3×3 transpose (flat row-major) */
function m3t(A: number[]): number[] {
  return [A[0],A[3],A[6],A[1],A[4],A[7],A[2],A[5],A[8]];
}

/** 3×3 determinant */
function m3det(A: number[]): number {
  return A[0]*(A[4]*A[8]-A[5]*A[7])-A[1]*(A[3]*A[8]-A[5]*A[6])+A[2]*(A[3]*A[7]-A[4]*A[6]);
}

/** Sampson distance (squared) for point pair and fundamental matrix F */
function sampsonDist(F: number[], p1x: number, p1y: number, p2x: number, p2y: number): number {
  // l2 = F * [p1x, p1y, 1]
  const l0 = F[0]*p1x+F[1]*p1y+F[2];
  const l1 = F[3]*p1x+F[4]*p1y+F[5];
  const l2 = F[6]*p1x+F[7]*p1y+F[8];
  // m = F^T * [p2x, p2y, 1]
  const m0 = F[0]*p2x+F[3]*p2y+F[6];
  const m1 = F[1]*p2x+F[4]*p2y+F[7];
  const num = p2x*l0+p2y*l1+l2;
  return (num*num)/(l0*l0+l1*l1+m0*m0+m1*m1+1e-15);
}

/**
 * Compute F from n≥8 already-normalized point pairs using 8-point algorithm.
 * Pure-JS: null-space via Jacobi eigen, rank-2 enforcement via SVD.
 * Returns flat 9-element row-major F or null.
 */
function eightPointF(nx1: number[], ny1: number[], nx2: number[], ny2: number[]): number[] | null {
  const n = nx1.length;
  if (n < 8) return null;
  try {
    // Build N×9 constraint matrix A (row-major)
    const Adata: number[] = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1, x2, y2] = [nx1[i], ny1[i], nx2[i], ny2[i]];
      Adata.push(x1*x2, y1*x2, x2, x1*y2, y1*y2, y2, x1, y1, 1);
    }
    // Null space of A → 9-vector f
    const fRaw = nullVec(Adata, n, 9);

    // Enforce rank-2: SVD of 3×3 F, zero out smallest singular value
    const { U, S, Vt } = svdEco(fRaw, 3, 3);
    const D = [S[0],0,0, 0,S[1],0, 0,0,0];
    const UD = mmul(U, 3, 3, D, 3);
    return mmul(UD, 3, 3, Vt, 3);
  } catch { return null; }
}

/**
 * Compute fundamental matrix with normalized 8-point algorithm + RANSAC.
 * All point inputs are flat interleaved [x0,y0,x1,y1,...] arrays.
 */
function findFundamental(
  srcPts: number[], dstPts: number[],
  threshold = 1.0, maxIter = 1000
): { F: number[], mask: number[] } {
  const n = srcPts.length / 2;
  const px1 = srcPts.filter((_,i)=>i%2===0), py1 = srcPts.filter((_,i)=>i%2===1);
  const px2 = dstPts.filter((_,i)=>i%2===0), py2 = dstPts.filter((_,i)=>i%2===1);

  // Normalize all N points
  let m1x=0,m1y=0,m2x=0,m2y=0;
  for (let i=0;i<n;i++){m1x+=px1[i];m1y+=py1[i];m2x+=px2[i];m2y+=py2[i];}
  m1x/=n;m1y/=n;m2x/=n;m2y/=n;
  let s1=0,s2=0;
  for (let i=0;i<n;i++){s1+=Math.hypot(px1[i]-m1x,py1[i]-m1y);s2+=Math.hypot(px2[i]-m2x,py2[i]-m2y);}
  s1=Math.sqrt(2)*n/(s1||1); s2=Math.sqrt(2)*n/(s2||1);
  const nx1=px1.map(x=>s1*(x-m1x)), ny1=py1.map(y=>s1*(y-m1y));
  const nx2=px2.map(x=>s2*(x-m2x)), ny2=py2.map(y=>s2*(y-m2y));
  const T1=[s1,0,-s1*m1x, 0,s1,-s1*m1y, 0,0,1];
  const T2=[s2,0,-s2*m2x, 0,s2,-s2*m2y, 0,0,1];
  const T2t=m3t(T2);

  let bestF=new Array(9).fill(0), bestMask=new Array(n).fill(0), bestCount=0;
  const thresh2=threshold*threshold;

  for (let iter=0;iter<maxIter;iter++){
    const idx: number[]=[], used=new Set<number>();
    while(idx.length<8){const r=Math.floor(Math.random()*n);if(!used.has(r)){used.add(r);idx.push(r);}}
    const Fn=eightPointF(idx.map(i=>nx1[i]),idx.map(i=>ny1[i]),idx.map(i=>nx2[i]),idx.map(i=>ny2[i]));
    if(!Fn) continue;
    const F=m3m(m3m(T2t,Fn),T1);
    const mask=new Array(n).fill(0); let count=0;
    for(let i=0;i<n;i++){if(sampsonDist(F,px1[i],py1[i],px2[i],py2[i])<thresh2){mask[i]=1;count++;}}
    if(count>bestCount){bestCount=count;bestF=F;bestMask=mask;if(count>n*0.9)break;}
  }

  // Refit on all inliers
  if(bestCount>=8){
    const ii=bestMask.map((v,i)=>v?i:-1).filter(i=>i>=0);
    const Fn=eightPointF(ii.map(i=>nx1[i]),ii.map(i=>ny1[i]),ii.map(i=>nx2[i]),ii.map(i=>ny2[i]));
    if(Fn) bestF=m3m(m3m(T2t,Fn),T1);
  }
  return {F:bestF,mask:bestMask};
}

/** DLT triangulation of a single point given P1,P2 (flat 12-elem row-major 3×4) */
function triangulatePt(P1: number[], P2: number[], x1: number, y1: number, x2: number, y2: number): number[] {
  const Ad = [
    x1*P1[8]-P1[0], x1*P1[9]-P1[1], x1*P1[10]-P1[2], x1*P1[11]-P1[3],
    y1*P1[8]-P1[4], y1*P1[9]-P1[5], y1*P1[10]-P1[6], y1*P1[11]-P1[7],
    x2*P2[8]-P2[0], x2*P2[9]-P2[1], x2*P2[10]-P2[2], x2*P2[11]-P2[3],
    y2*P2[8]-P2[4], y2*P2[9]-P2[5], y2*P2[10]-P2[6], y2*P2[11]-P2[7],
  ];
  const v = nullVec(Ad, 4, 4);
  const W = v[3] || 1e-15;
  return [v[0]/W, v[1]/W, v[2]/W];
}

/** Build P2 = K(3×3) × [R|t] as flat 12-elem row-major 3×4 */
function buildP2(Kd: number[], Rd: number[], td: number[]): number[] {
  const Rt=[Rd[0],Rd[1],Rd[2],td[0], Rd[3],Rd[4],Rd[5],td[1], Rd[6],Rd[7],Rd[8],td[2]];
  const P=new Array(12).fill(0);
  for(let i=0;i<3;i++) for(let j=0;j<4;j++) for(let k=0;k<3;k++) P[i*4+j]+=Kd[i*3+k]*Rt[k*4+j];
  return P;
}

/**
 * Recover (R, t) from essential matrix E via SVD.
 * Pure-JS: uses svdEco (Jacobi-based) for the decomposition.
 * Chirality check over a sample of correspondences selects correct combo.
 */
function recoverPoseJS(
  Ed: number[], px1: number[], py1: number[], px2: number[], py2: number[], Kd: number[]
): { R: number[], t: number[] } {
  const { U, Vt } = svdEco(Ed, 3, 3);

  const W  = [0,-1,0, 1,0,0, 0,0,1];
  const WT = [0, 1,0,-1,0,0, 0,0,1];
  const tpos = [U[2], U[5], U[8]], tneg = [-U[2], -U[5], -U[8]];

  let R1 = mmul(mmul(U, 3, 3, W, 3), 3, 3, Vt, 3);
  let R2 = mmul(mmul(U, 3, 3, WT, 3), 3, 3, Vt, 3);
  if (m3det(R1) < 0) R1 = R1.map(v => -v);
  if (m3det(R2) < 0) R2 = R2.map(v => -v);

  const combos = [{R:R1,t:tpos},{R:R1,t:tneg},{R:R2,t:tpos},{R:R2,t:tneg}];
  const P1 = [Kd[0],Kd[1],Kd[2],0, Kd[3],Kd[4],Kd[5],0, Kd[6],Kd[7],Kd[8],0];
  let bestR = combos[0].R, bestT = combos[0].t, bestCount = -1;
  const testN = Math.min(20, px1.length);

  for (const {R, t} of combos) {
    const P2 = buildP2(Kd, R, t); let count = 0;
    for (let i = 0; i < testN; i++) {
      const pt = triangulatePt(P1, P2, px1[i], py1[i], px2[i], py2[i]);
      const z2 = R[6]*pt[0]+R[7]*pt[1]+R[8]*pt[2]+t[2];
      if (pt[2] > 0 && z2 > 0) count++;
    }
    if (count > bestCount) { bestCount = count; bestR = R; bestT = t; }
  }
  return { R: bestR, t: bestT };
}

/**
 * Worker message handler
 */
onmessage = async (e) => {
  const { id, type, payload } = e.data;

  try {
    let result: any = null;

    switch (type) {
      case 'APPLY_KERNEL': {
        const { imageData, kernel } = payload;
        const src = imageDataToMat(imageData);
        const dst = new cv.Mat();
        const kernelMat = cv.matFromArray(kernel.length, kernel[0].length, cv.CV_32F, kernel.flat());
        
        // For derivative kernels (Sobel, Laplacian) that sum to ~0, 
        // add an offset of 128 to visualize negative values as darker gray.
        const kernelSum = kernel.flat().reduce((a: any, b: any) => a + b, 0);
        const delta = Math.abs(kernelSum) < 0.01 ? 128 : 0;
        
        cv.filter2D(src, dst, cv.CV_8U, kernelMat, new cv.Point(-1, -1), delta, cv.BORDER_DEFAULT);
        result = matToImageData(dst);
        src.delete(); dst.delete(); kernelMat.delete();
        break;
      }

      case 'CONV_VS_CORR': {
        const { imageData, kernel } = payload;
        const src = imageDataToMat(imageData);
        const dstCorr = new cv.Mat();
        const dstConv = new cv.Mat();
        const kernelMat = cv.matFromArray(kernel.length, kernel[0].length, cv.CV_32F, kernel.flat());
        
        const kernelSum = kernel.flat().reduce((a: any, b: any) => a + b, 0);
        const delta = Math.abs(kernelSum) < 0.01 ? 128 : 0;

        cv.filter2D(src, dstCorr, cv.CV_8U, kernelMat, new cv.Point(-1, -1), delta, cv.BORDER_DEFAULT);
        
        const flippedKernel = new cv.Mat();
        cv.flip(kernelMat, flippedKernel, -1);
        cv.filter2D(src, dstConv, cv.CV_8U, flippedKernel, new cv.Point(-1, -1), delta, cv.BORDER_DEFAULT);
        
        result = {
          convolution: matToImageData(dstConv),
          correlation: matToImageData(dstCorr)
        };
        
        src.delete(); dstCorr.delete(); dstConv.delete();
        kernelMat.delete(); flippedKernel.delete();
        break;
      }

      case 'HARRIS_CORNERS': {
        const { imageData, blockSize, ksize, k, thresholdRatio } = payload;
        const src = imageDataToMat(imageData);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        const dst = new cv.Mat();
        cv.cornerHarris(gray, dst, blockSize, ksize, k, cv.BORDER_DEFAULT);
        
        // Find max response for relative thresholding
        const data = dst.data32F;
        let maxVal = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > maxVal) maxVal = data[i];
        }
        
        const threshold = maxVal * thresholdRatio;
        const marked = src.clone();
        let count = 0;
        
        const rows = dst.rows;
        const cols = dst.cols;
        
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            if (data[i * cols + j] > threshold) {
              count++;
              cv.circle(marked, new cv.Point(j, i), 2, new cv.Scalar(255, 0, 0, 255), -1);
            }
          }
        }
        
        result = { resultImage: matToImageData(marked), cornerCount: count };
        src.delete(); gray.delete(); dst.delete(); marked.delete();
        break;
      }

      case 'DETECT_FEATURES': {
        const { imageData, method, nFeatures } = payload;
        const src = imageDataToMat(imageData);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        // SIFT was removed from upstream opencv.js builds; AKAZE is the
        // non-binary alternative this build ships.
        const detector = method === 'AKAZE' ? new cv.AKAZE() : new cv.ORB(nFeatures);
        const keypoints = new cv.KeyPointVector();
        const descriptors = new cv.Mat();
        detector.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);
        const marked = new cv.Mat();
        cv.drawKeypoints(src, keypoints, marked, new cv.Scalar(0, 255, 0, 255), cv.DrawMatchesFlags_DRAW_RICH_KEYPOINTS);
        result = { resultImage: matToImageData(marked), keypointCount: keypoints.size() };
        src.delete(); gray.delete(); keypoints.delete(); descriptors.delete(); marked.delete();
        if (detector.delete) detector.delete();
        break;
      }

      case 'MATCH_FEATURES': {
        const { imageData1, imageData2, nFeatures, ratio } = payload;
        const src1 = imageDataToMat(imageData1);
        const src2 = imageDataToMat(imageData2);
        const gray1 = new cv.Mat();
        const gray2 = new cv.Mat();
        cv.cvtColor(src1, gray1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(src2, gray2, cv.COLOR_RGBA2GRAY);
        const orb = new cv.ORB(nFeatures);
        const kp1 = new cv.KeyPointVector();
        const kp2 = new cv.KeyPointVector();
        const des1 = new cv.Mat();
        const des2 = new cv.Mat();
        orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
        orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(des1, des2, matches, 2);
        const goodMatches = new cv.DMatchVector();
        for (let i = 0; i < matches.size(); i++) {
          const m = matches.get(i);
          if (m.size() === 2) {
            const first = m.get(0);
            if (first.distance < ratio * m.get(1).distance) goodMatches.push_back(first);
          }
        }
        const marked = new cv.Mat();
        cv.drawMatches(src1, kp1, src2, kp2, goodMatches, marked, new cv.Scalar(0, 255, 0, 255), new cv.Scalar(255, 0, 0, 255));
        result = { resultImage: matToImageData(marked), matchCount: goodMatches.size() };
        src1.delete(); src2.delete(); gray1.delete(); gray2.delete(); kp1.delete(); kp2.delete(); 
        des1.delete(); des2.delete(); bf.delete(); matches.delete(); goodMatches.delete(); marked.delete(); orb.delete();
        break;
      }

      case 'ESTIMATE_HOMOGRAPHY': {
        const { imageData1, imageData2, nFeatures, ratio, ransacThreshold } = payload;
        const src1 = imageDataToMat(imageData1);
        const src2 = imageDataToMat(imageData2);
        const gray1 = new cv.Mat();
        const gray2 = new cv.Mat();
        cv.cvtColor(src1, gray1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(src2, gray2, cv.COLOR_RGBA2GRAY);
        const orb = new cv.ORB(nFeatures);
        const kp1 = new cv.KeyPointVector();
        const kp2 = new cv.KeyPointVector();
        const des1 = new cv.Mat();
        const des2 = new cv.Mat();
        orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
        orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(des1, des2, matches, 2);
        const srcPts: number[] = [];
        const dstPts: number[] = [];
        for (let i = 0; i < matches.size(); i++) {
          const m = matches.get(i);
          if (m.size() === 2 && m.get(0).distance < ratio * m.get(1).distance) {
            const first = m.get(0);
            srcPts.push(kp1.get(first.queryIdx).pt.x, kp1.get(first.queryIdx).pt.y);
            dstPts.push(kp2.get(first.trainIdx).pt.x, kp2.get(first.trainIdx).pt.y);
          }
        }
        if (srcPts.length < 8) throw new Error('Not enough matches');
        const srcMat = cv.matFromArray(srcPts.length / 2, 1, cv.CV_32FC2, srcPts);
        const dstMat = cv.matFromArray(dstPts.length / 2, 1, cv.CV_32FC2, dstPts);
        const mask = new cv.Mat();
        const H = cv.findHomography(srcMat, dstMat, cv.RANSAC || 8, ransacThreshold, mask);
        const warped = new cv.Mat();
        cv.warpPerspective(src1, warped, H, new cv.Size(src2.cols, src2.rows));
        const blended = new cv.Mat();
        cv.addWeighted(src2, 0.5, warped, 0.5, 0, blended);
        result = { resultImage: matToImageData(blended), inlierCount: cv.countNonZero(mask) };
        src1.delete(); src2.delete(); gray1.delete(); gray2.delete(); kp1.delete(); kp2.delete(); 
        des1.delete(); des2.delete(); bf.delete(); matches.delete(); srcMat.delete(); dstMat.delete(); 
        mask.delete(); H.delete(); warped.delete(); blended.delete(); orb.delete();
        break;
      }

      case 'COMPUTE_FUNDAMENTAL': {
        const { imageData1, imageData2, nFeatures, ratio, ransacThreshold = 1.0 } = payload;
        const src1 = imageDataToMat(imageData1);
        const src2 = imageDataToMat(imageData2);
        const gray1 = new cv.Mat(), gray2 = new cv.Mat();
        cv.cvtColor(src1, gray1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(src2, gray2, cv.COLOR_RGBA2GRAY);
        const orb = new cv.ORB(nFeatures);
        const kp1 = new cv.KeyPointVector(), kp2 = new cv.KeyPointVector();
        const des1 = new cv.Mat(), des2 = new cv.Mat();
        orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
        orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(des1, des2, matches, 2);
        const srcPts: number[] = [], dstPts: number[] = [];
        for (let i = 0; i < matches.size(); i++) {
          const m = matches.get(i);
          if (m.size() === 2 && m.get(0).distance < ratio * m.get(1).distance) {
            const first = m.get(0);
            srcPts.push(kp1.get(first.queryIdx).pt.x, kp1.get(first.queryIdx).pt.y);
            dstPts.push(kp2.get(first.trainIdx).pt.x, kp2.get(first.trainIdx).pt.y);
          }
        }
        src1.delete(); src2.delete(); gray1.delete(); gray2.delete();
        kp1.delete(); kp2.delete(); des1.delete(); des2.delete();
        bf.delete(); matches.delete(); orb.delete();
        if (srcPts.length < 16) throw new Error('Not enough matches to compute fundamental matrix');

        const { F: Farr, mask: fmask } = findFundamental(srcPts, dstPts, ransacThreshold, 1000);

        // Draw epipolar lines on image2 for visual feedback
        const src2b = imageDataToMat(imageData2);
        const marked = src2b.clone();
        const px1 = srcPts.filter((_,i)=>i%2===0), py1 = srcPts.filter((_,i)=>i%2===1);
        let drawCount = 0;
        for (let i = 0; i < fmask.length && drawCount < 10; i++) {
          if (!fmask[i]) continue;
          const l = m3v(Farr, [px1[i], py1[i], 1]);
          if (Math.abs(l[1]) > 1e-6) {
            const x0=0, x1c=src2b.cols;
            const y0=Math.round(-l[2]/l[1]), y1c=Math.round(-(l[0]*x1c+l[2])/l[1]);
            cv.line(marked, new cv.Point(x0,y0), new cv.Point(x1c,y1c),
              new cv.Scalar(Math.random()*255,Math.random()*255,Math.random()*255,255), 2);
          }
          drawCount++;
        }
        const fArray = [
          [Farr[0],Farr[1],Farr[2]],
          [Farr[3],Farr[4],Farr[5]],
          [Farr[6],Farr[7],Farr[8]],
        ];
        result = {
          resultImage: matToImageData(marked),
          inlierCount: fmask.filter(v=>v).length,
          F_matrix: fArray,
        };
        src2b.delete(); marked.delete();
        break;
      }

      case 'COMPUTE_ESSENTIAL': {
        const { imageData1, imageData2, nFeatures, ratio, ransacThreshold = 1.0 } = payload;
        const src1 = imageDataToMat(imageData1);
        const src2 = imageDataToMat(imageData2);
        const gray1 = new cv.Mat(), gray2 = new cv.Mat();
        cv.cvtColor(src1, gray1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(src2, gray2, cv.COLOR_RGBA2GRAY);
        const cols1 = src1.cols, rows1 = src1.rows;
        const orb = new cv.ORB(nFeatures);
        const kp1 = new cv.KeyPointVector(), kp2 = new cv.KeyPointVector();
        const des1 = new cv.Mat(), des2 = new cv.Mat();
        orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
        orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(des1, des2, matches, 2);
        const srcPts: number[] = [], dstPts: number[] = [];
        for (let i = 0; i < matches.size(); i++) {
          const m = matches.get(i);
          if (m.size() === 2 && m.get(0).distance < ratio * m.get(1).distance) {
            const first = m.get(0);
            srcPts.push(kp1.get(first.queryIdx).pt.x, kp1.get(first.queryIdx).pt.y);
            dstPts.push(kp2.get(first.trainIdx).pt.x, kp2.get(first.trainIdx).pt.y);
          }
        }
        src1.delete(); src2.delete(); gray1.delete(); gray2.delete();
        kp1.delete(); kp2.delete(); des1.delete(); des2.delete();
        bf.delete(); matches.delete(); orb.delete();
        if (srcPts.length < 16) throw new Error('Not enough matches for essential matrix estimation (need at least 8 point pairs)');

        const { F: Farr, mask: fmask } = findFundamental(srcPts, dstPts, ransacThreshold, 1000);
        const f = Math.max(cols1, rows1) * 1.2;
        const Kd = [f,0,cols1/2, 0,f,rows1/2, 0,0,1];
        // E = K^T * F * K
        const Ed = m3m(m3m(m3t(Kd), Farr), Kd);

        const inlierIdx = fmask.map((v,i)=>v?i:-1).filter(i=>i>=0);
        const px1 = srcPts.filter((_,i)=>i%2===0), py1 = srcPts.filter((_,i)=>i%2===1);
        const px2 = dstPts.filter((_,i)=>i%2===0), py2 = dstPts.filter((_,i)=>i%2===1);
        const ipx1 = inlierIdx.map(i=>px1[i]), ipy1 = inlierIdx.map(i=>py1[i]);
        const ipx2 = inlierIdx.map(i=>px2[i]), ipy2 = inlierIdx.map(i=>py2[i]);

        const { R, t } = recoverPoseJS(Ed, ipx1, ipy1, ipx2, ipy2, Kd);
        result = {
          R: [[R[0],R[1],R[2]],[R[3],R[4],R[5]],[R[6],R[7],R[8]]],
          t: [t[0],t[1],t[2]],
          inlierCount: inlierIdx.length,
        };
        break;
      }

      case 'COMPUTE_TRIANGULATION': {
        const { imageData1, imageData2, nFeatures, ratio, ransacThreshold = 1.0 } = payload;
        const src1 = imageDataToMat(imageData1);
        const src2 = imageDataToMat(imageData2);
        const gray1 = new cv.Mat(), gray2 = new cv.Mat();
        cv.cvtColor(src1, gray1, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(src2, gray2, cv.COLOR_RGBA2GRAY);
        const cols1 = src1.cols, rows1 = src1.rows;
        const orb = new cv.ORB(nFeatures);
        const kp1 = new cv.KeyPointVector(), kp2 = new cv.KeyPointVector();
        const des1 = new cv.Mat(), des2 = new cv.Mat();
        orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
        orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
        const matches = new cv.DMatchVectorVector();
        bf.knnMatch(des1, des2, matches, 2);
        const srcPts: number[] = [], dstPts: number[] = [];
        for (let i = 0; i < matches.size(); i++) {
          const m = matches.get(i);
          if (m.size() === 2 && m.get(0).distance < ratio * m.get(1).distance) {
            const first = m.get(0);
            srcPts.push(kp1.get(first.queryIdx).pt.x, kp1.get(first.queryIdx).pt.y);
            dstPts.push(kp2.get(first.trainIdx).pt.x, kp2.get(first.trainIdx).pt.y);
          }
        }
        src1.delete(); src2.delete(); gray1.delete(); gray2.delete();
        kp1.delete(); kp2.delete(); des1.delete(); des2.delete();
        bf.delete(); matches.delete(); orb.delete();
        if (srcPts.length < 16) throw new Error('Not enough matches for triangulation (need at least 8 point pairs)');

        const { F: Farr, mask: fmask } = findFundamental(srcPts, dstPts, ransacThreshold, 1000);
        const f = Math.max(cols1, rows1) * 1.2;
        const Kd = [f,0,cols1/2, 0,f,rows1/2, 0,0,1];
        const Ed = m3m(m3m(m3t(Kd), Farr), Kd);

        const inlierIdx = fmask.map((v,i)=>v?i:-1).filter(i=>i>=0);
        const px1 = srcPts.filter((_,i)=>i%2===0), py1 = srcPts.filter((_,i)=>i%2===1);
        const px2 = dstPts.filter((_,i)=>i%2===0), py2 = dstPts.filter((_,i)=>i%2===1);
        const ipx1 = inlierIdx.map(i=>px1[i]), ipy1 = inlierIdx.map(i=>py1[i]);
        const ipx2 = inlierIdx.map(i=>px2[i]), ipy2 = inlierIdx.map(i=>py2[i]);

        const { R, t } = recoverPoseJS(Ed, ipx1, ipy1, ipx2, ipy2, Kd);

        // P1 = K * [I|0], P2 = K * [R|t]  (flat row-major 3×4)
        const P1arr = [Kd[0],Kd[1],Kd[2],0, Kd[3],Kd[4],Kd[5],0, Kd[6],Kd[7],Kd[8],0];
        const P2arr = buildP2(Kd, R, t);

        const p3d: number[][] = [];
        for (let i = 0; i < ipx1.length; i++) {
          const pt = triangulatePt(P1arr, P2arr, ipx1[i], ipy1[i], ipx2[i], ipy2[i]);
          const z2 = R[6]*pt[0]+R[7]*pt[1]+R[8]*pt[2]+t[2];
          if (pt[2] > 0 && pt[2] < 50 && z2 > 0) p3d.push(pt);
        }

        // cam2_pos = -R^T * t  (world position of camera 2)
        const cam2Pos = m3v(m3t(R), [-t[0],-t[1],-t[2]]);

        result = {
          points3d: p3d,
          cam2_pos: cam2Pos,
          cam2: {
            R: [[R[0],R[1],R[2]],[R[3],R[4],R[5]],[R[6],R[7],R[8]]],
            t: [t[0],t[1],t[2]],
          },
        };
        break;
      }
    }

    postMessage({ id, type: 'SUCCESS', result });
  } catch (error: any) {
    console.error(`Worker error in ${type}:`, error);
    postMessage({ id, type: 'ERROR', error: error.message || 'Unknown worker error' });
  }
};
