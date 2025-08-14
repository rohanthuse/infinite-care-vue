import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "@/components/ui/CustomButton";
import { ArrowRight, Shield, BarChart3, Users, Play, CheckCircle, Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");

  // Available organizations (subset of main ones for demo)
  const organizations = [
    { slug: "care", name: "Care Services" },
    { slug: "lala", name: "Lala Healthcare" },
    { slug: "demo", name: "Demo Care Services" },
    { slug: "purecare", name: "Purecare" },
    { slug: "audi", name: "Audi Health" }
  ];

  const handleOrganizationLogin = () => {
    if (selectedOrganization) {
      navigate(`/${selectedOrganization}/login`);
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);
  return <section id="hero" className="relative py-12 md:py-16 lg:py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-100/60 to-blue-300/20 top-[-100px] right-[-200px] blur-3xl parallax" data-speed="0.05" aria-hidden="true"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-100/40 to-blue-200/30 bottom-[-200px] left-[-200px] blur-3xl parallax" data-speed="0.1" aria-hidden="true"></div>
      
      <div className="container mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div ref={heroRef} className="stagger-animation lg:col-span-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 mb-6 shadow-sm">
              <span className="flex items-center text-sm font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                Revolutionizing Healthcare Technology
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6 tracking-tight text-gray-900">
              Simplify Patient Care with <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Med-Infinite</span>
                <span className="absolute -bottom-2 left-0 w-full h-3 bg-blue-100/60 rounded-sm -z-10 skew-x-3"></span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Our intelligent platform seamlessly connects healthcare providers, patients, and caregivers to deliver better outcomes with less administrative burden.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <CustomButton size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0 shadow-lg shadow-blue-500/20">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </CustomButton>
              
              <CustomButton variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50">
                <Play className="mr-2 h-4 w-4 fill-blue-500" /> Watch Demo
              </CustomButton>
            </div>

            {/* Organization Login Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Organization Login</h3>
              </div>
              <p className="text-gray-600 mb-4">Select your organization to access your dashboard</p>
              <div className="space-y-4">
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.slug} value={org.slug}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedOrganization && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CustomButton 
                      onClick={() => navigate(`/${selectedOrganization}/login`)}
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      Admin Login
                    </CustomButton>
                    <CustomButton 
                      onClick={() => navigate(`/${selectedOrganization}/carer-login`)}
                      variant="outline"
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Carer Login
                    </CustomButton>
                    <CustomButton 
                      onClick={() => navigate(`/${selectedOrganization}/client-login`)}
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      Client Login
                    </CustomButton>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-900">100% Secure</span>
                </div>
                <p className="text-xs text-gray-500 pl-11">HIPAA compliant & encrypted data</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-900">Real-time Data</span>
                </div>
                <p className="text-xs text-gray-500 pl-11">Instant insights & analytics</p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-100 to-blue-200 text-blue-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-gray-900">12k+ Providers</span>
                </div>
                <p className="text-xs text-gray-500 pl-11">Trust our platform globally</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[90%] h-[90%] bg-gradient-to-tr from-blue-400/10 to-cyan-300/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative">
              {/* Main Dashboard Display */}
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl bg-white p-2 rotate-1 transform hover:rotate-0 transition-all duration-500">
                <img alt="Med-Infinite Dashboard" className="w-full h-full object-cover rounded-xl" loading="lazy" src="/lovable-uploads/d1823018-dfc1-41a0-8401-0b9de4112292.jpg" />
                
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-100 max-w-[220px]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Weekly Report</h4>
                    <span className="text-xs text-green-600 font-medium">+24%</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-gray-600">Care plans completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-gray-600">Staff productivity</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute top-[-30px] right-[10%] z-30 animate-float">
                <div className="bg-white rounded-xl shadow-md p-3 max-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-lg font-bold">+</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">New Patient</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="text-xs text-gray-500">Added successfully</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-[10px] left-[5%] z-30 animate-float" style={{
              animationDelay: '1.5s'
            }}>
                <div className="bg-white rounded-xl shadow-md p-3 max-w-[180px] -rotate-3">
                  <div className="flex items-center mb-2">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full w-[75%]"></div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-900">Treatment progress: 75%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trusted by Section - Modern Look */}
      <div className="w-full py-12 mt-8 bg-white/50 backdrop-blur-sm border-y border-gray-100">
        <div className="container mx-auto px-5 lg:px-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-px w-16 bg-gray-200 mb-6"></div>
            <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-wider">Trusted by Leading Healthcare Organizations</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center">
            {['Mayo Clinic', 'Cleveland Clinic', 'Johns Hopkins', 'Mount Sinai', 'UC Health'].map((brand, index) => <div key={index} className="text-gray-400 font-semibold tracking-tight text-lg md:text-xl flex items-center justify-center h-12">
                {brand}
              </div>)}
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;