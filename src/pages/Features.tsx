import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Clock, Users, FileText, Calendar, Bell } from "lucide-react";

const Features = () => {
  const features = [
    { icon: Shield, title: "Secure Care Management", description: "End-to-end encryption and HIPAA-compliant data handling for complete peace of mind." },
    { icon: Clock, title: "Real-Time Scheduling", description: "Intelligent scheduling system that optimizes staff allocation and reduces conflicts." },
    { icon: Users, title: "Team Collaboration", description: "Seamless communication tools for care teams, families, and administrators." },
    { icon: FileText, title: "Digital Care Plans", description: "Comprehensive digital care plans with automated reminders and tracking." },
    { icon: Calendar, title: "Appointment Management", description: "Easy booking and management of all client appointments in one place." },
    { icon: Bell, title: "Smart Notifications", description: "Customizable alerts for medications, appointments, and care updates." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Care
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how Med-Infinite transforms healthcare management with innovative tools designed for efficiency and quality care.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
