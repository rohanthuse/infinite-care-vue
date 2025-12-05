import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Clock, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const jobs = [
    { title: "Senior Frontend Developer", department: "Engineering", location: "London, UK", type: "Full-time" },
    { title: "Product Manager", department: "Product", location: "Remote", type: "Full-time" },
    { title: "Customer Success Manager", department: "Support", location: "Manchester, UK", type: "Full-time" },
    { title: "Healthcare Consultant", department: "Consulting", location: "Remote", type: "Contract" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us transform healthcare. We're looking for passionate people who want to make a real difference.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.type}</span>
                    </div>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
