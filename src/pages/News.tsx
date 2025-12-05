import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar } from "lucide-react";

const News = () => {
  const articles = [
    { title: "Med-Infinite Raises £5M Series A", date: "December 1, 2024", category: "Company News", excerpt: "Funding to accelerate product development and expand into new markets." },
    { title: "New Integration with NHS Systems", date: "November 15, 2024", category: "Product Update", excerpt: "Seamless connectivity with NHS Digital services now available." },
    { title: "Care Management Best Practices Report", date: "November 1, 2024", category: "Industry Insights", excerpt: "Our annual report on trends and innovations in care management." },
    { title: "Med-Infinite Wins Healthcare Innovation Award", date: "October 20, 2024", category: "Awards", excerpt: "Recognized for outstanding contribution to digital healthcare transformation." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            News & Updates
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay up to date with the latest from Med-Infinite.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {articles.map((article, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <span className="text-sm text-blue-600 font-medium">{article.category}</span>
              <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2">{article.title}</h3>
              <p className="text-gray-600 mb-3">{article.excerpt}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                {article.date}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;
