
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const CarerPayroll = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="text-gray-600">View your pay statements and earnings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pay Statements
          </CardTitle>
          <CardDescription>Your recent pay statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No pay statements available</p>
            <p className="text-sm text-gray-400">Your pay statements will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerPayroll;
