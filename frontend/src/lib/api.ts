import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 900_000,
});

export interface DescriptionResponse {
  product_name: string;
  description: string;
  unique_key: string;
  image_url?: string;
}

export interface ImageResponse {
  image_url: string;
  unique_key: string;
}

export interface VideoResponse {
  status?: string;
  video_url?: string;
  unique_key: string;
}

export const generateDescription = (data: {
  product_name?: string;
  description?: string;
  image_base64?: string | null;
  file_name?: string | null;
  unique_key?: string;
}) => api.post<DescriptionResponse>('/api/generate/description', data).then((r) => r.data);

export const generateImage = (data: {
  product_name: string;
  description: string;
  unique_key: string;
}) => api.post<ImageResponse>('/api/generate/image', data).then((r) => r.data);

export const generateVideo = (data: {
  product_name: string;
  description: string;
  image_url?: string | null;
  unique_key: string;
}) => api.post<VideoResponse>('/api/generate/video', data).then((r) => r.data);

export const checkVideoStatus = (uniqueKey: string) => 
  api.get<VideoResponse>(`/api/status/video/${uniqueKey}`).then((r) => r.data);

export const publish = (data: {
  product_name: string;
  description: string;
  image_url?: string | null;
  video_url?: string | null;
  unique_key: string;
}) => api.post('/api/publish', data).then((r) => r.data);

export const proxyImageUrl = (url: string) => {
  if (typeof url !== 'string') return '';
  if (url.includes('drive.google') || url.includes('googleusercontent')) {
    return `http://localhost:8000/api/proxy/image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export default api;
