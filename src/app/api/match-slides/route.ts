import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { Topic } from '@/types';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SlideSummary {
  number: number;
  content: string;
  summary: string;
}

interface RequestBody {
  topic: Topic;
  slideSummaries: SlideSummary[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { topic, slideSummaries } = body;

    // Create a prompt that includes the topic and all slide summaries
    const analysis = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at matching lecture topics with relevant slides. Analyze the topic and slide summaries to find the most relevant matches. Return only a JSON array of slide references."
        },
        {
          role: "user",
          content: `Find slides that are most relevant to this topic:

Topic: ${topic.title}
Topic Summary: ${topic.summary.join('\n')}
Topic Details: ${topic.details}

Available Slides:
${slideSummaries.map(slide => `Slide ${slide.number}: ${slide.summary}`).join('\n')}

Return a JSON array of slide references in this format:
[
  {
    "slideNumber": number,
    "content": "brief explanation of relevance"
  }
]
Only include slides that are clearly relevant to the topic.`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const slideReferences = JSON.parse(analysis.choices[0].message.content || '{"references": []}').references;

    return NextResponse.json({ success: true, slideReferences });
  } catch (error) {
    console.error('Error matching slides:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to match slides with topic' },
      { status: 500 }
    );
  }
} 