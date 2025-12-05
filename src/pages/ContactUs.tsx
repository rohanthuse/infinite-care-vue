import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactUs = () => {
  const contactInfo = [
    { icon: Mail, title: "Email Us", value: "hello@med-infinite.com", desc: "We'll respond within 24 hours" },
    { icon: Phone, title: "Call Us", value: "0800 123 4567", desc: "Mon-Fri 9am-6pm GMT" },
    { icon: MapPin, title: "Visit Us", value: "London, UK", desc: "By appointment only" },
    { icon: Clock, title: "Support Hours", value: "24/7 Emergency", desc: "For critical issues" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Get in Touch" badgeIcon={MessageSquare} title="Contact" highlightedText="Our Team" description="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible." />

        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">First Name</label><Input placeholder="John" className="h-12" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label><Input placeholder="Smith" className="h-12" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><Input type="email" placeholder="john@company.com" className="h-12" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Subject</label><Input placeholder="How can we help?" className="h-12" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Message</label><Textarea placeholder="Tell us more..." rows={5} /></div>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg">Send Message <Send className="ml-2 h-5 w-5" /></Button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><c.icon className="h-6 w-6 text-blue-600" /></div>
                  <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-blue-600 font-medium mb-1">{c.value}</p>
                  <p className="text-gray-500 text-sm">{c.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-center"><MapPin className="h-12 w-12 text-blue-400 mx-auto mb-2" /><p className="text-gray-600">Map Integration</p></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;