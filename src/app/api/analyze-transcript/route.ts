import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { TranscriptAnalysis } from '@/types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to split text into chunks of roughly equal size
function splitIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
  const sentences = text.split(/[.!?]+\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function parseGPTResponse(response: string, defaultValue: any): Promise<any> {
  try {
    // Try to extract JSON if it's wrapped in text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse GPT response:', response);
    return defaultValue;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const transcriptFile = formData.get('transcript') as Blob;
    
    if (!transcriptFile) {
      return NextResponse.json(
        { error: 'No transcript file provided' },
        { status: 400 }
      );
    }

    const transcriptText = await transcriptFile.text();

    // Analyze the entire transcript at once since GPT-4 Turbo has a larger context window
    const speakerAnalysis = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing educational transcripts. Your task is to identify speakers and segment the transcript into coherent topics. You must respond with ONLY valid JSON, no additional text."
        },
        {
          role: "user",
          content: `Analyze this transcript and identify speakers and topics. Respond with ONLY the following JSON structure, no other text:
          {
            "segments": [
              {
                "speaker": "professor" | "student",
                "content": "text",
                "topic": "topic name"
              }
            ]
          }`
        },
        {
          role: "user",
          content: transcriptText
        }
      ],
      response_format: { type: "json_object" }
    });

    const segmentedTranscript = JSON.parse(speakerAnalysis.choices[0].message.content || '{"segments": []}');

    // Group segments by topic
    const topics = new Map<string, string[]>();
    segmentedTranscript.segments.forEach((segment: any) => {
      if (!topics.has(segment.topic)) {
        topics.set(segment.topic, []);
      }
      topics.get(segment.topic)?.push(segment.content);
    });

    // Generate summaries for each topic
    const topicAnalyses = await Promise.all(
      Array.from(topics.entries()).map(async ([topic, contents]) => {
        const topicAnalysis = await openai.chat.completions.create({
          model: "gpt-4-0125-preview",
          messages: [
            {
              role: "system",
              content: "Generate a concise bullet-point summary and key insights. Respond with ONLY valid JSON in the following format: { \"summary\": [\"point 1\", \"point 2\"], \"details\": \"detailed analysis\" }"
            },
            {
              role: "user",
              content: contents.join("\n")
            }
          ],
          response_format: { type: "json_object" }
        });

        const analysis = await parseGPTResponse(topicAnalysis.choices[0].message.content || '', {
          summary: [],
          details: contents.join("\n")
        });

        return {
          id: topic.toLowerCase().replace(/\s+/g, '-'),
          title: topic,
          summary: analysis.summary,
          details: analysis.details
        };
      })
    );

    const analysis: TranscriptAnalysis = {
      topics: topicAnalyses,
      metadata: {
        speakerDistribution: {
          professor: segmentedTranscript.segments.filter((s: any) => s.speaker === 'professor').length,
          student: segmentedTranscript.segments.filter((s: any) => s.speaker === 'student').length,
        }
      }
    };

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze transcript' },
      { status: 500 }
    );
  }
} 