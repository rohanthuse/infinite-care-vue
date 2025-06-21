
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { BranchDashboard } from "@/pages/BranchDashboard";
import { ClientProfile } from "@/pages/ClientProfile";
import { Staff } from "@/pages/Staff";
import { StaffProfile } from "@/pages/StaffProfile";
import { Reports } from "@/pages/Reports";
import { Accounting } from "@/pages/Accounting";
import { Messages } from "@/pages/Messages";
import { Forms } from "@/pages/Forms";
import { Documents } from "@/pages/Documents";
import { ThirdPartyAccess } from "@/pages/ThirdPartyAccess";
import { Library } from "@/pages/Library";
import { Bookings } from "@/pages/Bookings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
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
      
      {/* Branch-specific routes */}
      <Route 
        path="/branch-dashboard/:id/:branchName/*" 
        element={
          <ProtectedRoute>
            <Routes>
              <Route index element={<BranchDashboard />} />
              <Route path="staff" element={<Staff />} />
              <Route path="reports" element={<Reports />} />
              <Route path="accounting" element={<Accounting />} />
              <Route path="messages" element={<Messages />} />
              <Route path="forms" element={<Forms />} />
              <Route path="documents" element={<Documents />} />
              <Route path="library" element={<Library />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="third-party" element={<ThirdPartyAccess />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
      
      {/* Client profile routes */}
      <Route 
        path="/client/:clientId" 
        element={
          <ProtectedRoute>
            <ClientProfile />
          </ProtectedRoute>
        } 
      />
      
      {/* Staff profile routes */}
      <Route 
        path="/staff/:staffId" 
        element={
          <ProtectedRoute>
            <StaffProfile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};
