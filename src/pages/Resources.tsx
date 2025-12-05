import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { FileText, Video, BookOpen, Download, ArrowRight, Search, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Resources = () => {
  const categories = [
    { 
      icon: FileText, 
      title: "Documentation", 
      description: "Comprehensive guides and API documentation for all Med-Infinite features.", 
      count: "50+ articles",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Video, 
      title: "Video Tutorials", 
      description: "Step-by-step video guides to help you master every feature.", 
      count: "25+ videos",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: BookOpen, 
      title: "Best Practices", 
      description: "Industry standards, compliance guides, and expert recommendations.", 
      count: "15+ guides",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      icon: Download, 
      title: "Templates", 
      description: "Ready-to-use care plan, assessment, and form templates.", 
      count: "30+ templates",
      color: "from-orange-500 to-amber-500"
    },
  ];

  const featuredArticles = [
    {
      title: "Getting Started with Med-Infinite",
      description: "A complete beginner's guide to setting up your account and creating your first care plan.",
      category: "Documentation",
      readTime: "10 min read",
      featured: true
    },
    {
      title: "CQC Compliance Checklist",
      description: "Ensure your care documentation meets all CQC requirements with this comprehensive checklist.",
      category: "Best Practices",
      readTime: "8 min read",
      featured: true
    },
    {
      title: "Staff Scheduling Masterclass",
      description: "Learn advanced scheduling techniques to optimize your team's efficiency.",
      category: "Video Tutorial",
      readTime: "15 min watch",
      featured: false
    },
    {
      title: "Care Plan Template Library",
      description: "Download professionally designed templates for various care scenarios.",
      category: "Templates",
      readTime: "5 min read",
      featured: false
    }
  ];

  const popularTopics = [
    "Care Plans", "Scheduling", "Compliance", "Reporting", "Mobile App", "Integrations"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero 
          badge="Learn & Grow"
          badgeIcon={BookOpen}
          title="Resources &"
          highlightedText="Learning Center"
          description="Everything you need to get the most out of Med-Infinite. Guides, tutorials, templates, and more."
        />

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search resources..." 
              className="pl-12 h-14 text-lg rounded-xl border-gray-200 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <span className="text-sm text-gray-500">Popular:</span>
            {popularTopics.map((topic, index) => (
              <button 
                key={index}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <category.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">{category.count}</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Featured Articles */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Resources</h2>
            <Button variant="ghost" className="text-blue-600">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredArticles.map((article, index) => (
              <div 
                key={index}
                className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    {article.category}
                  </span>
                  {article.featured && (
                    <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {article.readTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest resources, tips, and industry insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              placeholder="Enter your email" 
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
            />
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;