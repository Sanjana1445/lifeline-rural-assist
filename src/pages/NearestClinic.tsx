
import { useState } from "react";
import { ArrowLeft, MapPin, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

interface Clinic {
  id: string;
  name: string;
  type: string;
  distance: string;
  address: string;
  phone: string;
  isOpen: boolean;
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
    },
    {
      id: "2",
      name: "Swasthya Sub-Center",
      type: "Sub-center",
      distance: "2.5 km",
      address: "456 Central Avenue, Gram Panchayat",
      phone: "+91 8765432109",
      isOpen: true,
    },
    {
      id: "3",
      name: "Jeevan Community Health Center",
      type: "CHC",
      distance: "3.8 km",
      address: "789 Hospital Road, District Area",
      phone: "+91 7654321098",
      isOpen: true,
    },
    {
      id: "4",
      name: "Nirmal Ayushman Health Station",
      type: "Health Post",
      distance: "4.2 km",
      address: "101 Health Street, Block B",
      phone: "+91 6543210987",
      isOpen: false,
    },
    {
      id: "5",
      name: "AIIMS Rural Extension Center",
      type: "Medical Center",
      distance: "5.6 km",
      address: "202 Medical Campus, District HQ",
      phone: "+91 5432109876",
      isOpen: true,
    },
  ]);

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
            <span className="font-medium">Village Nagar, District Area</span>
          </div>
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
                <a
                  href="#"
                  className="flex items-center text-eresq-navy text-sm"
                >
                  <Navigation size={16} className="mr-1" />
                  <span>Directions</span>
                </a>
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
