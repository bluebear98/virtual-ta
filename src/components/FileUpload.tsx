import { ChangeEvent, useState } from 'react';
import { Typography, Button } from '@mui/material';

interface FileUploadProps {
  onFileContent: (content: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileContent, disabled }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Upload a text file for your transcript
      </Typography>
      <Button
        variant="outlined"
        component="label"
        disabled={disabled}
        fullWidth
        sx={{
          height: '100px',
          border: '2px dashed',
          borderColor: disabled ? 'grey.300' : 'primary.main',
          '&:hover': {
            border: '2px dashed',
            borderColor: 'primary.dark',
            bgcolor: 'primary.50'
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
              color="primary"
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
          'Choose File'
        )}
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt"
          hidden
        />
      </Button>
    </div>
  );
}
