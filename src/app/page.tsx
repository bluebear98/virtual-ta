'use client';

import { useState } from 'react';
import TranscriptUpload from '../components/TranscriptUpload';
import SlideUpload from '../components/SlideUpload';
import TopicDisplay from '../components/TopicDisplay';
import type { TranscriptAnalysis } from '../types';

interface SlideSummary {
  number: number;
  content: string;
  summary: string;
}

export default function Home() {
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
  const [slideSummaries, setSlideSummaries] = useState<SlideSummary[]>([]);
  const [isReady, setIsReady] = useState(false);

  const handleSlidesUploaded = (summaries: SlideSummary[]) => {
    setSlideSummaries(summaries);
    setIsReady(true);
  };

  const handleAnalysisComplete = async (transcriptAnalysis: TranscriptAnalysis) => {
    if (slideSummaries.length > 0) {
      // Match topics with relevant slides
      const analysisWithSlides = {
        ...transcriptAnalysis,
        topics: await Promise.all(transcriptAnalysis.topics.map(async topic => {
          const response = await fetch('/api/match-slides', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic,
              slideSummaries,
            }),
          });

          const data = await response.json();
          return {
            ...topic,
            slideReferences: data.slideReferences || [],
          };
        })),
      };
      setAnalysis(analysisWithSlides);
    } else {
      setAnalysis(transcriptAnalysis);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-slate-900 text-center mb-2">
          Virtual Teaching Assistant
        </h1>
        <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
          Upload your lecture slides and transcript to get an AI-powered analysis of the content,
          including topic summaries and slide references.
        </p>

        <div className="space-y-8">
          <SlideUpload onSlidesUploaded={handleSlidesUploaded} />
          <TranscriptUpload onAnalysisComplete={handleAnalysisComplete} />
          
          {slideSummaries.length > 0 && !analysis && (
            <div className="w-full max-w-2xl mx-auto p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-blue-800">
                Slides uploaded successfully! Now upload your transcript to see the analysis.
              </p>
            </div>
          )}

          {analysis && (
            <TopicDisplay 
              topics={analysis.topics} 
              slideSummaries={slideSummaries}
            />
          )}
        </div>
      </div>
    </main>
  );
} 