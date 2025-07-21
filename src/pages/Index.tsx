
import { CustomButton } from "@/components/ui/CustomButton";
import { Heart, Users, Calendar, FileText, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Med-Infinite</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive healthcare management platform for efficient care delivery and administration
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-xl font-semibold">Admin Portal</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access the administration dashboard to manage branches, staff, and oversee all operations.
            </p>
            <CustomButton 
              onClick={() => window.location.href = '/admin-login'}
              className="w-full"
            >
              Admin Login
            </CustomButton>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-xl font-semibold">Carer Portal</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access your dashboard to manage appointments, view client information, and track your schedule.
            </p>
            <CustomButton 
              onClick={() => window.location.href = '/carer-login'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Carer Login
            </CustomButton>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <Heart className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-xl font-semibold">Client Portal</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View your care plans, communicate with your care team, and manage your appointments.
            </p>
            <CustomButton 
              onClick={() => window.location.href = '/client-login'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Client Login
            </CustomButton>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">Appointment Management</h3>
              <p className="text-gray-600">Efficient scheduling and booking system</p>
            </div>
            <div className="text-center">
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">Care Plans</h3>
              <p className="text-gray-600">Comprehensive care planning and tracking</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-gray-600">Efficient staff and client management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
