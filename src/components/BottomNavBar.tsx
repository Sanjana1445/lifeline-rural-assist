
import { Home, Clock, GraduationCap, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "History", path: "/history", icon: Clock },
    { name: "Education", path: "/education", icon: GraduationCap },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const IconComponent = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center ${
              isActive ? "text-eresq-navy" : "text-gray-400"
            }`}
          >
            <IconComponent size={20} />
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNavBar;
