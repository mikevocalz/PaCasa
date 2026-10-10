export interface DocumentCameraProps {
  active: boolean;
  consent?: boolean;
  onExtracted: (text: string, engine: 'on-device' | 'gemini-vision-demo') => void;
  onError: (message: string) => void;
  onProgress: (phase: 'recognizing') => void;
}
