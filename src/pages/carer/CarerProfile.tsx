
import React from "react";
import { User, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const CarerProfile: React.FC = () => {
  const carerName = localStorage.getItem("carerName") || "Carer";
  
  // Placeholder data - would be fetched from API in a real application
  const profileData = {
    name: carerName,
    email: "carer@med-infinite.com",
    phone: "+44 7700 900123",
    address: "123 Healthcare Street, London, UK",
    role: "Home Care Specialist",
    qualifications: ["Registered Nurse", "Dementia Care Certified", "First Aid Certified"],
    experience: "5+ years in home healthcare",
    languages: ["English", "Hindi"]
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold mb-4">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold">{profileData.name}</h2>
            <p className="text-gray-500">{profileData.role}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{profileData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{profileData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{profileData.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>{profileData.experience}</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Qualifications</h3>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {profileData.qualifications.map((qualification, index) => (
                  <li key={index}>{qualification}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Languages</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.languages.map((language, index) => (
                  <div key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {language}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Availability</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <div key={index} className="space-y-1">
                    <div className="font-medium">{day}</div>
                    <div className={`px-2 py-1 rounded ${index < 5 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {index < 5 ? "Available" : "Unavailable"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CarerProfile;
