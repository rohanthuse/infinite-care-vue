import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pound, TrendingUp, Clock, Award } from "lucide-react";

interface CarerRateTabProps {
  carerId: string;
}

export const CarerRateTab: React.FC<CarerRateTabProps> = ({ carerId }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pound className="h-5 w-5" />
            Pay Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">£15.50</div>
              <div className="text-sm text-muted-foreground">Current Hourly Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">£18.00</div>
              <div className="text-sm text-muted-foreground">Weekend Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">£22.00</div>
              <div className="text-sm text-muted-foreground">Overnight Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};