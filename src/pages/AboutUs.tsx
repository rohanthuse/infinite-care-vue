import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, Target, Users } from "lucide-react";

const AboutUs = () => {
  const values = [
    { icon: Heart, title: "Care First", description: "We put patients and caregivers at the heart of everything we build." },
    { icon: Target, title: "Innovation", description: "Continuously improving healthcare through cutting-edge technology." },
    { icon: Users, title: "Partnership", description: "Working alongside care providers to understand and solve real challenges." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About Med-Infinite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're on a mission to transform healthcare management through innovative technology solutions.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 2020, Med-Infinite was born from a simple observation: healthcare providers spend too much time on administration and not enough time on what matters most – caring for patients.
            </p>
            <p className="text-gray-600">
              Our team of healthcare professionals and technologists came together to build a platform that streamlines care management, improves communication, and ultimately delivers better outcomes for everyone involved.
            </p>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
