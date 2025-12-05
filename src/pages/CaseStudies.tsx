import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Trophy, TrendingUp, Clock, Users, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const CaseStudies = () => {
  const studies = [
    { company: "Sunrise Care Homes", industry: "Residential Care", logo: "SC", color: "from-orange-500 to-amber-500", results: [{ m: "45%", l: "Admin reduction" }, { m: "99%", l: "Accuracy" }], quote: "Med-Infinite transformed how we deliver care.", author: "Sarah J., Operations Director" },
    { company: "HomeFirst Services", industry: "Domiciliary Care", logo: "HF", color: "from-blue-500 to-cyan-500", results: [{ m: "60%", l: "Fewer missed visits" }, { m: "95%", l: "Staff satisfaction" }], quote: "The mobile app has been a game-changer for our field staff.", author: "Michael C., MD" },
    { company: "NHS Trust Partnership", industry: "Healthcare Integration", logo: "NHS", color: "from-emerald-500 to-teal-500", results: [{ m: "40%", l: "Faster discharge" }, { m: "£2M", l: "Annual savings" }], quote: "Seamless integration with NHS systems improved continuity of care.", author: "Dr. Emma W., Clinical Director" },
  ];

  const stats = [
    { icon: TrendingUp, value: "40%", label: "Efficiency Gain" },
    { icon: Clock, value: "2hrs", label: "Saved Daily" },
    { icon: Users, value: "50k+", label: "Care Recipients" },
    { icon: Trophy, value: "98%", label: "Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Success Stories" badgeIcon={Trophy} title="Real Results from" highlightedText="Real Organizations" description="See how healthcare providers are transforming their operations with Med-Infinite." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4"><s.icon className="h-6 w-6 text-blue-600" /></div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-gray-600 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
        
        <div className="space-y-8 mb-20">
          {studies.map((study, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${study.color} rounded-xl flex items-center justify-center text-white font-bold`}>{study.logo}</div>
                    <div><h3 className="text-xl font-bold text-gray-900">{study.company}</h3><span className="text-sm text-gray-500">{study.industry}</span></div>
                  </div>
                  <Button variant="outline" className="group">Read Full Case Study <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button>
                </div>
                <div className="bg-gray-50 p-8 md:p-12">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {study.results.map((r, i) => (<div key={i} className="text-center"><div className="text-2xl font-bold text-blue-600">{r.m}</div><div className="text-xs text-gray-600">{r.l}</div></div>))}
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <Quote className="h-6 w-6 text-blue-200 mb-2" />
                    <p className="text-gray-700 italic text-sm mb-2">{study.quote}</p>
                    <div className="text-sm font-medium text-gray-900">{study.author}</div>
                  </div>
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

export default CaseStudies;