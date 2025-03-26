import { ChangeEvent, useState, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Typography, Button } from '@mui/material';
import { SentimentType } from '../types';

let workerSrc = '';
const initWorker = async () => {
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
  workerSrc = pdfjsWorker.default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
};

interface PDFUploadProps {
  onPDFContent: (slides: string[]) => void;
  disabled?: boolean;
}

export default function PDFUpload({ onPDFContent, disabled }: PDFUploadProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');

  useEffect(() => {
    initWorker().catch(console.error);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const slides: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim()
            .replace(/\s+/g, ' '); // Also normalize whitespace
          if (pageText) { // Only add non-empty slides
            slides.push(pageText);
          }
        }

        onPDFContent(slides);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        (Optional) Upload slides
      </Typography>
      <Button
        variant="outlined"
        component="label"
        disabled={disabled}
        fullWidth
        sx={{
          height: '100px',
          border: '2px dashed',
          borderColor: disabled ? 'grey.300' : 'success.main',
          color: disabled ? 'grey.500' : 'success.main',
          '&:hover': {
            border: '2px dashed',
            borderColor: 'success.dark',
            bgcolor: 'success.50',
            color: 'success.dark'
          },
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          padding: 2
        }}
      >
        {selectedFile ? (
          <>
            <Typography 
              variant="body2" 
              color="success.main"
              sx={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {selectedFile}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to change file
            </Typography>
          </>
        ) : (
            'Choose PDF'
        )}
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          hidden
        />
      </Button>
    </div>
  );
}
