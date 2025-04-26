
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";

const Education = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Education</h1>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-center text-gray-600 p-6">
            Educational resources will appear here.
          </p>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Education;
