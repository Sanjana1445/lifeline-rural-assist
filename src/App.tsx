
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SOSAlert from "./pages/SOSAlert";
import NearestClinic from "./pages/NearestClinic";
import ConnectCFRs from "./pages/ConnectCFRs";
import Triage from "./pages/Triage";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Education from "./pages/Education";
import FrontlineDashboard from "./pages/FrontlineDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sos-alert" element={<SOSAlert />} />
          <Route path="/nearest-clinic" element={<NearestClinic />} />
          <Route path="/connect-cfrs" element={<ConnectCFRs />} />
          <Route path="/triage" element={<Triage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/education" element={<Education />} />
          <Route path="/frontline-dashboard" element={<FrontlineDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
