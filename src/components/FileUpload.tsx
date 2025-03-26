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
    <div className="w-full mb-6">
      <label className={`w-full h-48 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed border-gray-300' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'}`}>
        <p className="text-sm text-gray-600">Upload a text file</p>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".txt"
          disabled={disabled}
          className="hidden"
        />
      </label>
    </div>
  );
}
