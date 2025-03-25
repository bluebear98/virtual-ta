'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { Topic } from '../types';

interface TopicDisplayProps {
  topics: Topic[];
}

export default function TopicDisplay({ topics }: TopicDisplayProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Lecture Topics</h2>
      <div className="space-y-4">
        {topics.map((topic) => {
          const isExpanded = expandedTopics.has(topic.id);
          return (
            <div
              key={topic.id}
              className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => toggleTopic(topic.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900">{topic.title}</h3>
                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <ul className="space-y-3">
                    {topic.summary.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-3 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                        <span className="text-slate-700">{point}</span>
                      </li>
                    ))}
                  </ul>

                  {topic.details && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-3">Additional Details</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{topic.details}</p>
                    </div>
                  )}

                  {topic.slideReferences && topic.slideReferences.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-3">Related Slides</h4>
                      <ul className="space-y-2">
                        {topic.slideReferences.map((ref, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium mr-2">
                              Slide {ref.slideNumber}
                            </span>
                            <span className="text-slate-700">{ref.content}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 