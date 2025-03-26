import { useState } from 'react'
import Head from 'next/head'
import { TopicChunk } from '../types'
import type { FormEvent } from 'react';
import FileUpload from '../components/FileUpload';
import PDFUpload from '../components/PDFUpload';

export default function Home() {
  const [transcript, setTranscript] = useState('')
  const [slides, setSlides] = useState<string[]>([])
  const [topics, setTopics] = useState<TopicChunk[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const trimmedTranscript = transcript.trim()
    if (!trimmedTranscript) {
      setError('Please provide a non-empty transcript');
      setLoading(false);
      return;
    }

    // Add debug logging
    console.log('Debug - Transcript:', {
      length: trimmedTranscript.length,
      preview: trimmedTranscript.substring(0, 200) + '...',
      full: trimmedTranscript
    });
    // Create a new array with trimmed slides
    const trimmedSlides = slides.map(slide => slide.trim());
    console.log('Debug - Slides:', {
      count: trimmedSlides.length,
      previews: trimmedSlides.map((slide, i) => ({
        slideNumber: i + 1,
        preview: slide.substring(0, 100) + '...'
      }))
    });

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: trimmedTranscript,
          slides: trimmedSlides
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(`Server error: ${data.message || 'Unknown error'}`);
      }
      
      console.log('API Response:', data);
      setTopics(data.chunks || [])
      setError('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing transcript';
      setError(errorMessage);
      console.error('Full error details:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Virtual TA - Lecture Analyzer</title>
        <meta name="description" content="Analyze lecture transcripts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lecture Analyzer</h1>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <FileUpload
              onFileContent={setTranscript}
              disabled={loading}
            />
            <PDFUpload
              onPDFContent={setSlides}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !transcript}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Transcript'}
          </button>
        </form>

        {error && <div className="text-red-500 mt-4">{error}</div>}

        <div className="space-y-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="p-4 border rounded shadow"
            >
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
              >
                <h3 className="text-lg font-semibold">{topic.title}</h3>
                <p className="text-gray-600">{topic.summary}</p>
              </div>
              
              {expandedId === topic.id && (
                <ul className="mt-4 ml-4 list-disc space-y-2">
                  {topic.bulletPoints.map((bulletPoint, index) => (
                    <li key={index}>
                      <div>{bulletPoint.point}</div>
                      <div className="ml-4 mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {slides.length > 0 && bulletPoint.slideIndex !== undefined && (
                          <div className="text-xs text-green-600 mb-1">
                            Slide {bulletPoint.slideIndex + 1}
                          </div>
                        )}
                        - {bulletPoint.transcript}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
