import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Briefcase, MapPin, Clock, Heart, Zap, Users, Coffee, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const benefits = [
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive health insurance" },
    { icon: Coffee, title: "Flexible Working", description: "Remote-first with flexible hours" },
    { icon: GraduationCap, title: "Learning Budget", description: "£1,500 annual learning budget" },
    { icon: Zap, title: "Equity Options", description: "Share in our success" },
    { icon: Users, title: "Team Events", description: "Regular team retreats" },
    { icon: Clock, title: "Generous Leave", description: "25 days plus bank holidays" },
  ];

  const jobs = [
    { title: "Senior Full-Stack Developer", dept: "Engineering", loc: "Remote (UK)", type: "Full-time", salary: "£65-85k" },
    { title: "Product Designer", dept: "Design", loc: "London / Remote", type: "Full-time", salary: "£50-70k" },
    { title: "Customer Success Manager", dept: "Customer Success", loc: "Remote (UK)", type: "Full-time", salary: "£40-55k" },
    { title: "Marketing Manager", dept: "Marketing", loc: "London / Remote", type: "Full-time", salary: "£45-60k" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Join Our Team" badgeIcon={Briefcase} title="Build the Future of" highlightedText="Healthcare" description="We're looking for passionate people to join us on our mission to transform healthcare management." />

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Benefits & Perks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><b.icon className="h-6 w-6 text-blue-600" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Open Positions</h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {jobs.map((job, i) => (
              <div key={i} className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.dept}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.loc}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{job.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">{job.salary}</span>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Apply <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </div>
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