
import { useState } from "react";
import { ArrowLeft, Upload, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

const Triage = () => {
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Simulate AI response
      setMessage("Processing your query...");
      
      setTimeout(() => {
        const responses = [
          "Based on your symptoms, you might be experiencing mild dehydration. Drink plenty of fluids and rest. If symptoms persist for more than 24 hours, please consult a healthcare provider.",
          "Your symptoms suggest a common cold. Rest, stay hydrated, and take over-the-counter cold medication if needed. If you develop a high fever or difficulty breathing, seek medical attention immediately.",
          "From your description, you may have a minor allergic reaction. Avoid the potential allergen and monitor your symptoms. If you experience swelling of the face or difficulty breathing, seek emergency care.",
          "This appears to be a minor injury. Clean the wound with soap and water, apply antiseptic, and cover with a clean bandage. If the wound is deep or becomes infected, consult a healthcare provider.",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessage(randomResponse);
      }, 2000);
    }
  };

  const toggleRecording = () => {
    setRecording(!recording);
    
    if (!recording) {
      // Simulate voice recording and response
      setTimeout(() => {
        setQuery("I have a headache and feel dizzy since yesterday");
        setTimeout(() => {
          setRecording(false);
          
          setMessage("Based on your voice description, you might be experiencing symptoms of low blood pressure or dehydration. Try to drink water, have some rest, and avoid sudden movements. If symptoms persist or worsen, please consult a healthcare provider immediately.");
        }, 2000);
      }, 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          
          // Simulate AI analysis of the image
          setTimeout(() => {
            setMessage("The image shows what appears to be a minor skin rash. It doesn't seem to have severe characteristics, but monitor for changes. Apply a cold compress and avoid scratching. If the rash spreads or is accompanied by fever, seek medical advice.");
          }, 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Triage & Symptom Checker</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-gray-600 mb-4">
            Describe your symptoms or upload an image for AI analysis. Our system
            will help assess your condition and provide guidance.
          </p>

          <label className="block mb-4">
            <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer hover:bg-gray-50">
              {selectedImage ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Uploaded"
                    className="max-h-24 max-w-full mb-2"
                  />
                  <p className="text-xs text-gray-500">Image uploaded</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Upload image</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </label>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="AI assistance"
                className="w-full p-3 border border-gray-300 rounded-lg pr-12"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                  recording ? "bg-red-100 text-red-600" : "text-gray-400"
                }`}
              >
                <Mic size={20} className={recording ? "animate-pulse" : ""} />
              </button>
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-eresq-navy text-white p-3 rounded-lg hover:bg-opacity-90"
            >
              Get Help
            </button>
          </form>
        </div>

        {message && (
          <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
            <h3 className="font-medium text-eresq-navy mb-2">AI Assessment:</h3>
            <p className="text-gray-700">{message}</p>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Triage;
