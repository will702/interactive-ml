import { cvWorkerClient } from './cvWorkerClient';

/**
 * All processing runs client-side in the OpenCV Web Worker.
 * Each call waits for the engine to finish initializing (OpenCV.js is
 * ~11MB), so demos triggered early simply wait instead of failing.
 */

export async function applyKernel(image: string, kernel: number[][]) {
  await cvWorkerClient.whenReady();
  const result = await cvWorkerClient.applyKernel(image, kernel);
  return { result_image: result.split(',')[1] || result };
}

export async function convVsCorr(image: string, kernel: number[][]) {
  await cvWorkerClient.whenReady();
  const { convolution, correlation } = await cvWorkerClient.convVsCorr(image, kernel);
  return {
    convolution: convolution.split(',')[1] || convolution,
    correlation: correlation.split(',')[1] || correlation
  };
}

export async function harrisCorners(image: string, blockSize: number, ksize: number, k: number, thresholdRatio: number) {
  await cvWorkerClient.whenReady();
  const { resultImage, cornerCount } = await cvWorkerClient.harrisCorners(image, blockSize, ksize, k, thresholdRatio);
  return {
    result_image: resultImage.split(',')[1] || resultImage,
    corner_count: cornerCount
  };
}

export async function detectFeatures(image: string, method: string, nFeatures: number) {
  await cvWorkerClient.whenReady();
  const { resultImage, keypointCount } = await cvWorkerClient.detectFeatures(image, method as 'AKAZE' | 'ORB', nFeatures);
  return {
    result_image: resultImage.split(',')[1] || resultImage,
    keypoint_count: keypointCount
  };
}

export async function matchFeatures(image1: string, image2: string, nFeatures: number, ratio: number) {
  await cvWorkerClient.whenReady();
  const { resultImage, matchCount } = await cvWorkerClient.matchFeatures(image1, image2, nFeatures, ratio);
  return {
    result_image: resultImage.split(',')[1] || resultImage,
    match_count: matchCount
  };
}

export async function estimateHomography(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number) {
  await cvWorkerClient.whenReady();
  const { resultImage, inlierCount } = await cvWorkerClient.estimateHomography(image1, image2, nFeatures, ratio, ransacThreshold);
  return {
    result_image: resultImage.split(',')[1] || resultImage,
    inlier_count: inlierCount
  };
}

export async function computeFundamental(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0) {
  await cvWorkerClient.whenReady();
  const { resultImage, inlierCount, F_matrix } = await cvWorkerClient.computeFundamental(image1, image2, nFeatures, ratio, ransacThreshold);
  return {
    result_image: resultImage.split(',')[1] || resultImage,
    inlier_count: inlierCount,
    F_matrix
  };
}

export async function computeEssential(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0) {
  await cvWorkerClient.whenReady();
  const { R, t, inlierCount } = await cvWorkerClient.computeEssential(image1, image2, nFeatures, ratio, ransacThreshold);
  return { R, t, inliers: inlierCount };
}

export async function computeTriangulation(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0) {
  await cvWorkerClient.whenReady();
  const { points3d, cam2, cam2_pos } = await cvWorkerClient.computeTriangulation(image1, image2, nFeatures, ratio, ransacThreshold);
  return { points_3d: points3d, cam2, cam2_pos };
}
