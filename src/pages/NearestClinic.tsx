
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";

// Import Google Maps script
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Clinic {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  isOpen: boolean;
  location?: { lat: number; lng: number };
}

// Pune, India coordinates
const PUNE_COORDINATES = { lat: 18.5204, lng: 73.8567 };

const NearestClinic = () => {
  const [clinics] = useState<Clinic[]>([
    {
      id: "1",
      name: "Sahyadri Super Speciality Hospital",
      type: "Hospital",
      address: "Plot No. 30-C, Karve Road, Erandwane, Pune",
      phone: "+91 9876543210",
      isOpen: true,
      location: { lat: 18.5120, lng: 73.8289 },
    },
    {
      id: "2",
      name: "Ruby Hall Clinic",
      type: "Hospital",
      address: "40, Sassoon Road, Sangamvadi, Pune",
      phone: "+91 8765432109",
      isOpen: true,
      location: { lat: 18.5316, lng: 73.8788 },
    },
    {
      id: "3",
      name: "Deenanath Mangeshkar Hospital",
      type: "Hospital",
      address: "Erandwane, Pune",
      phone: "+91 7654321098",
      isOpen: true,
      location: { lat: 18.5066, lng: 73.8246 },
    },
    {
      id: "4",
      name: "Jehangir Hospital",
      type: "Hospital",
      address: "32, Sassoon Road, Sangamvadi, Pune",
      phone: "+91 6543210987",
      isOpen: false,
      location: { lat: 18.5301, lng: 73.8795 },
    },
    {
      id: "5",
      name: "KEM Hospital",
      type: "Hospital",
      address: "Rasta Peth, Pune",
      phone: "+91 5432109876",
      isOpen: true,
      location: { lat: 18.5245, lng: 73.8654 },
    },
  ]);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>(PUNE_COORDINATES);
  const [userAddress, setUserAddress] = useState("Locating you...");
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { toast } = useToast();

  // Function to initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    
    const mapOptions = {
      center: userLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
    };
    
    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    
    // Add markers for each clinic
    markersRef.current = clinics.map(clinic => {
      if (!clinic.location) return null;
      
      const marker = new window.google.maps.Marker({
        position: clinic.location,
        map: googleMapRef.current,
        title: clinic.name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        }
      });
      
      // Add info window for each marker
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${clinic.name}</h3>
            <p>${clinic.type}</p>
            <p style="margin-top: 4px;">${clinic.address}</p>
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });
      
      return marker;
    }).filter(Boolean);
    
    // Add user location marker
    new window.google.maps.Marker({
      position: userLocation,
      map: googleMapRef.current,
      title: "Your Location",
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      }
    });
  };

  // Load Google Maps API
  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // Reverse geocode to get address
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: userPos }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                setUserAddress(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Using Pune, India as default location.",
            variant: "destructive"
          });
          
          // Use Pune as default location
          setUserLocation(PUNE_COORDINATES);
          setUserAddress("Pune, Maharashtra, India");
        }
      );
    }
    
    // Load Google Maps script
    if (!window.google) {
      window.initMap = function() {
        // Map will be initialized when Google Maps API is loaded
        initializeMap();
      };
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAi_AKRJVl7INYUzyNDWFPrVQm8xjT56G4&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
        delete window.initMap;
      };
    } else {
      // If Google Maps is already loaded
      initializeMap();
    }
  }, [toast]);
  
  // Re-initialize map when user location changes
  useEffect(() => {
    if (window.google) {
      initializeMap();
    }
  }, [userLocation]);

  // Function to get directions to a clinic
  const getDirections = (clinic: Clinic) => {
    if (!clinic.location) return;
    
    // Open Google Maps for directions in a new tab
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinic.location.lat},${clinic.location.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          <Link to="/" className="mr-2">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">Find Nearest Clinic</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <p className="text-gray-600 mb-2">Your current location:</p>
          <div className="flex items-center text-eresq-navy">
            <MapPin size={18} className="mr-1" />
            <span className="font-medium">{userAddress}</span>
          </div>
        </div>
        
        {/* Google Map */}
        <div className="mb-4 rounded-lg overflow-hidden shadow-sm">
          <div ref={mapRef} className="w-full h-64"></div>
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-3">Nearby Medical Facilities</h2>

        <div className="space-y-3">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium">{clinic.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    clinic.isOpen
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {clinic.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">
                {clinic.type}
              </p>
              <p className="text-sm text-gray-500 mb-3">{clinic.address}</p>
              <div className="flex justify-between">
                <a
                  href={`tel:${clinic.phone}`}
                  className="flex items-center text-eresq-navy text-sm"
                >
                  <Phone size={16} className="mr-1" />
                  <span>Call</span>
                </a>
                <button
                  onClick={() => getDirections(clinic)}
                  className="flex items-center text-eresq-navy text-sm"
                >
                  <Navigation size={16} className="mr-1" />
                  <span>Directions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default NearestClinic;
