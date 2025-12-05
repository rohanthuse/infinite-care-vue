import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Handshake, Building, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const Partners = () => {
  const partnerTypes = [
    { icon: Building, title: "Technology Partners", description: "Integrate your solutions with Med-Infinite's platform to reach healthcare providers." },
    { icon: Handshake, title: "Implementation Partners", description: "Help healthcare organizations successfully deploy and adopt Med-Infinite." },
    { icon: Award, title: "Referral Partners", description: "Earn commissions by referring new customers to Med-Infinite." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Partner With Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our partner ecosystem and help transform healthcare together.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {partnerTypes.map((partner, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <partner.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{partner.title}</h3>
              <p className="text-gray-600 text-sm">{partner.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg">Become a Partner</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
