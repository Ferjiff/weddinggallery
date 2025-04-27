import { Button } from "@/components/ui/button";

interface HeaderProps {
  onToggleUpload: () => void;
}

export default function Header({ onToggleUpload }: HeaderProps) {
  return (
    <header className="border-b border-[#A67C52]/20 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-[#8B4513]">Wedding Album</h1>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={onToggleUpload} 
            className="px-4 py-2 bg-[#6B8E9E] text-white rounded-md hover:bg-[#4A697A] transition"
          >
            <span className="hidden md:inline">Upload Media</span>
            <span className="md:hidden">Upload</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
