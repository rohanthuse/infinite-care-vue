import React from 'react';
import { Calendar, Clock, User, Heart, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientScheduleTab } from '@/components/client/ClientScheduleTab';
import { useNavigate } from 'react-router-dom';
import { useClientNavigation } from '@/hooks/useClientNavigation';

const ClientSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { createClientPath } = useClientNavigation();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(createClientPath(''))}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">My Care Schedule</h1>
          </div>
          <p className="text-muted-foreground">View and manage your care appointments and schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Schedule Content */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-secondary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Care Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ClientScheduleTab />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/appointments'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">View Appointments</h3>
              <p className="text-sm text-muted-foreground">See all upcoming appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/care-plans'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Heart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Care Plans</h3>
              <p className="text-sm text-muted-foreground">Review your care plan details</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/messages'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Contact Care Team</h3>
              <p className="text-sm text-muted-foreground">Message your care providers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientSchedule;