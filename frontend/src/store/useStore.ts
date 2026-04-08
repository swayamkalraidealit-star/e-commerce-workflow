import { create } from 'zustand';

export type Step = 1 | 2 | 3 | 4 | 5;

export interface ProductState {
  step: Step;
  progressStep: Step;
  productName: string;
  description: string;
  enhancedName: string;
  enhancedDesc: string;
  inputImageBase64: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  uniqueKey: string | null;
  publishUrl: string | null;
  publishMessage: string | null;
  publishStatus: string | null;
  loading: boolean;
  error: string | null;

  setStep: (s: Step) => void;
  setProgressStep: (s: Step) => void;
  setInput: (name: string, desc: string, imageBase64: string | null) => void;

  setDescription: (name: string, desc: string, key: string, imageUrl?: string | null) => void;
  setImage: (url: string, key: string) => void;
  setVideo: (url: string, key: string) => void;
  setPublishResult: (publishUrl: string | null, publishMessage: string | null, publishStatus: string | null) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initial = {
  step: 1 as Step,
  progressStep: 1 as Step,
  productName: '',
  description: '',
  enhancedName: '',
  enhancedDesc: '',
  inputImageBase64: null,
  imageUrl: null,

  videoUrl: null,
  uniqueKey: null,
  publishUrl: null,
  publishMessage: null,
  publishStatus: null,
  loading: false,
  error: null,
};

export const useStore = create<ProductState>((set) => ({
  ...initial,
  setStep: (step) => set({ step, progressStep: step }),
  setProgressStep: (progressStep) => set({ progressStep }),
  setInput: (productName, description, inputImageBase64) =>
    set({
      productName,
      description,
      inputImageBase64,
      enhancedName: '',
      enhancedDesc: '',
      imageUrl: null,
      videoUrl: null,
      uniqueKey: null,
      publishUrl: null,
      publishMessage: null,
      publishStatus: null,
      step: 1,
      progressStep: 1,
    }),
  setDescription: (enhancedName, enhancedDesc, uniqueKey, imageUrl = null) =>
    set({
      enhancedName,
      enhancedDesc,
      uniqueKey,
      imageUrl,
      videoUrl: null,
      publishUrl: null,
      publishMessage: null,
      publishStatus: null,
      step: 2,
      progressStep: 2,
    }),
  setImage: (imageUrl, uniqueKey) =>
    set((state) => ({
      imageUrl,
      uniqueKey: state.uniqueKey ?? uniqueKey,
      videoUrl: null,
      publishUrl: null,
      publishMessage: null,
      publishStatus: null,
      step: 3,
      progressStep: 3,
    })),
  setVideo: (videoUrl: string, uniqueKey: string) =>
    set((state) => ({
      videoUrl,
      uniqueKey: state.uniqueKey ?? uniqueKey,
      publishUrl: null,
      publishMessage: null,
      publishStatus: null,
      step: 4,
      progressStep: 4,
    })),
  setPublishResult: (publishUrl, publishMessage, publishStatus) =>
    set({ publishUrl, publishMessage, publishStatus }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ ...initial }),
}));
