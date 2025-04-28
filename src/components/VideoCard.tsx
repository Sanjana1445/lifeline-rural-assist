
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface VideoCardProps {
  title: string;
  url: string;
  thumbnail: string;
  description: string;
}

const VideoCard = ({ title, url, thumbnail, description }: VideoCardProps) => {
  const handleVideoClick = () => {
    window.open(url, '_blank');
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-md cursor-pointer mb-4"
      onClick={handleVideoClick}
    >
      <div className="relative">
        <img 
          src={thumbnail} 
          alt={title} 
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/320x180?text=Video";
          }}
        />
        <div className="absolute bottom-2 right-2 bg-eresq-navy p-1 rounded-full">
          <ExternalLink size={16} className="text-white" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default VideoCard;
