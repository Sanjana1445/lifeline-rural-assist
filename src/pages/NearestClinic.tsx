
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
  distance: string;
  address: string;
  phone: string;
  isOpen: boolean;
  location?: { lat: number; lng: number };
}

const NearestClinic = () => {
  const [clinics] = useState<Clinic[]>([
    {
      id: "1",
      name: "Arogya Primary Health Center",
      type: "PHC",
      distance: "1.2 km",
      address: "123 Main Road, Village Nagar",
      phone: "+91 9876543210",
      isOpen: true,
      location: { lat: 28.6139, lng: 77.2090 }, // Example coordinates (Delhi)
    },
    {
      id: "2",
      name: "Swasthya Sub-Center",
      type: "Sub-center",
      distance: "2.5 km",
      address: "456 Central Avenue, Gram Panchayat",
      phone: "+91 8765432109",
      isOpen: true,
      location: { lat: 28.6198, lng: 77.2150 }, // Nearby location
    },
    {
      id: "3",
      name: "Jeevan Community Health Center",
      type: "CHC",
      distance: "3.8 km",
      address: "789 Hospital Road, District Area",
      phone: "+91 7654321098",
      isOpen: true,
      location: { lat: 28.6080, lng: 77.2010 }, // Nearby location
    },
    {
      id: "4",
      name: "Nirmal Ayushman Health Station",
      type: "Health Post",
      distance: "4.2 km",
      address: "101 Health Street, Block B",
      phone: "+91 6543210987",
      isOpen: false,
      location: { lat: 28.6240, lng: 77.2180 }, // Nearby location
    },
    {
      id: "5",
      name: "AIIMS Rural Extension Center",
      type: "Medical Center",
      distance: "5.6 km",
      address: "202 Medical Campus, District HQ",
      phone: "+91 5432109876",
      isOpen: true,
      location: { lat: 28.6050, lng: 77.2300 }, // Nearby location
    },
  ]);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userAddress, setUserAddress] = useState("Locating you...");
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { toast } = useToast();

  // Function to initialize the map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
    
    const mapOptions = {
      center: userLocation || { lat: 28.6139, lng: 77.2090 }, // Default to Delhi if user location not available
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
            <p>${clinic.type} • ${clinic.distance}</p>
            <p style="margin-top: 4px;">${clinic.address}</p>
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });
      
      return marker;
    }).filter(Boolean);
    
    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: googleMapRef.current,
        title: "Your Location",
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        }
      });
    }
  };

  // Load Google Maps API
  useEffect(() => {
    // Load user's location
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
            description: "Unable to access your location. Using default location.",
            variant: "destructive"
          });
        }
      );
    }
    
    // Load Google Maps script
    if (!window.google) {
      window.initMap = function() {
        // Map will be initialized when user location is available
        if (userLocation) {
          initializeMap();
        }
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
    }
  }, [toast]);
  
  // Initialize map when user location or Google Maps API becomes available
  useEffect(() => {
    if (window.google && userLocation) {
      initializeMap();
    }
  }, [userLocation]);

  // Function to get directions to a clinic
  const getDirections = (clinic: Clinic) => {
    if (!clinic.location || !userLocation) return;
    
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
                {clinic.type} • {clinic.distance} away
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
