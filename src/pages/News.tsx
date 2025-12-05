import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Calendar, ArrowRight, Newspaper, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const News = () => {
  const featuredArticle = {
    title: "Med-Infinite Raises £5M Series A to Transform Healthcare Management",
    excerpt: "We're thrilled to announce our Series A funding round, led by Healthcare Ventures, to accelerate product development and expand into new markets across Europe.",
    date: "December 1, 2024",
    category: "Company News",
    image: "from-blue-600 to-cyan-500"
  };

  const articles = [
    { 
      title: "New Integration with NHS Systems", 
      date: "November 15, 2024", 
      category: "Product Update", 
      excerpt: "Seamless connectivity with NHS Digital services now available for all users.",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      title: "Care Management Best Practices Report 2024", 
      date: "November 1, 2024", 
      category: "Industry Insights", 
      excerpt: "Our annual report on trends and innovations in care management is now available.",
      color: "from-purple-500 to-pink-500"
    },
    { 
      title: "Med-Infinite Wins Healthcare Innovation Award", 
      date: "October 20, 2024", 
      category: "Awards", 
      excerpt: "Recognized for outstanding contribution to digital healthcare transformation.",
      color: "from-amber-500 to-orange-500"
    },
    { 
      title: "Introducing Advanced Analytics Dashboard", 
      date: "October 5, 2024", 
      category: "Product Update", 
      excerpt: "New powerful analytics features to help you make data-driven decisions.",
      color: "from-blue-500 to-indigo-500"
    },
    { 
      title: "Partnership with Leading Care Provider Groups", 
      date: "September 20, 2024", 
      category: "Partnerships", 
      excerpt: "Expanding our reach through strategic partnerships with major care providers.",
      color: "from-rose-500 to-red-500"
    },
    { 
      title: "Mobile App 2.0 Launch", 
      date: "September 1, 2024", 
      category: "Product Update", 
      excerpt: "Completely redesigned mobile experience for carers on the go.",
      color: "from-cyan-500 to-blue-500"
    },
  ];

  const categories = ["All", "Company News", "Product Update", "Industry Insights", "Awards", "Partnerships"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero 
          badge="Latest Updates"
          badgeIcon={Newspaper}
          title="News &"
          highlightedText="Announcements"
          description="Stay up to date with the latest from Med-Infinite. Product updates, company news, and industry insights."
        />

        {/* Featured Article */}
        <div className="mb-16">
          <div className={`bg-gradient-to-r ${featuredArticle.image} rounded-3xl p-8 md:p-12 text-white`}>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
              {featuredArticle.category}
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 max-w-3xl">
              {featuredArticle.title}
            </h2>
            <p className="text-blue-100 text-lg mb-6 max-w-2xl">
              {featuredArticle.excerpt}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar className="h-5 w-5" />
                {featuredArticle.date}
              </div>
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 w-fit">
                Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {articles.map((article, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className={`h-32 bg-gradient-to-br ${article.color}`} />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">{article.category}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{article.excerpt}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {article.date}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Get the latest news, product updates, and industry insights delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="h-12" />
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;