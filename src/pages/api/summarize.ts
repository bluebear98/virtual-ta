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
    content: "You are an expert at analyzing lecture transcripts. Your task is to identify main topics and create concise but informative bullet point summaries for each topic to help students review the lecture content. Be thorough in identifying distinct topics and provide clear, focused bullet points for each topic. Always respond with valid JSON."
  },
  {
    role: "user",
    content: `Analyze this lecture transcript and identify ALL main topics discussed (Exhaustive, and in the order they are discussed). For each topic:
    1. Create a clear, concise title
    2. Provide 5-8 focused bullet points that:
       - Explain key concepts in 1-3 clear sentences
       - Include essential definitions and terminology
       - Highlight important relationships between concepts
       - Provide key examples or applications
       - Note critical formulas or technical details
       - Reference the specific slide numbers where each concept is discussed
    3. For each bullet point:
       - Be concise but comprehensive
       - Use clear, academic language
       - Focus on the most important information
       - Reference the relevant slide numbers
       - If a concept spans multiple slides, provide the range (e.g., "Slides 5-7")
       - If a concept is discussed out of order, note this (e.g., "Discussed in Slides 8-10 (out of order)")
    
    Return the result as JSON with the following structure:
    {
      "topics": [
        {
          "id": "topic-id",
          "title": "Topic Title",
          "summary": [
            {
              "point": "Concise bullet point with key information",
              "slideReference": "Slides X-Y (or specific slide number if single slide)"
            }
          ]
        }
      ]
    }
    
    Guidelines for topic identification:
    - Include both major themes and important technical details
    - Consider chronological progression of concepts
    - Capture any important examples or case studies as separate topics if they illustrate key concepts
    - Keep bullet points focused and concise (1-3 sentences)
    - Use clear, academic language
    - Ensure slide references are accurate and helpful for students
    - If a concept is discussed across multiple slides, provide the full range
    - If a concept is discussed out of order, make this clear in the slide reference

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
      model: "gpt-4",
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
