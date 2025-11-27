import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Heart, 
  Calendar, 
  FileText, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

interface ClientDemoViewProps {
  branchId: string;
}

// Sample demo data for client view
const demoClientData = {
  id: 'demo-client-001',
  name: 'John Smith',
  dateOfBirth: '1945-03-15',
  address: '123 Care Lane, London, SW1A 1AA',
  phone: '+44 20 7946 0958',
  email: 'john.smith@demo.com',
  emergencyContact: 'Mary Smith (Daughter) - +44 20 7946 0959',
  carePlan: {
    status: 'Active',
    startDate: '2024-01-15',
    reviewDate: '2024-07-15',
    primaryNeeds: ['Mobility Support', 'Medication Management', 'Personal Care'],
    goals: [
      { name: 'Maintain independence at home', progress: 75 },
      { name: 'Improve mobility', progress: 60 },
      { name: 'Social engagement', progress: 80 },
    ]
  },
  recentVisits: [
    { date: '2024-01-20', time: '09:00 - 10:00', carer: 'Sarah Johnson', status: 'Completed' },
    { date: '2024-01-19', time: '18:00 - 19:00', carer: 'Mike Brown', status: 'Completed' },
    { date: '2024-01-18', time: '09:00 - 10:00', carer: 'Sarah Johnson', status: 'Completed' },
  ],
  upcomingVisits: [
    { date: '2024-01-21', time: '09:00 - 10:00', carer: 'Sarah Johnson' },
    { date: '2024-01-21', time: '18:00 - 19:00', carer: 'Mike Brown' },
    { date: '2024-01-22', time: '09:00 - 10:00', carer: 'Sarah Johnson' },
  ]
};

const ClientDemoView = ({ branchId }: ClientDemoViewProps) => {
  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Demo Client Data</h3>
            <p className="text-sm text-blue-700 mt-1">
              This is sample data for demonstration purposes. In a live environment, you would see real client records based on your access permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Client Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Profile
          </CardTitle>
          <CardDescription>Basic client information and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{demoClientData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  DOB: {new Date(demoClientData.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span>{demoClientData.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{demoClientData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{demoClientData.email}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Emergency Contact</h4>
                <p className="text-sm">{demoClientData.emergencyContact}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Care Plan Summary
          </CardTitle>
          <CardDescription>Current care plan status and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-green-500">
                {demoClientData.carePlan.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Started: {new Date(demoClientData.carePlan.startDate).toLocaleDateString()} • 
                Review: {new Date(demoClientData.carePlan.reviewDate).toLocaleDateString()}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Primary Care Needs</h4>
              <div className="flex flex-wrap gap-2">
                {demoClientData.carePlan.primaryNeeds.map((need, index) => (
                  <Badge key={index} variant="secondary">{need}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Care Goals Progress</h4>
              <div className="space-y-3">
                {demoClientData.carePlan.goals.map((goal, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{goal.name}</span>
                      <span className="text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Recent Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoClientData.recentVisits.map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{new Date(visit.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{visit.time} • {visit.carer}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {visit.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Upcoming Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoClientData.upcomingVisits.map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{new Date(visit.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{visit.time} • {visit.carer}</p>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDemoView;
