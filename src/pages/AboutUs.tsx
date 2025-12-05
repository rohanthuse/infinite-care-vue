import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Heart, Target, Users, Lightbulb, Award, Globe, CheckCircle2 } from "lucide-react";

const AboutUs = () => {
  const values = [
    { icon: Heart, title: "Care First", description: "We put patients and caregivers at the heart of everything we build.", color: "from-rose-500 to-pink-500" },
    { icon: Target, title: "Innovation", description: "Continuously improving healthcare through cutting-edge technology.", color: "from-blue-500 to-cyan-500" },
    { icon: Users, title: "Partnership", description: "Working alongside care providers to understand and solve real challenges.", color: "from-emerald-500 to-teal-500" },
    { icon: Lightbulb, title: "Simplicity", description: "Making complex healthcare management intuitive and accessible.", color: "from-amber-500 to-orange-500" },
  ];

  const milestones = [
    { year: "2020", title: "Founded", description: "Med-Infinite was born from a vision to transform healthcare management." },
    { year: "2021", title: "First 100 Clients", description: "Reached our first major milestone with care homes across the UK." },
    { year: "2022", title: "NHS Partnership", description: "Established official partnership with NHS Digital for seamless integration." },
    { year: "2023", title: "Series A Funding", description: "Raised £5M to accelerate product development and expansion." },
    { year: "2024", title: "50,000+ Care Recipients", description: "Now serving organizations caring for over 50,000 individuals." },
  ];

  const stats = [
    { value: "500+", label: "Organizations" },
    { value: "50,000+", label: "Care Recipients" },
    { value: "10,000+", label: "Care Workers" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero 
          badge="Our Story"
          badgeIcon={Heart}
          title="About"
          highlightedText="Med-Infinite"
          description="We're on a mission to transform healthcare management through innovative technology solutions that put people first."
        />

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded in 2020, Med-Infinite was born from a simple observation: healthcare providers spend 
                too much time on administration and not enough time on what matters most – caring for patients.
              </p>
              <p>
                Our team of healthcare professionals and technologists came together to build a platform that 
                streamlines care management, improves communication, and ultimately delivers better outcomes 
                for everyone involved.
              </p>
              <p>
                Today, we're proud to serve hundreds of healthcare organizations across the UK, helping them 
                deliver exceptional care while reducing administrative burden and improving efficiency.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
        
        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <value.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Journey</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-cyan-500" />
              
              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-20 pb-12 last:pb-0">
                  <div className="absolute left-5 w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow" />
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <span className="text-blue-600 font-bold">{milestone.year}</span>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">{milestone.title}</h3>
                    <p className="text-gray-600 text-sm mt-2">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-12 text-white text-center">
          <Globe className="h-12 w-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            To empower healthcare providers with technology that simplifies care management, 
            improves outcomes, and gives caregivers more time to do what they do best – care.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;