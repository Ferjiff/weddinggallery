import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { MediaFile } from "@shared/schema";
import { Download, Image, Film } from "lucide-react";
import MediaViewer from "./MediaViewer";

interface GallerySectionProps {
  onUploadRequest: () => void;
}

export default function GallerySection({ onUploadRequest }: GallerySectionProps) {
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const { data: mediaItems, isLoading, error } = useQuery<MediaFile[]>({
    queryKey: ['/api/media'],
  });

  const filteredMedia = mediaItems?.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'photos') return item.fileType.startsWith('image/');
    if (filter === 'videos') return item.fileType.startsWith('video/');
    return true;
  }) || [];

  const handleMediaClick = (media: MediaFile, index: number) => {
    setSelectedMedia(media);
    setSelectedIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedMedia(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!filteredMedia.length) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = (selectedIndex - 1 + filteredMedia.length) % filteredMedia.length;
    } else {
      newIndex = (selectedIndex + 1) % filteredMedia.length;
    }
    
    setSelectedMedia(filteredMedia[newIndex]);
    setSelectedIndex(newIndex);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">Error loading media</p>
        <p className="text-sm text-[#333333]/70">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  const isEmptyGallery = !isLoading && (!mediaItems || mediaItems.length === 0);

  return (
    <section>
      {/* Filter Controls */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-2xl font-serif text-[#8B4513] mb-4 md:mb-0">Our Moments</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm ${
              filter === 'all' 
                ? 'bg-[#6B8E9E] text-white' 
                : 'border border-[#6B8E9E] text-[#6B8E9E]'
            } rounded-md transition`}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('photos')}
            className={`px-3 py-1 text-sm ${
              filter === 'photos' 
                ? 'bg-[#6B8E9E] text-white' 
                : 'border border-[#6B8E9E] text-[#6B8E9E]'
            } rounded-md transition`}
          >
            Photos
          </Button>
          <Button
            onClick={() => setFilter('videos')}
            className={`px-3 py-1 text-sm ${
              filter === 'videos' 
                ? 'bg-[#6B8E9E] text-white' 
                : 'border border-[#6B8E9E] text-[#6B8E9E]'
            } rounded-md transition`}
          >
            Videos
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg overflow-hidden shadow-md aspect-square animate-pulse" />
          ))}
        </div>
      ) : isEmptyGallery ? (
        <div className="py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[#6B8E9E]/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-serif text-[#8B4513] mb-3">No Media Yet</h3>
          <p className="text-[#333333]/70 max-w-md mx-auto mb-6">Be the first to add photos and videos to this wedding album.</p>
          <Button
            onClick={onUploadRequest}
            className="px-5 py-2.5 bg-[#6B8E9E] text-white rounded-md hover:bg-[#4A697A] transition"
          >
            Add Photos & Videos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMedia.map((item, index) => (
            <div 
              key={item.id}
              onClick={() => handleMediaClick(item, index)}
              className="media-container cursor-pointer rounded-lg overflow-hidden shadow-md bg-white transition hover:translate-y-[-5px]"
            >
              <div className="relative aspect-square">
                {item.fileType.startsWith('image/') ? (
                  <img 
                    src={`/api/media/${item.id}`} 
                    alt={item.fileName} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={`/api/media/${item.id}/thumbnail`} 
                      alt={item.fileName} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center">
                        <Film className="h-6 w-6 text-[#8B4513]" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <a 
                    href={`/api/media/${item.id}/download`}
                    className="p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm transition"
                    onClick={(e) => e.stopPropagation()}
                    download
                  >
                    <Download className="h-4 w-4 text-[#4A697A]" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewer 
          media={selectedMedia}
          onClose={handleCloseViewer}
          onNavigate={handleNavigate}
        />
      )}
    </section>
  );
}
