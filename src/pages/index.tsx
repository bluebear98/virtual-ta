import { useState } from 'react'
import Head from 'next/head'
import { TopicChunk } from '../types'
import type { FormEvent } from 'react';
import FileUpload from '../components/FileUpload';
import PDFUpload from '../components/PDFUpload';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap" />
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontFamily: 'Orbitron',
          fontWeight: 700,
          letterSpacing: 1
        }}>
          Lecture Analyzer
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Upload your lecture transcript and slides to get a detailed analysis
        </Typography>
        
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <FileUpload
                onFileContent={setTranscript}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PDFUpload
                onPDFContent={setSlides}
                disabled={loading}
              />
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
                  <Typography variant="h6">{topic.title}</Typography>
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
      </Container>
    </>
  )
}