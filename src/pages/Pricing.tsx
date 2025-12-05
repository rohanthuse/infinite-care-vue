import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Check, X, Sparkles, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Pricing = () => {
  const plans = [
    { name: "Starter", icon: Sparkles, description: "Perfect for small care homes", price: "£99", features: [{ t: "Up to 25 clients", i: true }, { t: "Up to 10 staff", i: true }, { t: "Basic templates", i: true }, { t: "Email support", i: true }, { t: "Custom branding", i: false }], popular: false },
    { name: "Professional", icon: Crown, description: "For growing organizations", price: "£249", features: [{ t: "Up to 100 clients", i: true }, { t: "Up to 50 staff", i: true }, { t: "Advanced builder", i: true }, { t: "Priority support", i: true }, { t: "Custom branding", i: true }], popular: true },
    { name: "Enterprise", icon: Building2, description: "Custom solutions", price: "Custom", features: [{ t: "Unlimited clients", i: true }, { t: "Unlimited staff", i: true }, { t: "Custom workflows", i: true }, { t: "Dedicated manager", i: true }, { t: "Full API access", i: true }], popular: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Simple Pricing" badgeIcon={Sparkles} title="Plans That Grow" highlightedText="With You" description="Choose the perfect plan for your organization. All plans include a 14-day free trial." />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={cn("relative bg-white rounded-2xl p-8 shadow-sm border transition-all hover:shadow-xl", plan.popular ? "border-blue-500 ring-2 ring-blue-500/20 scale-105" : "border-gray-100")}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>}
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6"><plan.icon className="h-6 w-6 text-blue-600" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <div className="mb-8"><span className="text-4xl font-bold text-gray-900">{plan.price}</span>{plan.price !== "Custom" && <span className="text-gray-500">/month</span>}</div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {f.i ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-gray-300" />}
                    <span className={f.i ? "text-gray-700" : "text-gray-400"}>{f.t}</span>
                  </li>
                ))}
              </ul>
              <Button className={cn("w-full", plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800")}>Get Started</Button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;