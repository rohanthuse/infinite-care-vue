import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { 
  Sparkles, Shield, Clock, Users, BarChart3, Zap, 
  CheckCircle2, ArrowRight, Heart, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Features = () => {
  const mainFeatures = [
    { icon: Heart, title: "Care Plan Management", description: "Create comprehensive, personalized care plans that adapt to each client's unique needs.", color: "from-rose-500 to-pink-500" },
    { icon: Users, title: "Staff Scheduling", description: "Intelligent scheduling system that matches the right carers with the right clients.", color: "from-blue-500 to-cyan-500" },
    { icon: FileText, title: "Digital Documentation", description: "Paperless documentation with real-time updates, ensuring accurate records.", color: "from-emerald-500 to-teal-500" },
    { icon: BarChart3, title: "Analytics & Reporting", description: "Powerful insights and reports to help you make data-driven decisions.", color: "from-violet-500 to-purple-500" },
    { icon: Shield, title: "Compliance & Security", description: "Built-in compliance tools and enterprise-grade security to protect data.", color: "from-amber-500 to-orange-500" },
    { icon: Zap, title: "Real-time Updates", description: "Instant notifications and live updates keep everyone informed.", color: "from-cyan-500 to-blue-500" },
  ];

  const stats = [
    { value: "40%", label: "Time Saved" },
    { value: "99.9%", label: "Uptime" },
    { value: "12k+", label: "Care Plans" },
    { value: "500+", label: "Organizations" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Platform Features" badgeIcon={Sparkles} title="Everything You Need for" highlightedText="Better Care" description="Discover the powerful features that make Med-Infinite the leading choice for healthcare management." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <div key={index} className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Features;