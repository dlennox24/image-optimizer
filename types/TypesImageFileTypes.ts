export type ImageWithMetadata = {
  id: number;
  file: File;
  width: number;
  height: number;
  resizeWidth?: number;
  resizeHeight?: number;
  isOptimized: boolean;
  optimizedFile?: ResFileObject;
};

export type ResizeMetadata = {
  id: number;
  name: string;
  width: number;
  height: number;
  isOptimized: boolean;
  resizeWidth?: number;
  resizeHeight?: number;
};

export type ResFileObject = {
  id: number;
  file: string; // base64-encoded string
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
};

export type OptimizeApiResponse = {
  optimizedImages: ResFileObject[];
  zippedImages: ResFileObject;
};
