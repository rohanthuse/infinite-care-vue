
import { useEffect, useRef } from "react";
import { 
  Shield, Calendar, UserCheck, MessageSquare, 
  Activity, Heart, ListChecks, Globe
} from "lucide-react";

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  const features = [
    {
      title: "Comprehensive Care Plans",
      description: "Create personalized care plans that adapt to changing patient needs with built-in intelligence.",
      icon: <Heart className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Intelligent Scheduling",
      description: "Automate appointment scheduling and resource allocation with AI-powered optimization.",
      icon: <Calendar className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Verified Providers",
      description: "Connect with certified healthcare providers and specialists through our verified network.",
      icon: <UserCheck className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Secure Communication",
      description: "Maintain HIPAA-compliant communications between patients, providers, and caregivers.",
      icon: <MessageSquare className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Health Monitoring",
      description: "Track vital signs and health metrics with real-time alerts and comprehensive dashboards.",
      icon: <Activity className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Task Management",
      description: "Organize and assign care tasks with automated reminders and completion tracking.",
      icon: <ListChecks className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Data Security",
      description: "Enterprise-grade security and privacy controls protect sensitive health information.",
      icon: <Shield className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
    {
      title: "Global Accessibility",
      description: "Access your care information from anywhere with our cloud-based platform.",
      icon: <Globe className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-lg" />,
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 mb-6">
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="section-title">Comprehensive Care Management Tools</h2>
          <p className="section-description">Our platform offers a suite of powerful features designed to streamline care coordination, enhance communication, and improve patient outcomes.</p>
        </div>

        <div 
          ref={featuresRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 stagger-animation"
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card hover:translate-y-[-5px]"
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
