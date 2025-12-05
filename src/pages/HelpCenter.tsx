import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { HelpCircle, Search, BookOpen, Settings, Users, FileText, ArrowRight, MessageCircle, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HelpCenter = () => {
  const categories = [
    { icon: BookOpen, title: "Getting Started", description: "New to Med-Infinite? Start here.", articles: 12, color: "from-blue-500 to-cyan-500" },
    { icon: Settings, title: "Account & Settings", description: "Manage your account.", articles: 18, color: "from-purple-500 to-pink-500" },
    { icon: Users, title: "Staff Management", description: "Scheduling and permissions.", articles: 15, color: "from-emerald-500 to-teal-500" },
    { icon: FileText, title: "Care Plans", description: "Create and manage care plans.", articles: 22, color: "from-amber-500 to-orange-500" },
  ];

  const popular = [
    { title: "How to create your first care plan", cat: "Getting Started" },
    { title: "Setting up staff schedules", cat: "Staff Management" },
    { title: "Understanding compliance reports", cat: "Reports" },
    { title: "Mobile app installation guide", cat: "Getting Started" },
  ];

  const contact = [
    { icon: MessageCircle, title: "Live Chat", desc: "Chat with our team", avail: "9am-6pm" },
    { icon: Phone, title: "Phone Support", desc: "Call us directly", avail: "0800 123 4567" },
    { icon: Video, title: "Video Call", desc: "Screen share session", avail: "Book a slot" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Support Center" badgeIcon={HelpCircle} title="How Can We" highlightedText="Help You?" description="Find answers, browse guides, or contact our support team." />

        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Search for help articles..." className="pl-12 h-14 text-lg rounded-xl shadow-sm" />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700">Search</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {categories.map((c, i) => (
            <div key={i} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className={`w-14 h-14 bg-gradient-to-br ${c.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}><c.icon className="h-7 w-7 text-white" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{c.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{c.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">{c.articles} articles</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popular.map((a, i) => (
              <div key={i} className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between">
                <div><h3 className="font-medium text-gray-900 group-hover:text-blue-600">{a.title}</h3><span className="text-sm text-gray-500">{a.cat}</span></div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contact.map((c, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4"><c.icon className="h-7 w-7 text-blue-600" /></div>
                <h3 className="font-semibold text-gray-900 mb-2">{c.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{c.desc}</p>
                <span className="text-blue-600 text-sm font-medium">{c.avail}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;