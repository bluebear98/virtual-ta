'use client';

import React, { useState } from 'react';
import TranscriptUpload from '@/components/TranscriptUpload';
import TopicDisplay from '@/components/TopicDisplay';
import type { TranscriptAnalysis } from '@/types';

export default function Home() {
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Virtual Teaching Assistant
        </h1>
        
        {!analysis ? (
          <TranscriptUpload onAnalysisComplete={setAnalysis} />
        ) : (
          <>
            <button
              onClick={() => setAnalysis(null)}
              className="mb-6 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Upload Another Transcript
            </button>
            <TopicDisplay topics={analysis.topics} />
            
            {analysis.metadata.speakerDistribution && (
              <div className="mt-8 p-6 bg-white rounded-lg shadow-sm max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-4">Participation Analysis</h2>
                <div className="flex justify-around">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.metadata.speakerDistribution.professor}
                    </div>
                    <div className="text-sm text-gray-600">Professor Segments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.metadata.speakerDistribution.student}
                    </div>
                    <div className="text-sm text-gray-600">Student Segments</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 