import { useState } from 'react';
import Head from 'next/head';
import { TopicChunk } from '../types';
import type { FormEvent } from 'react';
import FileUpload from '../components/FileUpload';
import PDFUpload from '../components/PDFUpload';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Layout from '../components/Layout';
import { useAnalysis } from '../context/AnalysisContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ProfessorView() {
  const {
    transcript,
    setTranscript,
    slides,
    setSlides,
    topics,
    setTopics,
    loading,
    setLoading,
    error,
    setError
  } = useAnalysis();

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const chartData = {
    labels: topics.map(topic => topic.title),
    datasets: [
      {
        label: 'Engagement Score',
        data: topics.map(topic => topic.sentimentScore),
        backgroundColor: topics.map(topic => {
          switch(topic.sentiment) {
            case 'confused': return 'rgba(255, 99, 132, 0.5)';
            case 'neutral': return 'rgba(54, 162, 235, 0.5)';
            case 'engaged': return 'rgba(75, 192, 192, 0.5)';
            default: return 'rgba(201, 203, 207, 0.5)';
          }
        })
      }
    ]
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const trimmedTranscript = transcript.trim()
    if (!trimmedTranscript) {
      setError('Please provide a non-empty transcript');
      setLoading(false);
      return;
    }

    const trimmedSlides = slides.map(slide => slide.trim());

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
      
      setTopics(data.chunks || [])
      setError('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing transcript';
      setError(errorMessage);
      console.error('Full error details:', error)
    } finally {
      setLoading(false)
    }
  };

  return (
    <Layout title="Lecture Analyzer - Professor View">
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FileUpload onFileContent={setTranscript} disabled={loading} />
            </Grid>
            <Grid item xs={12} md={6}>
              <PDFUpload onPDFContent={setSlides} disabled={loading} />
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !transcript}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? 'Analyzing...' : 'Analyze Lecture'}
          </Button>
        </Paper>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {topics.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Topic Engagement Overview
          </Typography>
          <Box sx={{ height: 400 }}>
            <Bar 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </Box>
        </Paper>
      )}

      <div>
        {topics.map((topic) => (
          <Accordion 
            key={topic.id}
            expanded={expandedId === topic.id}
            onChange={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">{topic.title}</Typography>
                  <Chip 
                    label={`${topic.sentiment} (${topic.sentimentScore}%)`}
                    color={topic.sentiment === 'confused' ? 'error' : topic.sentiment === 'engaged' ? 'success' : 'info'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {topic.summary}
                </Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {topic.bulletPoints.map((bulletPoint, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={bulletPoint.point}
                      secondary={
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                          {slides.length > 0 && bulletPoint.slideIndex !== undefined && (
                            <Chip
                              label={`Slide ${bulletPoint.slideIndex + 1}`}
                              size="small"
                              color="success"
                              sx={{ mb: 1 }}
                            />
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {bulletPoint.transcript}
                          </Typography>
                        </Paper>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </Layout>
  );
}
