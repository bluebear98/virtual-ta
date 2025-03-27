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
    learningObjectives: string[];  // What students should be able to do after studying this topic
    summary: Array<{
      point: string;
      slideReference: string;
      keyTerms?: string[];  // Important terminology introduced in this point
      examples?: string[];  // Specific examples or applications
      practiceQuestions?: string[];  // Self-check questions for understanding
    }>;
  }>;
}

const messages = [
  {
    role: "system",
    content: "You are an expert at analyzing lecture transcripts and creating comprehensive study materials for students. Your task is to identify main topics and create detailed, student-friendly bullet point summaries that help students understand and revise the lecture content. Focus on clarity, completeness, and educational value. Always maintain chronological order of concepts unless explicitly noted otherwise in the transcript. You MUST ALWAYS respond with valid JSON that exactly matches the specified structure."
  },
  {
    role: "user",
    content: `Analyze this lecture transcript and identify ALL main topics discussed (Exhaustive, and in the order they are discussed). For each topic:
    1. Create a clear, concise title that captures the main theme
    2. List 2-4 specific learning objectives that students should achieve after studying this topic
    3. Provide 5-8 comprehensive bullet points that:
       - Explain key concepts in detail
       - Include important definitions and terminology
       - Highlight relationships between concepts
       - Provide relevant examples or applications
       - Note any important formulas, equations, or technical details
       - Include any practical implications or real-world applications
    4. For each bullet point:
       - Make it self-contained and understandable without additional context
       - Use clear, academic language while remaining accessible
       - Include specific details that help with understanding and memorization
       - Reference the relevant slide numbers where this concept was discussed
       - List key terms introduced in this point
       - Provide specific examples or applications
       - Include 1-2 practice questions to check understanding
    
    IMPORTANT: You MUST return a valid JSON object that EXACTLY matches this structure:
    {
      "topics": [
        {
          "id": "topic-id",
          "title": "Topic Title",
          "learningObjectives": [
            "Students will be able to...",
            "Students will understand..."
          ],
          "summary": [
            {
              "point": "Comprehensive bullet point with all relevant details",
              "slideReference": "Slides X-Y (or specific slide number if single slide)",
              "keyTerms": ["term1", "term2"],
              "examples": ["example1", "example2"],
              "practiceQuestions": ["question1", "question2"]
            }
          ]
        }
      ]
    }

    Guidelines for topic identification and summarization:
    - Break down complex topics into clear, digestible sections
    - Include both theoretical concepts and practical applications
    - Maintain logical flow between topics and bullet points
    - Ensure each bullet point provides complete information for understanding
    - Include any important caveats, exceptions, or special cases
    - For technical content, explain both the what and the why
    - Keep slide references accurate and in chronological order unless explicitly noted otherwise
    - If a concept is discussed across multiple slides, provide the full range
    - If a concept is discussed out of order, make this clear in the slide reference
    - Make learning objectives specific and measurable
    - Include a mix of theoretical and practical examples
    - Design practice questions that test both understanding and application
    - Ensure all JSON fields are present and properly formatted
    - Do not include any text outside the JSON structure
    - Use proper JSON escaping for special characters

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
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Try to extract JSON if there's any text before or after it
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;

    let parsedResponse: ChunkResponse;
    try {
      parsedResponse = JSON.parse(jsonContent);
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
    console.error('OpenAI API error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error processing request'
    });
  }
}
