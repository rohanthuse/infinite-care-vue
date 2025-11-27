import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';

interface CarerDemoViewProps {
  branchId: string;
}

// Sample demo data for carer/staff view
const demoCarerData = {
  id: 'demo-carer-001',
  name: 'Sarah Johnson',
  role: 'Senior Care Worker',
  employeeId: 'EMP-2024-001',
  email: 'sarah.johnson@demo.com',
  phone: '+44 20 7946 0960',
  address: '456 Staff Road, London, E1 6AN',
  startDate: '2022-06-15',
  status: 'Active',
  qualifications: [
    { name: 'NVQ Level 3 Health & Social Care', status: 'Valid', expiry: '2025-06-15' },
    { name: 'First Aid Certificate', status: 'Valid', expiry: '2024-12-01' },
    { name: 'Manual Handling', status: 'Valid', expiry: '2024-08-15' },
    { name: 'Medication Administration', status: 'Renewal Due', expiry: '2024-02-01' },
  ],
  todaySchedule: [
    { time: '07:00 - 08:00', client: 'John Smith', location: '123 Care Lane', status: 'Completed' },
    { time: '09:00 - 10:00', client: 'Mary Johnson', location: '78 Oak Street', status: 'Completed' },
    { time: '11:00 - 12:00', client: 'Robert Brown', location: '45 Elm Avenue', status: 'In Progress' },
    { time: '14:00 - 15:00', client: 'Patricia Davis', location: '22 Pine Road', status: 'Scheduled' },
    { time: '17:00 - 18:00', client: 'John Smith', location: '123 Care Lane', status: 'Scheduled' },
  ],
  weeklyStats: {
    totalHours: 38,
    completedVisits: 24,
    scheduledVisits: 6,
    travelMiles: 45,
  }
};

const CarerDemoView = ({ branchId }: CarerDemoViewProps) => {
  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-purple-800">Demo Staff Data</h3>
            <p className="text-sm text-purple-700 mt-1">
              This is sample data for demonstration purposes. In a live environment, you would see real staff records based on your access permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Staff Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Staff Profile
          </CardTitle>
          <CardDescription>Basic staff information and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{demoCarerData.name}</h3>
                  <p className="text-sm text-muted-foreground">{demoCarerData.role}</p>
                  <Badge variant="default" className="mt-1 bg-green-500">
                    {demoCarerData.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>Employee ID: {demoCarerData.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Started: {new Date(demoCarerData.startDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{demoCarerData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{demoCarerData.email}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span>{demoCarerData.address}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{demoCarerData.weeklyStats.totalHours}</p>
              <p className="text-sm text-muted-foreground">Hours This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{demoCarerData.weeklyStats.completedVisits}</p>
              <p className="text-sm text-muted-foreground">Completed Visits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{demoCarerData.weeklyStats.scheduledVisits}</p>
              <p className="text-sm text-muted-foreground">Scheduled Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{demoCarerData.weeklyStats.travelMiles}</p>
              <p className="text-sm text-muted-foreground">Miles Traveled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Qualifications & Training */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Qualifications & Training
          </CardTitle>
          <CardDescription>Current certifications and training status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoCarerData.qualifications.map((qual, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 ${
                    qual.status === 'Valid' ? 'text-green-500' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{qual.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(qual.expiry).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={qual.status === 'Valid' ? 'outline' : 'destructive'}>
                  {qual.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Current day visit schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoCarerData.todaySchedule.map((visit, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[80px]">
                    <p className="text-xs font-medium text-primary">{visit.time.split(' - ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{visit.time.split(' - ')[1]}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{visit.client}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {visit.location}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  visit.status === 'Completed' ? 'default' : 
                  visit.status === 'In Progress' ? 'secondary' : 'outline'
                } className={
                  visit.status === 'Completed' ? 'bg-green-500' : 
                  visit.status === 'In Progress' ? 'bg-blue-500 text-white' : ''
                }>
                  {visit.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerDemoView;
