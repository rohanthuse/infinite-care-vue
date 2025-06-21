
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import BranchDashboard from "@/pages/BranchDashboard";
import Documents from "@/pages/Documents";
import Reports from "@/pages/Reports";
import Accounting from "@/pages/Accounting";
import ThirdPartyAccess from "@/pages/ThirdPartyAccess";
import Library from "@/pages/Library";
import Notifications from "@/pages/Notifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Standalone documents route */}
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } 
      />
      
      {/* Standalone notifications route */}
      <Route 
        path="/notifications/*" 
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      
      {/* Branch-specific routes */}
      <Route 
        path="/branch-dashboard/:id/:branchName/*" 
        element={
          <ProtectedRoute>
            <Routes>
              <Route index element={<BranchDashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="accounting" element={<Accounting />} />
              <Route path="documents" element={<Documents />} />
              <Route path="library" element={<Library />} />
              <Route path="third-party" element={<ThirdPartyAccess />} />
              <Route path="notifications/*" element={<Notifications />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};
