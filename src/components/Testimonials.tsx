
import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  
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

    if (testimonialsRef.current) {
      observer.observe(testimonialsRef.current);
    }

    return () => {
      if (testimonialsRef.current) {
        observer.unobserve(testimonialsRef.current);
      }
    };
  }, []);

  const testimonials = [
    {
      quote: "Med-Infinite has transformed how we manage patient care. The platform's intuitive design and comprehensive features have significantly improved our workflow efficiency.",
      author: "Dr. Sarah Johnson",
      position: "Chief Medical Officer",
      organization: "Pacific Health Network",
      rating: 5,
    },
    {
      quote: "As a caregiver, I've found Med-Infinite invaluable for coordinating care with healthcare providers and family members. It gives me peace of mind knowing everyone is on the same page.",
      author: "Michael Chen",
      position: "Family Caregiver",
      organization: "",
      rating: 5,
    },
    {
      quote: "The real-time monitoring capabilities have allowed us to catch potential issues before they become serious problems. This platform is saving lives.",
      author: "Dr. Robert Patel",
      position: "Cardiologist",
      organization: "Heartcare Specialists",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-med-700 mb-6">
            <span className="text-sm font-medium">Success Stories</span>
          </div>
          <h2 className="section-title">Trusted by Healthcare Professionals</h2>
          <p className="section-description">Hear from the healthcare professionals and caregivers who have experienced the difference Med-Infinite makes in their daily care management.</p>
        </div>

        <div 
          ref={testimonialsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-animation"
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card flex flex-col h-full">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <blockquote className="text-gray-700 flex-grow mb-6 italic">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="mt-auto">
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-sm text-gray-600">{testimonial.position}</div>
                {testimonial.organization && (
                  <div className="text-sm text-med-600">{testimonial.organization}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
