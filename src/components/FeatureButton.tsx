
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface FeatureButtonProps {
  icon: LucideIcon;
  label: string;
  to: string;
}

const FeatureButton = ({ icon: Icon, label, to }: FeatureButtonProps) => {
  return (
    <Link
      to={to}
      className="flex items-center p-4 bg-white rounded-lg shadow-sm mb-4 hover:bg-gray-50"
    >
      <div className="mr-3 text-eresq-navy">
        <Icon size={24} />
      </div>
      <span className="text-eresq-navy font-medium">{label}</span>
    </Link>
  );
};

export default FeatureButton;
