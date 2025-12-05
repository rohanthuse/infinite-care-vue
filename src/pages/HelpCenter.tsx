import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, BookOpen, MessageCircle, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

const HelpCenter = () => {
  const categories = [
    { icon: BookOpen, title: "Getting Started", description: "New to Med-Infinite? Start here.", articles: 12 },
    { icon: MessageCircle, title: "Account & Billing", description: "Manage your subscription and payments.", articles: 8 },
    { icon: Phone, title: "Scheduling", description: "Learn about scheduling features.", articles: 15 },
    { icon: Mail, title: "Care Plans", description: "Create and manage care plans.", articles: 20 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find answers to your questions and get the support you need.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Search for help articles..." className="pl-12 h-12 text-lg" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <category.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                  <span className="text-xs text-blue-600">{category.articles} articles</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
