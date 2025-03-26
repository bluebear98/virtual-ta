import { ChangeEvent } from 'react';

interface FileUploadProps {
  onFileContent: (content: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileContent, disabled }: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-grow">
        <p className="text-sm text-gray-600 mb-2">Upload a text file for your transcript</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt"
          disabled={disabled}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
}
