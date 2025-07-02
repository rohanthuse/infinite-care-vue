
import { useParams, Navigate } from "react-router-dom";

export const BranchDetailsRedirect = () => {
  const { id } = useParams<{ id: string }>();
  
  console.log('BranchDetailsRedirect - Redirecting from legacy route with ID:', id);
  
  // If we have an actual UUID, redirect to the new admin path
  if (id && id !== ':id') {
    return <Navigate to={`/admin/branch-details/${id}`} replace />;
  }
  
  // If no valid ID, redirect to branches list
  return <Navigate to="/admin/branch" replace />;
};
