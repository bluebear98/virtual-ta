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
import Layout from '../components/Layout';
import { useAnalysis } from '../context/AnalysisContext';

export default function Home() {
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

  const [expandedId, setExpandedId] = useState<number | null>(null)

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
      setTopics(data.topics || [])
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
    <Layout title="Lecture Analyzer">
      <Head>
        <title>Virtual TA - Lecture Analyzer</title>
        <meta name="description" content="Analyze lecture transcripts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
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
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {topic.summary.map((item, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                          <Typography component="span" variant="body1" sx={{ 
                            color: 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '1.2em',
                            lineHeight: 1
                          }}>
                            •
                          </Typography>
                          <Typography component="span" variant="body1" sx={{ flex: 1 }}>
                            {item.point}
                          </Typography>
                          <Chip
                            label={item.slideReference}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              ml: 2,
                              alignSelf: 'flex-start',
                              flexShrink: 0,
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText',
                              '&:hover': {
                                backgroundColor: 'primary.main',
                                cursor: 'pointer'
                              }
                            }}
                          />
                        </div>
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
  )
}