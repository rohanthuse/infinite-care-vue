import React from "react";
import { FileCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { useClientAgreements } from "@/data/hooks/useClientAgreements";
export const AgreementShortcutCard = () => {
  const {
    navigateToClientPage
  } = useClientNavigation();
  const {
    data: agreements,
    isLoading
  } = useClientAgreements();
  if (isLoading) {
    return <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>;
  }
  const pendingAgreements = agreements?.filter(a => a.status === "Pending") || [];
  const totalAgreements = agreements?.length || 0;
  return;
};