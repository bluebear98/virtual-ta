import { createContext, useContext, useState, ReactNode } from 'react';
import { TopicChunk } from '../types';

interface AnalysisContextType {
  transcript: string;
  setTranscript: (value: string) => void;
  slides: string[];
  setSlides: (value: string[]) => void;
  topics: TopicChunk[];
  setTopics: (value: TopicChunk[]) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  error: string;
  setError: (value: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [transcript, setTranscript] = useState('');
  const [slides, setSlides] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <AnalysisContext.Provider value={{
      transcript,
      setTranscript,
      slides,
      setSlides,
      topics,
      setTopics,
      loading,
      setLoading,
      error,
      setError,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
