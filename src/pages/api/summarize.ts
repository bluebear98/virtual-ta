import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChunkResponse {
  chunks: Array<{
    id: number;
    title: string;
    summary: string;
    bulletPoints: Array<{
      point: string;
      transcript: string;
      slideIndex?: number;
    }>;
  }>;
}

const messages = [
  {
    role: "system",
    content: "You are an expert at analyzing lecture transcripts and matching content with presentation slides. Your task is to identify main topics and create detailed bullet points for each topic to help students review the lecture content. For each bullet point, include the relevant section of the transcript and match it with the most relevant slide if available."
  },
  {
    role: "user",
    content: (transcript: string, slides?: string[]) => `Analyze this lecture transcript and break it into logical chunks. For each chunk, provide:
    1. A concise topic title
    2. A one-sentence summary
    3. 3-5 detailed bullet points with their corresponding transcript sections

    ${slides ? `I'm also providing the content of ${slides.length} slides. For each bullet point, if you find a matching slide that best represents that point, include its index (0-based).` : ''}

    Return a JSON object with a "chunks" array. Example format:
    {
      "chunks": [
        {
          "id": 1,
          "title": "Topic Title",
          "summary": "Brief overview",
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
  }
];

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
        messages[0],
        { role: "user", content: messages[1].content(transcript, slides) }
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
    } catch (parseError) {
      console.error('JSON parse error details:', parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
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
