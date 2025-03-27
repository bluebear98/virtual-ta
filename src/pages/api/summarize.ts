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
    content: "You are an expert at analyzing lecture transcripts. Your task is to identify main topics and create comprehensive bullet point summaries that combine theoretical understanding with practical implications. Each bullet point should provide both the concept and its significance. Always respond with valid JSON."
  },
  {
    role: "user",
    content: `Analyze this lecture transcript and identify ALL main topics discussed (Exhaustive, and in the order they are discussed). For each topic:
    1. Create a clear, concise title
    2. Provide 5-8 comprehensive bullet points that:
       - Start with the core concept or definition
       - Explain how it works or its mechanism
       - Describe its significance and implications
       - Connect it to related concepts or real-world applications
       - Include specific examples or case studies when relevant
       - Note any important formulas or technical details with explanations
       - Reference the specific slide numbers where each concept is discussed
    3. For each bullet point:
       - Structure it as: "What it is → How it works → Why it matters"
       - Use clear, academic language while remaining accessible
       - Include both theoretical understanding and practical implications
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
              "point": "Comprehensive bullet point with concept, mechanism, and implications",
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
    - Structure each bullet point to cover: concept, mechanism, and implications
    - Use clear, academic language while remaining accessible
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
