
import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Family Member",
    image: "/lovable-uploads/5b9a76b7-b6ff-4f96-ad2f-53a109a095be.png",
    rating: 5,
    text: "The care team has been absolutely wonderful. The admin staff are so professional and the carers are compassionate and skilled. My mother feels safe and well-cared for."
  },
  {
    name: "John Thompson", 
    role: "Client",
    image: "/lovable-uploads/34823937-36c3-4d58-89bb-a99c71fb4dbf.png",
    rating: 5,
    text: "I can't recommend this care service enough. The carers are not just professional, but they truly care about my wellbeing. The quality of care is exceptional."
  },
  {
    name: "Emma Williams",
    role: "Family Member", 
    image: "/lovable-uploads/076f5fb6-baae-45cf-9e2e-eebfb48dcd7e.png",
    rating: 5,
    text: "Outstanding care coordination and management. The admin team keeps everything organized while the carers provide excellent hands-on support. Highly professional service."
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our clients and their families have to say about our care services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-700 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
