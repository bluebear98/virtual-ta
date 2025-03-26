import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { SentimentType } from '../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChunkResponse {
  chunks: Array<{
    id: number;
    title: string;
    summary: string;
    sentiment: SentimentType;
    sentimentScore: number;
    bulletPoints: Array<{
      point: string;
      transcript: string;
      slideIndex?: number;
    }>;
  }>;
}

const systemMessage = {
  role: "system" as const,
  content: "You are an expert at analyzing lecture transcripts, matching content with slides, and analyzing student engagement. Analyze the content for topics and assess each topic's engagement level based on student interactions, questions, and participation indicators in the transcript."
};

const createUserMessage = (transcript: string, slides?: string[]) => ({
  role: "user" as const,
  content: `Analyze this lecture transcript and break it into logical chunks. For each chunk, provide:
    1. A concise topic title
    2. A one-sentence summary
    3. 3-5 detailed bullet points with their corresponding transcript sections
    4. A sentiment analysis indicating student engagement level ("confused", "neutral", or "engaged")
    5. A numerical sentiment score (0-100) where higher numbers indicate more engagement

    ${slides ? `I'm also providing the content of ${slides.length} slides. For each bullet point, if you find a matching slide that best represents that point, include its index (0-based).` : ''}

    Return a JSON object with a "chunks" array. Example format:
    {
      "chunks": [
        {
          "id": 1,
          "title": "Topic Title",
          "summary": "Brief overview",
          "sentiment": "engaged",
          "sentimentScore": 85,
          "bulletPoints": [
            {
              "point": "Key point",
              "transcript": "Relevant transcript section...",
              ${slides ? '"slideIndex": 0,' : ''} 
            }
          ]
        }
      ]
    }

    ${slides ? '\nSlide contents:\n' + slides.map((content, i) => `Slide ${i}: ${content}`).join('\n') : ''}

    Transcript:\n${transcript}`
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { transcript, slides } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ message: 'Invalid transcript provided' });
    }

    console.log('Request details:', {
      transcriptLength: transcript.length,
      slidesCount: slides?.length,
      timestamp: new Date().toISOString()
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        systemMessage,
        createUserMessage(transcript, slides)
      ],
      response_format: { type: "json_object" }
    }).catch(error => {
      console.error('OpenAI API Error:', {
        error: error.message,
        type: error.type,
        code: error.code
      });
      throw new Error(`OpenAI API error: ${error.message}`);
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('Raw OpenAI response:', content);

    let parsedResponse: ChunkResponse;
    try {
      parsedResponse = JSON.parse(content);
      console.log('Parsed response structure:', {
        hasChunks: !!parsedResponse.chunks,
        chunksLength: parsedResponse.chunks?.length,
        firstChunk: parsedResponse.chunks?.[0] ? 'present' : 'missing'
      });
    } catch (error: unknown) {
      const parseError = error instanceof Error ? error : new Error('Unknown JSON parse error');
      console.error('JSON parse error details:', parseError);
      throw parseError;
    }

    if (!parsedResponse.chunks || !Array.isArray(parsedResponse.chunks)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('API handler error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error processing request'
    });
  }
}
