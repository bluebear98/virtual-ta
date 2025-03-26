export interface BulletPoint {
  point: string;
  transcript: string;
  slideIndex?: number;
}

export interface TopicChunk {
  id: number;
  title: string;
  summary: string;
  bulletPoints: BulletPoint[];
}
