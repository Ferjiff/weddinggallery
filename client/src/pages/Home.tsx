import { useState } from "react";
import Header from "@/components/Header";
import UploadSection from "@/components/UploadSection";
import GallerySection from "@/components/GallerySection";

export default function Home() {
  const [isUploadSectionVisible, setIsUploadSectionVisible] = useState(false);

  const toggleUploadSection = () => {
    setIsUploadSectionVisible(!isUploadSectionVisible);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <Header onToggleUpload={toggleUploadSection} />

      <main className="container mx-auto p-4 md:p-8">
        <UploadSection 
          isVisible={isUploadSectionVisible} 
          onCancel={() => setIsUploadSectionVisible(false)} 
        />
        <GallerySection 
          onUploadRequest={() => setIsUploadSectionVisible(true)} 
        />
      </main>
    </div>
  );
}
