export interface TopicChunk {
  id: number;           // Unique identifier for the chunk
  title: string;        // Short topic title
  summary: string;      // Brief overview of the topic
  bulletPoints: Array<{
    point: string;      // The bullet point text
    transcript: string; // The relevant transcript section
  }>;
}
