
import { useState, useRef } from "react";
import { ArrowLeft, Upload, Camera, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Triage = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      // Reset any previous camera errors
      setCameraError(null);

      // Request camera permissions explicitly with proper constraints
      const constraints = {
        video: {
          facingMode: {
            ideal: "environment"
          },
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        }
      };
      console.log("Requesting camera access with constraints:", constraints);

      // Try to access the camera
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setCameraActive(true);
              toast({
                title: "Camera active",
                description: "Tap the center button to capture an image"
              });
            }).catch(playError => {
              console.error('Video play error:', playError);
              setCameraError("Failed to start video preview");
              throw new Error('Failed to start video preview');
            });
          };
        }
      }).catch(err => {
        console.error('Error accessing camera:', err);

        // Show a more specific error message based on the error
        let errorMessage = "Unable to access your camera.";
        if (err.name === 'NotAllowedError') {
          errorMessage += " You denied camera access. Please check permissions and try again.";
        } else if (err.name === 'NotFoundError') {
          errorMessage += " No camera found on your device.";
        } else if (err.name === 'NotReadableError') {
          errorMessage += " Your camera might be in use by another application.";
        } else {
          errorMessage += " Please check permissions and try again.";
        }
        setCameraError(errorMessage);
        toast({
          title: "Camera Error",
          description: errorMessage,
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error('General camera error:', error);
      setCameraError("Failed to initialize camera. Please try again.");
      toast({
        title: "Camera Error",
        description: "Unable to access your camera due to a system error. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context && videoRef.current.videoWidth) {
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Draw the video frame to the canvas
        context.drawImage(videoRef.current, 0, 0);
        try {
          // Convert the canvas to a data URL and set as selected image
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
          setSelectedImage(dataUrl);

          // Stop the camera stream
          stopCamera();
          toast({
            title: "Image captured",
            description: "Image captured successfully. You can now analyze the image."
          });
        } catch (e) {
          console.error('Error capturing image:', e);
          toast({
            title: "Error",
            description: "Failed to capture image. Please try again.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          toast({
            title: "Image Uploaded",
            description: "Image uploaded successfully. You can now analyze the image."
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please capture or upload an image first.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch(`${window.location.origin}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: selectedImage
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Image has been analyzed successfully."
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-24">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Triage & Symptom Checker</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-gray-600 mb-4">
            Take a photo or upload an image of your symptoms for AI analysis.
          </p>

          {/* Camera View */}
          {cameraActive && (
            <div className="relative mb-4">
              <video ref={videoRef} className="w-full h-64 object-cover rounded-lg bg-black" autoPlay playsInline muted />
              <button onClick={captureImage} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow">
                <div className="w-12 h-12 rounded-full border-2 border-gray-400"></div>
              </button>
            </div>
          )}

          {/* Canvas for capturing image */}
          <canvas ref={canvasRef} className="hidden"></canvas>

          {/* Image Display/Upload Area */}
          {!cameraActive && (
            <div className="mb-4">
              {selectedImage ? (
                <div className="relative">
                  <img src={selectedImage} alt="Uploaded" className="w-full h-64 object-contain rounded-lg" />
                  <button onClick={resetAnalysis} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                    <ArrowLeft size={16} className="transform rotate-45" />
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={startCamera} className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Camera size={48} className="mb-2 text-gray-400" />
                    <p className="text-center text-gray-500">
                      Tap to take a photo
                    </p>
                  </button>
                  
                  {cameraError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{cameraError}</p>
                      <p className="text-xs text-red-500 mt-1">
                        You can still use the upload button below.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Upload Option */}
              {!selectedImage && (
                <label className="mt-2 block text-center">
                  <div className="inline-flex items-center text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    <Upload size={16} className="mr-1" /> Upload image instead
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          )}

          {/* Analysis Actions */}
          {selectedImage && !isAnalyzing && !analysisResult && (
            <Button 
              onClick={analyzeImage} 
              className="w-full mt-2"
            >
              Analyze Image
            </Button>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p className="text-gray-600">Analyzing image...</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-lg mb-2">Analysis Results</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNavBar />
    </div>
  );
};

export default Triage;
