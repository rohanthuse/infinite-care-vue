import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const CaseStudies = () => {
  const studies = [
    {
      title: "Sunrise Care Home",
      category: "Residential Care",
      description: "How Sunrise Care Home reduced administrative time by 40% and improved care quality scores.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop",
    },
    {
      title: "Community Health Services",
      category: "Domiciliary Care",
      description: "Transforming home care delivery with real-time scheduling and mobile care management.",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop",
    },
    {
      title: "NHS Partnership Trust",
      category: "Healthcare Network",
      description: "Scaling care coordination across 50+ facilities with unified data management.",
      image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&h=250&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Success Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how healthcare providers are transforming their operations with Med-Infinite.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {studies.map((study, index) => (
            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <img src={study.image} alt={study.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <span className="text-sm text-blue-600 font-medium">{study.category}</span>
                <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-3">{study.title}</h3>
                <p className="text-gray-600 mb-4">{study.description}</p>
                <button className="text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Read Case Study <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudies;
