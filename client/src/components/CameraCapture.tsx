import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Video, StopCircle } from "lucide-react";

interface CameraCaptureProps {
  onMediaCaptured: (blob: Blob) => void;
}

export default function CameraCapture({ onMediaCaptured }: CameraCaptureProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (cameraActive) {
        // Stop the camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setCameraActive(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      // Start the camera
      const constraints = {
        video: true,
        audio: isVideoMode
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera or microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const toggleMode = () => {
    if (cameraActive) {
      // Stop current stream before changing mode
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    }
    
    setIsVideoMode(!isVideoMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          onMediaCaptured(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const toggleRecording = () => {
    if (!videoRef.current || !streamRef.current) return;

    if (!isRecording) {
      // Start recording
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      try {
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      } catch (e) {
        try {
          // Try another mime type if the first one is not supported
          mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        } catch (e) {
          toast({
            title: "Recording Error",
            description: "Video recording is not supported in this browser.",
            variant: "destructive"
          });
          return;
        }
      }
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        onMediaCaptured(blob);
        setIsRecording(false);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Video recording has started. Click again to stop."
      });
      
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleCapture = () => {
    if (isVideoMode) {
      toggleRecording();
    } else {
      capturePhoto();
    }
  };

  return (
    <div className="bg-[#F9F7F3] rounded-lg p-5 border border-[#E8E8E8]">
      <h3 className="text-xl font-serif text-[#A67C52] mb-4">Capture Moment</h3>
      <div className="text-center">
        <div className="mb-4 relative border border-[#6B8E9E]/40 rounded-lg aspect-video bg-[#333333]/10 flex items-center justify-center overflow-hidden">
          {!cameraActive && (
            <div className="text-[#333333]/60">
              Camera preview will appear here
            </div>
          )}
          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`}
            autoPlay 
            playsInline
            muted
          />
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          <Button
            onClick={startCamera}
            className="px-4 py-2 bg-[#6B8E9E] text-white rounded-md hover:bg-[#4A697A] transition"
          >
            {cameraActive ? "Stop Camera" : "Start Camera"}
          </Button>
          <Button
            onClick={handleCapture}
            disabled={!cameraActive}
            className="px-4 py-2 bg-[#8B4513] text-white rounded-md hover:bg-[#6A370F] transition disabled:opacity-50"
          >
            {isVideoMode ? (
              isRecording ? (
                <span className="flex items-center">
                  <StopCircle className="w-4 h-4 mr-1" /> Stop Recording
                </span>
              ) : (
                <span className="flex items-center">
                  <Video className="w-4 h-4 mr-1" /> Start Recording
                </span>
              )
            ) : (
              <span className="flex items-center">
                <Camera className="w-4 h-4 mr-1" /> Take Photo
              </span>
            )}
          </Button>
          <Button
            onClick={toggleMode}
            variant="outline"
            className="px-3 py-2 border border-[#6B8E9E] text-[#6B8E9E] rounded-md hover:bg-[#6B8E9E]/10 transition"
          >
            {isVideoMode ? "Switch to Photo" : "Switch to Video"}
          </Button>
        </div>
      </div>
    </div>
  );
}
