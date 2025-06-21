
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BranchDashboard from "./pages/BranchDashboard";
import CarerLogin from "./pages/CarerLogin";
import CarerInvitation from "./pages/CarerInvitation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
            <Route path="/carer-login" element={<CarerLogin />} />
            <Route path="/carer-invitation" element={<CarerInvitation />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
