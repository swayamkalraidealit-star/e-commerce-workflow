import { create } from 'zustand';

export type Step = 1 | 2 | 3 | 4 | 5;

export interface ProductState {
  step: Step;
  productName: string;
  description: string;
  enhancedName: string;
  enhancedDesc: string;
  inputImageBase64: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  uniqueKey: string | null;
  loading: boolean;
  error: string | null;

  setStep: (s: Step) => void;
  setInput: (name: string, desc: string, imageBase64: string | null) => void;

  setDescription: (name: string, desc: string, key: string) => void;
  setImage: (url: string, key: string) => void;
  setVideo: (url: string, key: string) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initial = {
  step: 1 as Step,
  productName: '',
  description: '',
  enhancedName: '',
  enhancedDesc: '',
  inputImageBase64: null,
  imageUrl: null,

  videoUrl: null,
  uniqueKey: null,
  loading: false,
  error: null,
};

export const useStore = create<ProductState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setInput: (productName, description, inputImageBase64) => set({ productName, description, inputImageBase64 }),
  setDescription: (enhancedName, enhancedDesc, uniqueKey) =>
    set({ enhancedName, enhancedDesc, uniqueKey, step: 2 }),
  setImage: (imageUrl, uniqueKey) => set({ imageUrl, uniqueKey, step: 3 }),
  setVideo: (videoUrl, uniqueKey) => set({ videoUrl, uniqueKey, step: 4 }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ ...initial }),
}));
