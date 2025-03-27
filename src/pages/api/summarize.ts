import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { SentimentType } from '../../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChunkResponse {
  topics: Array<{
    id: string;
    title: string;
    summary: Array<{
      point: string;
      slideReference: string;
    }>;
  }>;
}

const messages = [
  {
    role: "system",
    content: "You are an expert at analyzing lecture transcripts. Your task is to identify main topics and create bullet point summaries that explain concepts using direct, active language. Write as if you're explaining the material to a fellow student, using clear cause-and-effect relationships. Always respond with valid JSON."
  },
  {
    role: "user",
    content: `Analyze this lecture transcript and identify ALL main topics discussed (Exhaustive, and in the order they are discussed). For each topic:
    1. Create a clear, concise title
    2. For each bullet point:
       - Use direct, active language (e.g., "X causes Y", "X leads to Y", "X creates Y")
       - Start with the cause and explain its effect
       - Avoid passive voice and phrases like "was emphasized", "was discussed", "was shown"
       - Connect ideas using clear cause-and-effect relationships
       - Include important formulas or technical details with direct explanations
       - Match each point to the EXACT slide where it was discussed
       - If a point covers content from multiple slides, list all relevant slides
       - If a point's content appears out of order in the slides, indicate this
    
    Return the result as JSON with the following structure:
    {
      "topics": [
        {
          "id": "topic-id",
          "title": "Topic Title",
          "summary": [
            {
              "point": "Direct explanation using cause-and-effect relationships",
              "slideReference": "Slide X (or Slides X, Y, Z if multiple slides)"
            }
          ]
        }
      ]
    }
    
    Guidelines for topic and slide matching:
    - Each bullet point should use direct, active language
    - Focus on cause-and-effect relationships
    - Avoid passive voice and descriptive phrases
    - If a concept is introduced on one slide and elaborated on another, include both slides
    - If examples or applications are shown on different slides, include those slides
    - If a concept is discussed out of order, list all relevant slides with order indication
    - Make sure each point's content directly matches what was shown on the referenced slides
    - Consider chronological progression of concepts across slides

    Transcript:\n`
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
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ message: 'Invalid transcript provided' });
    }

    console.log('Sending request to OpenAI');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        messages[0],
        { role: "user", content: messages[1].content + transcript }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }).catch((error: Error) => {
      console.error('OpenAI API Error:', {
        error: error.message,
        type: error.name,
        stack: error.stack
      });
      throw new Error(`OpenAI API error: ${error.message}`);
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('Raw OpenAI response:', content);

    // Try to extract JSON if there's any text before or after it
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;

    let parsedResponse: ChunkResponse;
    try {
      parsedResponse = JSON.parse(jsonContent);
      console.log('Parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    if (!parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
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
