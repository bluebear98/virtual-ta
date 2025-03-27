export interface TopicChunk {
  id: string;
  title: string;
  summary: Array<{
    point: string;
    slideReference: string;
  }>;
}
