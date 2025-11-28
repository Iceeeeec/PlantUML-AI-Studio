export interface DiagramState {
  code: string;
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
}

export interface AiRequestState {
  prompt: string;
  isGenerating: boolean;
  error: string | null;
}

export enum ViewMode {
  Split = 'SPLIT',
  Editor = 'EDITOR',
  Preview = 'PREVIEW'
}