import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, PoundSterling, CreditCard } from "lucide-react";

interface GeneralTabProps {
  clientId: string;
  branchId?: string;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ clientId, branchId }) => {
  const [activeSubTab, setActiveSubTab] = useState("general-setting");

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general-setting">General Setting</TabsTrigger>
          <TabsTrigger value="general-accounting">General Accounting Settings</TabsTrigger>
          <TabsTrigger value="private-accounting">Private Accounting Setting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general-setting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Setting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  General settings configuration will be added here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="general-accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PoundSterling className="h-5 w-5" />
                General Accounting Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  General accounting settings will be added here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="private-accounting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Private Accounting Setting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Private accounting settings will be added here...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
