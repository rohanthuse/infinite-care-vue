import React from "react";
import { FileCheck, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientNavigation } from "@/hooks/useClientNavigation";
import { useClientAgreements } from "@/data/hooks/useClientAgreements";

export const AgreementShortcutCard = () => {
  const { navigateToClientPage } = useClientNavigation();
  const { data: agreements, isLoading } = useClientAgreements();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingAgreements = agreements?.filter(a => a.status === "Pending") || [];
  const totalAgreements = agreements?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">My Agreements</CardTitle>
          </div>
          {pendingAgreements.length > 0 && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {pendingAgreements.length} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {totalAgreements === 0 ? (
              "No agreements found"
            ) : (
              <>
                You have <span className="font-medium text-foreground">{totalAgreements}</span> agreement{totalAgreements !== 1 ? 's' : ''}
                {pendingAgreements.length > 0 && (
                  <span className="text-warning-foreground">
                    {" "}with {pendingAgreements.length} requiring your attention
                  </span>
                )}
              </>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-between" 
            onClick={() => navigateToClientPage("/agreements")}
          >
            View All Agreements
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};