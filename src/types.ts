export type SentimentType = 'confused' | 'neutral' | 'engaged';

export interface BulletPoint {
  point: string;
  transcript: string;
  slideIndex?: number;
}

export interface TopicChunk {
  id: number;
  title: string;
  summary: string;
  sentiment: SentimentType;
  sentimentScore: number; // 0-100
  bulletPoints: BulletPoint[];
}
