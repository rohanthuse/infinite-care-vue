import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "@/components/ui/CustomButton";
import { ArrowRight } from "lucide-react";

const CallToAction = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div 
          ref={ctaRef}
          className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 sm:px-16 md:py-20 lg:py-24 reveal-animation"
        >
          {/* Decorative elements */}
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/30 blur-3xl" aria-hidden="true"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/40 blur-3xl" aria-hidden="true"></div>
          
          <div className="relative flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Transform Your Care Management?
            </h2>
            <p className="mt-4 max-w-xl text-lg text-primary-foreground/80">
              Join thousands of healthcare professionals who are already elevating patient care with Med-Infinite.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <CustomButton 
                size="lg" 
                variant="pill" 
                className="bg-card text-primary hover:bg-accent"
                onClick={() => navigate('/login')}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </CustomButton>
              <CustomButton 
                size="lg" 
                variant="pill" 
                className="bg-primary/30 text-primary-foreground hover:bg-primary/50 backdrop-blur-sm border-primary-foreground/20"
                onClick={() => navigate('/demo-request')}
              >
                Request Demo
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
