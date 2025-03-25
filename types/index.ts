export interface Topic {
  id: string;
  title: string;
  summary: string[];
  details: string;
  slideReferences?: {
    slideNumber: number;
    content: string;
  }[];
}

export interface TranscriptAnalysis {
  topics: Topic[];
  metadata: {
    totalDuration?: string;
    speakerDistribution?: {
      professor: number;
      student: number;
    };
  };
}

export interface SlideSummary {
  number: number;
  content: string;
  summary: string;
}

export interface UploadResponse {
  success: boolean;
  analysis?: TranscriptAnalysis;
  error?: string;
} 