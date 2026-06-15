import { create } from 'zustand';

export type CvStatus = 'loading' | 'ready' | 'error';

interface CvState {
  cvStatus: CvStatus;
  cvError: string | null;
  cvReady: boolean;
  setCvStatus: (status: CvStatus, error?: string | null) => void;
  intrinsic: { fx: number, fy: number, cx: number, cy: number, skew: number };
  setIntrinsic: (k: Partial<CvState['intrinsic']>) => void;
  extrinsic: { rx: number, ry: number, rz: number, tx: number, ty: number, tz: number };
  setExtrinsic: (e: Partial<CvState['extrinsic']> | ((prev: CvState['extrinsic']) => Partial<CvState['extrinsic']>)) => void;
}

export const useCvStore = create<CvState>((set) => ({
  cvStatus: 'loading',
  cvError: null,
  cvReady: false,
  setCvStatus: (status, error = null) =>
    set({ cvStatus: status, cvError: error, cvReady: status === 'ready' }),
  intrinsic: { fx: 400, fy: 400, cx: 320, cy: 240, skew: 0 },
  setIntrinsic: (k) => set((state) => ({ intrinsic: { ...state.intrinsic, ...k } })),
  extrinsic: { rx: 0.5, ry: 0.5, rz: 0, tx: 0, ty: 0, tz: 3 },
  setExtrinsic: (e) => set((state) => ({
    extrinsic: {
      ...state.extrinsic,
      ...(typeof e === 'function' ? e(state.extrinsic) : e)
    }
  })),
}));
