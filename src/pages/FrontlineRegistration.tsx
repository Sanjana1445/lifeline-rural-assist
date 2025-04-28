
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "../components/Header";
import { ArrowLeft, Upload } from "lucide-react";

interface FrontlineType {
  id: number;
  name: string;
  description: string | null;
}

const FrontlineRegistration = () => {
  const [frontlineTypes, setFrontlineTypes] = useState<FrontlineType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [experience, setExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFrontlineTypes = async () => {
      const { data, error } = await supabase
        .from('frontline_types')
        .select('*')
        .order('name');

      if (error) {
        console.error("Error fetching frontline types:", error);
        return;
      }

      setFrontlineTypes(data || []);
    };

    fetchFrontlineTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to register as a frontline worker",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const certificationDetails = {
        certificateNumber,
        experience,
        registeredAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          is_frontline_worker: true,
          frontline_type: parseInt(selectedType),
          certification_details: certificationDetails
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "You have been registered as a frontline worker"
      });

      navigate('/frontline-dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register as frontline worker",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-4 pb-20">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold">Register as Frontline Worker</h1>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Worker Type</label>
              <Select
                required
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frontline worker type" />
                </SelectTrigger>
                <SelectContent>
                  {frontlineTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} {type.description ? `- ${type.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Certificate/License Number</label>
              <Input
                type="text"
                required
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="Enter your certification or license number"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Experience & Qualifications</label>
              <Textarea
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Briefly describe your experience and qualifications"
                rows={4}
              />
            </div>

            <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Upload certification documents (coming soon)</p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register as Frontline Worker"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FrontlineRegistration;
