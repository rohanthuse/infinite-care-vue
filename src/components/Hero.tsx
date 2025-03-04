
import { useEffect, useRef } from "react";
import { CustomButton } from "@/components/ui/CustomButton";
import { ArrowRight, ShieldCheck, BarChart3, Users } from "lucide-react";

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
    <section id="hero" className="relative pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-hero-gradient -z-10" aria-hidden="true"></div>
      <div className="hero-shape w-[500px] h-[500px] bg-med-200/50 top-[-100px] right-[-200px]" aria-hidden="true"></div>
      <div className="hero-shape w-[600px] h-[600px] bg-med-100/50 bottom-[-200px] left-[-200px]" aria-hidden="true"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref={heroRef} className="stagger-animation max-w-2xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-med-100 border border-med-200 text-med-700 mb-6">
              <span className="flex items-center text-sm font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-med-500 mr-2 animate-pulse"></span>
                Transforming Healthcare Management
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
              Elevate Patient Care with <span className="gradient-text">Med-Infinite</span>'s Modern Platform
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              A comprehensive solution that connects patients, providers, and caregivers in one intelligent platform, leading to better health outcomes and more efficient care delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <CustomButton size="lg" className="bg-med-500 hover:bg-med-600 shadow-xl shadow-med-500/20">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </CustomButton>
              
              <CustomButton variant="outline" size="lg" className="border-med-200 text-med-700 hover:bg-med-50">
                Watch Demo
              </CustomButton>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-med-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-med-100 text-med-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900">HIPAA Compliant</span>
                  <span className="text-xs text-gray-500">Secure & Protected</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-med-100 text-med-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900">99.9% Uptime</span>
                  <span className="text-xs text-gray-500">Always Available</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-med-100 text-med-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-900">10,000+ Providers</span>
                  <span className="text-xs text-gray-500">Trust Med-Infinite</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative lg:pl-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-[80%] max-h-[80%] bg-gradient-to-tr from-med-500/20 to-med-300/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative">
              {/* Main Platform Mockup */}
              <div className="relative z-20 rounded-2xl overflow-hidden shadow-modern bg-white p-1">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                  alt="Med-Infinite Dashboard" 
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute top-[-40px] right-[-20px] z-30 animate-float">
                <div className="bg-white rounded-xl shadow-medium p-3 max-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-med-100 flex items-center justify-center">
                      <span className="text-med-500 text-lg font-bold">+</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Patient Added</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="text-xs text-gray-500">Just now</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-[-30px] left-[20px] z-30 animate-float" style={{ animationDelay: '1s' }}>
                <div className="bg-white rounded-xl shadow-medium p-3 max-w-[180px]">
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-med-500 h-2 rounded-full w-[75%]"></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-900">Care plan progress: 75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Brands Ticker/Trust Signals */}
      <div className="w-full py-10 bg-white/50 backdrop-blur-sm border-y border-gray-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium text-gray-500 mb-6">TRUSTED BY LEADING HEALTHCARE ORGANIZATIONS</p>
          <div className="flex justify-around items-center flex-wrap gap-8">
            {['Mayo Clinic', 'Cleveland Clinic', 'Johns Hopkins', 'Mount Sinai', 'UC Health'].map((brand, index) => (
              <div key={index} className="text-gray-400 font-semibold text-lg">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
