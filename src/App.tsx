
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import MedicalMental from "./pages/MedicalMental";
import TypeOfWork from "./pages/TypeOfWork";
import BodyMapPoints from "./pages/BodyMapPoints";
import Branch from "./pages/Branch";
import BranchAdmins from "./pages/BranchAdmins";
import Agreement from "./pages/Agreement";
import { useState } from "react";

function App() {
  // Create a new QueryClient instance inside the component
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/super-admin" element={<SuperAdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/services" element={<Services />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agreement" element={<Agreement />} />
            
            {/* Key Parameters Routes */}
            <Route path="/hobbies" element={<Hobbies />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/medical-mental" element={<MedicalMental />} />
            <Route path="/type-of-work" element={<TypeOfWork />} />
            <Route path="/body-map-points" element={<BodyMapPoints />} />
            <Route path="/branch" element={<Branch />} />
            <Route path="/branch-admins" element={<BranchAdmins />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
