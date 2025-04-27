import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MediaFile } from "@shared/schema";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface MediaViewerProps {
  media: MediaFile;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function MediaViewer({ media, onClose, onNavigate }: MediaViewerProps) {
  // Prevent scrolling of the body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose, onNavigate]);

  return (
    <div 
      className="fixed inset-0 bg-[#333333]/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl p-2 md:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="relative bg-white rounded-lg overflow-hidden shadow-xl">
          {/* Navigation arrows */}
          <button 
            onClick={() => onNavigate('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md transition"
            aria-label="Previous media"
          >
            <ChevronLeft className="h-6 w-6 text-[#8B4513]" />
          </button>
          
          <button 
            onClick={() => onNavigate('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md transition"
            aria-label="Next media"
          >
            <ChevronRight className="h-6 w-6 text-[#8B4513]" />
          </button>

          {/* Media preview */}
          <CardContent className="p-0 flex items-center justify-center min-h-[300px] max-h-[80vh]">
            {media.fileType.startsWith('image/') ? (
              <img 
                src={`/api/media/${media.id}`} 
                alt={media.fileName} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <video 
                src={`/api/media/${media.id}`} 
                className="max-w-full max-h-[80vh] object-contain" 
                controls
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            )}
          </CardContent>

          {/* Action bar */}
          <CardFooter className="bg-white p-4 border-t border-[#E8E8E8] flex justify-between items-center">
            <a 
              href={`/api/media/${media.id}/download`}
              download
              className="inline-flex items-center px-4 py-2 border border-[#6B8E9E] text-[#6B8E9E] rounded-md hover:bg-[#6B8E9E]/10 transition"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
            <Button 
              onClick={onClose}
              variant="ghost" 
              className="inline-flex items-center px-4 py-2 text-[#333333] hover:bg-[#E8E8E8] rounded-md transition"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
