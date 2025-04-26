
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [role, setRole] = useState("");
  const [documentsSubmitted, setDocumentsSubmitted] = useState({
    aadhar: false,
    identity: false,
    residence: false,
    training: false,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simulate user data
  const userData = {
    name: "Ananya Patel",
    email: "ananya.patel@gmail.com",
    phone: "+91 9876543210",
    address: "123 Village Road, District Center",
  };

  const handleFileUpload = (documentType: keyof typeof documentsSubmitted) => {
    setDocumentsSubmitted((prev) => ({ ...prev, [documentType]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all documents are submitted
    const allSubmitted = Object.values(documentsSubmitted).every(Boolean);
    
    if (allSubmitted && role) {
      toast({
        title: "Registration Successful",
        description: "You are now registered as a frontline worker.",
      });
      
      // Navigate to the frontline worker dashboard
      setTimeout(() => {
        navigate("/frontline-dashboard");
      }, 1000);
    } else {
      toast({
        title: "Registration Incomplete",
        description: "Please upload all required documents and select a role.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          {showRegistration && (
            <button onClick={() => setShowRegistration(false)} className="mr-2">
              <ArrowLeft />
            </button>
          )}
          <h1 className="text-xl font-bold">
            {showRegistration ? "Register as Frontline Worker" : "Profile"}
          </h1>
        </div>

        {!showRegistration ? (
          <>
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h2 className="font-medium text-lg mb-4">Personal Information</h2>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Name</label>
                <p className="font-medium">{userData.name}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Email</label>
                <p className="font-medium">{userData.email}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Phone</label>
                <p className="font-medium">{userData.phone}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-500 text-sm mb-1">Address</label>
                <p className="font-medium">{userData.address}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h2 className="font-medium text-lg mb-4">Settings</h2>
              
              <button
                onClick={() => setShowRegistration(true)}
                className="w-full bg-eresq-navy text-white p-3 rounded-lg hover:bg-opacity-90"
              >
                Register as Frontline Worker
              </button>
              
              <div className="mt-4 space-y-3">
                <Link
                  to="/settings/notifications"
                  className="block w-full text-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Notification Settings
                </Link>
                <Link
                  to="/settings/privacy"
                  className="block w-full text-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Privacy Settings
                </Link>
                <button
                  className="w-full text-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h2 className="font-medium text-lg mb-4">Select Role</h2>
              
              <div className="space-y-2">
                {["ASHA", "PHC", "ANM", "Tertiary Health Care Worker", "Other"].map((option) => (
                  <label
                    key={option}
                    className={`block p-3 border rounded-lg cursor-pointer ${
                      role === option ? "border-eresq-navy bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option}
                      checked={role === option}
                      onChange={() => setRole(option)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <h2 className="font-medium text-lg mb-4">Upload Required Documents</h2>
              
              <p className="text-gray-600 mb-4">
                Please upload the following documents to complete your registration:
              </p>
              
              <div className="space-y-4">
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Aadhar Card</span>
                    {documentsSubmitted.aadhar ? (
                      <span className="text-green-600 text-sm">Uploaded</span>
                    ) : (
                      <label className="bg-eresq-navy text-white px-3 py-1 rounded text-sm cursor-pointer">
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => handleFileUpload("aadhar")}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Proof of Identity</span>
                    {documentsSubmitted.identity ? (
                      <span className="text-green-600 text-sm">Uploaded</span>
                    ) : (
                      <label className="bg-eresq-navy text-white px-3 py-1 rounded text-sm cursor-pointer">
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => handleFileUpload("identity")}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Proof of Residency</span>
                    {documentsSubmitted.residence ? (
                      <span className="text-green-600 text-sm">Uploaded</span>
                    ) : (
                      <label className="bg-eresq-navy text-white px-3 py-1 rounded text-sm cursor-pointer">
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => handleFileUpload("residence")}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Training Certificate</span>
                    {documentsSubmitted.training ? (
                      <span className="text-green-600 text-sm">Uploaded</span>
                    ) : (
                      <label className="bg-eresq-navy text-white px-3 py-1 rounded text-sm cursor-pointer">
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => handleFileUpload("training")}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-eresq-navy text-white p-3 rounded-lg hover:bg-opacity-90"
            >
              Submit Application
            </button>
          </form>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Profile;
