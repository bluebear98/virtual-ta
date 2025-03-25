import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { readFile, writeFile, unlink } from 'fs/promises';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const slideFile = formData.get('slides') as Blob;
    
    if (!slideFile) {
      return NextResponse.json(
        { error: 'No slide file provided' },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await slideFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a temporary file path
    const tempPath = `/tmp/slides-${Date.now()}.pdf`;
    await writeFile(tempPath, buffer);

    try {
      // Load and parse PDF
      const loader = new PDFLoader(tempPath);
      const pages = await loader.load();

      // Analyze each page
      const slideSummaries = await Promise.all(
        pages.map(async (page, index) => {
          const slideNumber = index + 1;
          const content = page.pageContent;

          const analysis = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [
              {
                role: "system",
                content: "You are an expert at analyzing lecture slides. Generate a concise summary of the slide content. Focus on key points and main ideas. Return ONLY valid JSON."
              },
              {
                role: "user",
                content: `Analyze this slide content and provide a concise summary. Return in this JSON format: {"summary": "your summary here"}\n\n${content}`
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          });

          const summary = JSON.parse(analysis.choices[0].message.content || '{"summary": ""}').summary;

          return {
            number: slideNumber,
            content: content,
            summary: summary
          };
        })
      );

      return NextResponse.json({ success: true, slideSummaries });
    } finally {
      // Clean up temporary file
      await unlink(tempPath).catch(console.error);
    }
  } catch (error) {
    console.error('Error analyzing slides:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze slides' },
      { status: 500 }
    );
  }
} 