
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { News2Dashboard } from "./News2Dashboard";
import { useParams } from "react-router-dom";

export const News2Section: React.FC = () => {
  const { id: branchId = "" } = useParams<{ id: string }>();
  
  return (
    <div className="space-y-4">
      <News2Dashboard branchId={branchId} />
    </div>
  );
};
