import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { TranscriptAnalysis } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const transcriptFile = formData.get('transcript') as File;
    
    if (!transcriptFile) {
      return NextResponse.json(
        { error: 'No transcript file provided' },
        { status: 400 }
      );
    }

    const transcriptText = await transcriptFile.text();

    // First, identify speakers and segment the transcript
    const speakerAnalysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing educational transcripts. Your task is to identify speakers and segment the transcript into coherent topics."
        },
        {
          role: "user",
          content: `Analyze this transcript and identify when the professor is speaking versus when students are speaking. Then segment it into main topics discussed. Return the result as JSON with the following structure:
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
      ]
    });

    const segmentedTranscript = JSON.parse(speakerAnalysis.choices[0].message.content || '{"segments": []}');

    // Then, generate summaries for each identified topic
    const topics = new Map<string, string[]>();
    segmentedTranscript.segments.forEach((segment: any) => {
      if (!topics.has(segment.topic)) {
        topics.set(segment.topic, []);
      }
      topics.get(segment.topic)?.push(segment.content);
    });

    const topicAnalyses = await Promise.all(
      Array.from(topics.entries()).map(async ([topic, contents]) => {
        const topicAnalysis = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Generate a concise bullet-point summary of this topic discussion from a lecture. Focus on key points and main takeaways."
            },
            {
              role: "user",
              content: contents.join("\n")
            }
          ]
        });

        return {
          id: topic.toLowerCase().replace(/\s+/g, '-'),
          title: topic,
          summary: topicAnalysis.choices[0].message.content?.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.trim().substring(2)) || [],
          details: contents.join("\n")
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
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    );
  }
} 