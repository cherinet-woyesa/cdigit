import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
}

export default function FileUpload({ onFileChange, file }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    onFileChange(selectedFile);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ID Copy Attachment
      </label>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col w-full h-32 border-4 border-dashed hover:bg-gray-100 hover:border-gray-300 rounded-lg cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-7">
            <UploadCloud className="w-8 h-8 text-gray-400" />
            <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
              Attach a file
            </p>
          </div>
          <input type="file" onChange={handleFileChange} className="opacity-0" />
        </label>
      </div>
      {file && (
        <div className="flex items-center mt-2 p-2 bg-gray-100 rounded-lg">
          <FileIcon className="w-6 h-6 text-gray-500" />
          <span className="ml-2 text-sm text-gray-700">{file.name}</span>
          <button onClick={() => onFileChange(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
