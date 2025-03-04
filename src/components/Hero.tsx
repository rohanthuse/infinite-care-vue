
import { useEffect, useRef } from "react";
import { CustomButton } from "@/components/ui/CustomButton";
import { ArrowRight, Shield, Hospital, Activity } from "lucide-react";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-radial from-white/60 to-transparent opacity-70"></div>
      </div>
      
      {/* Floating shapes */}
      <div className="absolute -top-10 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10" aria-hidden="true"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl -z-10" aria-hidden="true"></div>
      
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div ref={heroRef} className="stagger-animation">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-med-700 mb-6">
              <span className="text-sm font-medium">Reinventing Care Management</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6 tracking-tight">
              Elevate Patient Care with <span className="bg-gradient-to-r from-med-500 to-med-700 bg-clip-text text-transparent">Med-Infinite</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
              A comprehensive platform that seamlessly connects patients, providers, and caregivers for better health outcomes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <CustomButton size="lg" className="bg-med-600 hover:bg-med-700">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </CustomButton>
              
              <CustomButton variant="outline" size="lg">
                Book a Demo
              </CustomButton>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-med-600" />
                <span className="text-sm text-gray-700">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Hospital className="h-5 w-5 text-med-600" />
                <span className="text-sm text-gray-700">Provider Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-med-600" />
                <span className="text-sm text-gray-700">Real-time Monitoring</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-med-100 to-med-300 rounded-xl blur-lg opacity-70 animate-pulse-gentle" aria-hidden="true"></div>
            <div className="relative bg-white rounded-xl shadow-soft overflow-hidden border border-gray-100 transform transition-all duration-500 animate-fade-in">
              <div className="aspect-video w-full bg-gradient-to-tr from-gray-50 to-white p-6 sm:p-10">
                <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-100 backdrop-blur glass overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                    alt="Med-Infinite Platform Interface" 
                    className="w-full h-full object-cover opacity-95"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
