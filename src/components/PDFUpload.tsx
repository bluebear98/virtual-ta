import { ChangeEvent } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Initialize PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFUploadProps {
  onPDFContent: (slides: string[]) => void;
  disabled?: boolean;
}

export default function PDFUpload({ onPDFContent, disabled }: PDFUploadProps) {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    <div className="flex items-center gap-4">
      <div className="flex-grow">
        <p className="text-sm text-gray-600 mb-2">(Optional) Upload slides</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          disabled={disabled}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
        />
      </div>
    </div>
  );
}
