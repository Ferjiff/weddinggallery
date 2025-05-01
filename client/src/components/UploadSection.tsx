import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { CloudUpload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface UploadSectionProps {
  isVisible: boolean;
  onCancel: () => void;
}

export default function UploadSection({ isVisible, onCancel }: UploadSectionProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const mediaFiles = droppedFiles.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (mediaFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please drop only image or video files.",
        variant: "destructive"
      });
      return;
    }
    setFiles(mediaFiles);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([e.target.files[0]]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please select or capture media files first.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('media', file);
    });

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 150);

      await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(interval);
      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: `${files.length} media file(s) uploaded.`
      });

      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
        onCancel();
        queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      }, 1000);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your media. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isVisible) return null;

  return (
    <section className="mb-10">
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-serif text-[#8B4513] mb-6">Add to the Album</h2>
          <div className="bg-[#F9F7F3] rounded-lg p-5 border border-[#E8E8E8]">
            <h3 className="text-xl font-serif text-[#A67C52] mb-4">Upload Files</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-[#6B8E9E]/40 rounded-lg p-8 text-center cursor-pointer transition hover:border-[#6B8E9E]"
            >
              <div className="mb-4">
                <CloudUpload className="h-12 w-12 mx-auto text-[#6B8E9E]" />
              </div>
              <p className="text-[#4A697A] mb-2">Tap to take or choose a file</p>
              <Button className="px-4 py-2 bg-[#6B8E9E] text-white rounded-md hover:bg-[#4A697A] transition">
                Browse / Camera
              </Button>
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <p className="text-xs text-[#333333]/60 mt-4">Image or video (max 50MB)</p>
            </div>
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">{files.length} file selected</p>
                <ul className="mt-2 text-xs text-[#333333]/70 max-h-20 overflow-y-auto">
                  {files.map((file, index) => (
                    <li key={index} className="truncate">{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isUploading && (
            <div className="mt-6">
              <h3 className="text-lg font-serif text-[#A67C52] mb-2">Uploading Media...</h3>
              <Progress value={uploadProgress} className="h-4 bg-[#E8E8E8]" />
              <p className="text-sm text-[#333333]/70 mt-1">{uploadProgress}%</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              onClick={onCancel}
              variant="outline"
              className="px-4 py-2 border border-[#333333]/30 text-[#333333] rounded-md hover:bg-[#E8E8E8] transition mr-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-[#8B4513] text-white rounded-md hover:bg-[#6A370F] transition"
            >
              Add to Album
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
