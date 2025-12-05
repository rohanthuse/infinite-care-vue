import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Handshake, Building, Award, Users, ArrowRight, CheckCircle2, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Partners = () => {
  const partnerTypes = [
    { 
      icon: Building, 
      title: "Technology Partners", 
      description: "Integrate your solutions with Med-Infinite's platform to reach healthcare providers and enhance care delivery.",
      benefits: ["API access", "Co-marketing opportunities", "Technical support", "Partner portal"],
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Users, 
      title: "Implementation Partners", 
      description: "Help healthcare organizations successfully deploy, configure, and adopt Med-Infinite solutions.",
      benefits: ["Training & certification", "Lead referrals", "Implementation tools", "Dedicated support"],
      color: "from-emerald-500 to-teal-500"
    },
    { 
      icon: Award, 
      title: "Referral Partners", 
      description: "Earn competitive commissions by referring new customers to Med-Infinite. Simple and rewarding.",
      benefits: ["Competitive commissions", "Marketing materials", "Deal registration", "Partner dashboard"],
      color: "from-purple-500 to-pink-500"
    },
  ];

  const whyPartner = [
    { icon: Globe, title: "Growing Market", description: "Access the rapidly expanding digital healthcare market" },
    { icon: Zap, title: "Easy Integration", description: "Simple APIs and comprehensive documentation" },
    { icon: Users, title: "Dedicated Support", description: "Partner success team to help you grow" },
    { icon: Award, title: "Recognition", description: "Joint marketing and co-branding opportunities" },
  ];

  const partnerLogos = [
    "NHS Digital", "CQC", "Skills for Care", "UKHCA", "Care England", "Digital Social Care"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero 
          badge="Partner Program"
          badgeIcon={Handshake}
          title="Partner With"
          highlightedText="Med-Infinite"
          description="Join our partner ecosystem and help transform healthcare together. Grow your business while making a difference."
        />
        
        {/* Partner Types */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {partnerTypes.map((partner, index) => (
            <div key={index} className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all">
              <div className={`w-14 h-14 bg-gradient-to-br ${partner.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <partner.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{partner.title}</h3>
              <p className="text-gray-600 mb-6">{partner.description}</p>
              
              <ul className="space-y-3 mb-6">
                {partner.benefits.map((benefit, bIndex) => (
                  <li key={bIndex} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              
              <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-200">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Why Partner */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Partner With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyPartner.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trusted By */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Trusted By Industry Leaders</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {partnerLogos.map((logo, index) => (
              <div 
                key={index}
                className="px-8 py-4 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-600 font-medium hover:shadow-md transition-shadow"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 text-center text-white">
          <Handshake className="h-12 w-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Ready to Become a Partner?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our growing partner ecosystem and start making a difference in healthcare today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Contact Partner Team
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;