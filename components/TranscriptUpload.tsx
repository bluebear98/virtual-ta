'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import type { TranscriptAnalysis } from '../types';

interface TranscriptUploadProps {
  onAnalysisComplete: (analysis: TranscriptAnalysis) => void;
}

export default function TranscriptUpload({ onAnalysisComplete }: TranscriptUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('transcript', file);

    try {
      const response = await fetch('/api/analyze-transcript', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze transcript');
      }

      onAnalysisComplete(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload transcript');
    } finally {
      setIsLoading(false);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Lecture Transcript</h2>
      <div
        {...getRootProps()}
        className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }`}
      >
        <input {...getInputProps()} />
        <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
          <DocumentTextIcon className="h-8 w-8 text-slate-600" />
        </div>
        <p className="text-lg font-medium text-slate-900 mb-2">
          {isDragActive
            ? 'Drop your transcript here'
            : 'Drop your transcript file here, or click to browse'
          }
        </p>
        <p className="text-sm text-slate-600">Only .txt files are accepted</p>
      </div>

      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-slate-700 font-medium">Analyzing transcript...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
} 