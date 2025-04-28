
import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNavBar from "../components/BottomNavBar";
import VideoCard from "../components/VideoCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  description: string | null;
  section: string;
}

const Education = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('section', { ascending: true });

      if (error) {
        console.error("Error fetching videos:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setVideos(data as Video[]);
        
        // Extract unique sections
        const uniqueSections = [...new Set(data.map(video => video.section))];
        setSections(uniqueSections);
        
        // Set default active section
        if (uniqueSections.length > 0 && !activeSection) {
          setActiveSection(uniqueSections[0]);
        }
      }
      
      setLoading(false);
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Education</h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-eresq-navy">Loading videos...</div>
          </div>
        ) : (
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="bg-white shadow-sm mb-4 h-auto p-1 w-auto inline-flex">
                {sections.map((section) => (
                  <TabsTrigger 
                    key={section} 
                    value={section}
                    className="whitespace-nowrap py-2 px-3 text-xs"
                  >
                    {section}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {sections.map((section) => (
              <TabsContent key={section} value={section} className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {videos
                    .filter(video => video.section === section)
                    .map(video => (
                      <VideoCard
                        key={video.id}
                        title={video.title}
                        url={video.url}
                        thumbnail={video.thumbnail || `https://img.youtube.com/vi/${video.url.split('v=')[1]?.split('&')[0]}/default.jpg`}
                        description={video.description || ''}
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Education;
