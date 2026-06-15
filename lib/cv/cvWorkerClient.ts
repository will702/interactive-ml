/**
 * Client-side interface for the OpenCV Web Worker.
 * Handles communication, task queuing, and data conversion.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCvStore } from './cvStore';

const READY_TIMEOUT_MS = 30_000;

class CvWorkerClient {
  private worker: Worker | null = null;
  private requests: Map<number, { resolve: (value: any) => void, reject: (reason?: any) => void }> = new Map();
  private nextId = 0;
  private canvas: HTMLCanvasElement | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((reason: Error) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    // Avoid unhandled-rejection noise when nothing is awaiting yet.
    this.readyPromise.catch(() => {});

    const timeout = setTimeout(() => {
      this.failReady('Vision engine timed out loading OpenCV.js');
    }, READY_TIMEOUT_MS);

    this.readyPromise.finally(() => clearTimeout(timeout)).catch(() => {});

    this.worker = new Worker(new URL('@/worker/cv.worker.ts', import.meta.url));
    this.worker.onmessage = (e) => this.handleMessage(e);
    this.worker.onerror = (e) => {
      this.failReady(`Vision engine worker failed: ${e.message || 'unknown error'}`);
    };
    this.canvas = document.createElement('canvas');
  }

  private failReady(message: string) {
    if (useCvStore.getState().cvStatus !== 'loading') return;
    useCvStore.getState().setCvStatus('error', message);
    this.readyReject?.(new Error(message));
  }

  /**
   * Resolves once OpenCV is initialized in the worker; rejects if it
   * failed to load or timed out.
   */
  whenReady(): Promise<void> {
    if (!this.readyPromise) {
      return Promise.reject(new Error('Vision engine is only available in the browser'));
    }
    return this.readyPromise;
  }

  private handleMessage(e: MessageEvent) {
    const { id, type, result, error } = e.data;

    if (type === 'READY') {
      useCvStore.getState().setCvStatus('ready');
      this.readyResolve?.();
      return;
    }

    if (type === 'ERROR' && id === undefined) {
      console.error('Global worker error:', error);
      this.failReady(error || 'Vision engine failed to load OpenCV.js');
      return;
    }

    const deferred = this.requests.get(id);
    if (!deferred) return;

    this.requests.delete(id);
    if (type === 'SUCCESS') {
      deferred.resolve(result);
    } else {
      deferred.reject(new Error(error));
    }
  }

  private async request(type: string, payload: any): Promise<any> {
    if (!this.worker) throw new Error('Worker not initialized');

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.requests.set(id, { resolve, reject });
      this.worker!.postMessage({ id, type, payload });
    });
  }

  /**
   * Ensures input is a data URI. Fetches URL paths and converts via FileReader.
   */
  private async ensureDataUri(input: string): Promise<string> {
    if (input.startsWith('data:')) return input;
    if (input.startsWith('/') || input.startsWith('http')) {
      const response = await fetch(input);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    return `data:image/jpeg;base64,${input}`;
  }

  /**
   * Helper to convert Base64 string or URL path to ImageData
   */
  private async base64ToImageData(base64: string): Promise<ImageData> {
    const dataUri = await this.ensureDataUri(base64);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (!this.canvas) return reject(new Error('Canvas not init'));
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return reject(new Error('Context not init'));
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = reject;
      img.src = dataUri;
    });
  }

  /**
   * Helper to convert ImageData back to Base64 (JPEG)
   */
  private imageDataToBase64(imageData: ImageData): string {
    if (!this.canvas) throw new Error('Canvas not init');
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Context not init');
    ctx.putImageData(imageData, 0, 0);
    return this.canvas.toDataURL('image/jpeg');
  }

  // API Methods

  async applyKernel(base64: string, kernel: number[][]): Promise<string> {
    const imageData = await this.base64ToImageData(base64);
    const resultImageData = await this.request('APPLY_KERNEL', { imageData, kernel });
    return this.imageDataToBase64(resultImageData);
  }

  async convVsCorr(base64: string, kernel: number[][]): Promise<{ convolution: string, correlation: string }> {
    const imageData = await this.base64ToImageData(base64);
    const { convolution, correlation } = await this.request('CONV_VS_CORR', { imageData, kernel });
    return {
      convolution: this.imageDataToBase64(convolution),
      correlation: this.imageDataToBase64(correlation)
    };
  }

  async harrisCorners(base64: string, blockSize: number, ksize: number, k: number, thresholdRatio: number): Promise<{ resultImage: string, cornerCount: number }> {
    const imageData = await this.base64ToImageData(base64);
    const { resultImage, cornerCount } = await this.request('HARRIS_CORNERS', { imageData, blockSize, ksize, k, thresholdRatio });
    return {
      resultImage: this.imageDataToBase64(resultImage),
      cornerCount
    };
  }

  async detectFeatures(base64: string, method: 'AKAZE' | 'ORB', nFeatures: number): Promise<{ resultImage: string, keypointCount: number }> {
    const imageData = await this.base64ToImageData(base64);
    const { resultImage, keypointCount } = await this.request('DETECT_FEATURES', { imageData, method, nFeatures });
    return {
      resultImage: this.imageDataToBase64(resultImage),
      keypointCount
    };
  }

  async matchFeatures(image1: string, image2: string, nFeatures: number, ratio: number): Promise<{ resultImage: string, matchCount: number }> {
    const imageData1 = await this.base64ToImageData(image1);
    const imageData2 = await this.base64ToImageData(image2);
    const { resultImage, matchCount } = await this.request('MATCH_FEATURES', { imageData1, imageData2, nFeatures, ratio });
    return {
      resultImage: this.imageDataToBase64(resultImage),
      matchCount
    };
  }

  async estimateHomography(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number): Promise<{ resultImage: string, inlierCount: number }> {
    const imageData1 = await this.base64ToImageData(image1);
    const imageData2 = await this.base64ToImageData(image2);
    const { resultImage, inlierCount } = await this.request('ESTIMATE_HOMOGRAPHY', { imageData1, imageData2, nFeatures, ratio, ransacThreshold });
    return {
      resultImage: this.imageDataToBase64(resultImage),
      inlierCount
    };
  }

  async computeFundamental(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0): Promise<{ resultImage: string, inlierCount: number, F_matrix: number[][] }> {
    const imageData1 = await this.base64ToImageData(image1);
    const imageData2 = await this.base64ToImageData(image2);
    const { resultImage, inlierCount, F_matrix } = await this.request('COMPUTE_FUNDAMENTAL', { imageData1, imageData2, nFeatures, ratio, ransacThreshold });
    return {
      resultImage: this.imageDataToBase64(resultImage),
      inlierCount,
      F_matrix
    };
  }

  async computeEssential(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0): Promise<{ R: number[][], t: number[], inlierCount: number }> {
    const imageData1 = await this.base64ToImageData(image1);
    const imageData2 = await this.base64ToImageData(image2);
    return await this.request('COMPUTE_ESSENTIAL', { imageData1, imageData2, nFeatures, ratio, ransacThreshold });
  }

  async computeTriangulation(image1: string, image2: string, nFeatures: number, ratio: number, ransacThreshold: number = 1.0): Promise<{ points3d: number[][], cam2: { R: number[][], t: number[] }, cam2_pos: number[] }> {
    const imageData1 = await this.base64ToImageData(image1);
    const imageData2 = await this.base64ToImageData(image2);
    return await this.request('COMPUTE_TRIANGULATION', { imageData1, imageData2, nFeatures, ratio, ransacThreshold });
  }
}

export const cvWorkerClient = new CvWorkerClient();
