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

// Auth Pages
import LoginPage from "./pages/auth/Login";
import VerifyOtpPage from "./pages/auth/VerifyOtp";
import CompleteProfilePage from "./pages/auth/CompleteProfile";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Authentication Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />

            {/* Existing Routes */}
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
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
