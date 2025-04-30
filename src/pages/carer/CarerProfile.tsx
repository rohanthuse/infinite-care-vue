
import React from "react";
import { User, Mail, Phone, MapPin, Briefcase, Shield, Award, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    languages: ["English", "Hindi"],
    certifications: [
      { name: "CPR & First Aid", issuer: "British Red Cross", expiry: "Dec 2024" },
      { name: "Medication Administration", issuer: "NHS", expiry: "Jan 2025" },
      { name: "Moving & Handling", issuer: "Health & Safety Executive", expiry: "Mar 2025" }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <CardTitle className="text-xl text-center">{profileData.name}</CardTitle>
            <p className="text-gray-500 text-center">{profileData.role}</p>
            <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Active
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{profileData.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{profileData.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{profileData.address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>{profileData.experience}</span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-gray-200">
              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                View Documents
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {profileData.qualifications.map((qualification, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>{qualification}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {profileData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md border border-gray-100">
                    <div>
                      <div className="font-medium text-gray-800">{cert.name}</div>
                      <div className="text-sm text-gray-500">Issued by {cert.issuer}</div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Expires: {cert.expiry}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Languages
                </CardTitle>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={index} className="space-y-1">
                      <div className="font-medium">{day}</div>
                      <div className={`px-2 py-1 rounded-md text-xs font-medium ${index < 5 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
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
    </div>
  );
};

export default CarerProfile;
