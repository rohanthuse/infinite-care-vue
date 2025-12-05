import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Video, BookOpen, Download } from "lucide-react";

const Resources = () => {
  const resources = [
    { icon: FileText, title: "Documentation", description: "Comprehensive guides and API documentation", count: "50+ articles" },
    { icon: Video, title: "Video Tutorials", description: "Step-by-step video guides for all features", count: "25+ videos" },
    { icon: BookOpen, title: "Best Practices", description: "Industry standards and compliance guides", count: "15+ guides" },
    { icon: Download, title: "Templates", description: "Ready-to-use care plan and form templates", count: "30+ templates" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Resources & Learning
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to get the most out of Med-Infinite. Access guides, tutorials, and templates.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <resource.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-gray-600 mb-2">{resource.description}</p>
                  <span className="text-sm text-blue-600 font-medium">{resource.count}</span>
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

export default Resources;
