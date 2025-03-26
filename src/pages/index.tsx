import { useState } from 'react'
import Head from 'next/head'
import { TopicChunk } from '../types'
import type { FormEvent } from 'react';

export default function Home() {
  const [transcript, setTranscript] = useState('')
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

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: trimmedTranscript }),
      })
      if (!res.ok) {
        throw new Error('Failed to process transcript');
      }
      const data = await res.json()
      setTopics(data.chunks || [])
      setError('');
    } catch (error) {
      setError('Error processing transcript');
      console.error('Error:', error)
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
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-48 p-2 border rounded"
            placeholder="Paste your lecture transcript here..."
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
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
