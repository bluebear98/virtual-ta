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
    bulletPoints: string[];
    timeframe: string;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ message: 'Invalid transcript provided' });
    }

    console.log('Sending request to OpenAI');


    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: `Analyze this lecture transcript and break it into logical chunks. For each chunk, provide:
        1. A concise topic title
        2. A one-sentence summary
        3. 3-5 detailed bullet points
        4. Approximate timeframe in the lecture

        Return a JSON object with a "chunks" array. Example format:
        {
          "chunks": [
            {
              "id": 1,
              "title": "Introduction to Topic",
              "summary": "Brief overview of main concepts",
              "bulletPoints": ["Point 1", "Point 2", "Point 3"],
              "timeframe": "0:00-5:00"
            }
          ]
        }

        Transcript:\n${transcript}`
      }],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('Raw OpenAI response:', content);

    let parsedResponse: ChunkResponse;
    try {
      parsedResponse = JSON.parse(content);
      console.log('Parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!parsedResponse.chunks || !Array.isArray(parsedResponse.chunks)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error processing request'
    });
  }
}
