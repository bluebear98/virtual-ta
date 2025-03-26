export interface BulletPoint {
  id: number;      // A unique identifier for the bullet point
  text: string;    // The actual content/text of the bullet point
  chunkIndex: number;  // References which section of the transcript this bullet point came from
}

export interface ChunkSummary {
  chunkIndex: number;  // References which section of the transcript this summary is for
  summary: string;     // The detailed paragraph summary of the transcript chunk
}
