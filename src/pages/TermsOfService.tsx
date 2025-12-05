import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { FileText, Calendar } from "lucide-react";

const TermsOfService = () => {
  const sections = [
    { title: "Acceptance of Terms", content: "By accessing or using Med-Infinite's services, you agree to be bound by these Terms of Service and all applicable laws and regulations." },
    { title: "Description of Service", content: "Med-Infinite provides a cloud-based care management platform including care plan management, staff scheduling, documentation tools, reporting, and mobile applications." },
    { title: "User Accounts", content: "You must provide accurate registration information, maintain the security of your credentials, and accept responsibility for all activities under your account." },
    { title: "Acceptable Use", content: "You agree not to use the service for unlawful purposes, violate healthcare regulations, upload malicious code, or interfere with the service's operation." },
    { title: "Payment Terms", content: "Subscriptions are billed in advance. Prices may change with 30 days notice. Late payments may result in service suspension. All fees exclude VAT unless stated." },
    { title: "Limitation of Liability", content: "Our liability is limited to the amount paid in the 12 months preceding any claim. We are not liable for indirect, incidental, or consequential damages." },
    { title: "Termination", content: "Either party may terminate with 30 days written notice. Upon termination, you may export your data within 30 days." },
    { title: "Governing Law", content: "These terms are governed by the laws of England and Wales. Contact: legal@med-infinite.com" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Legal" badgeIcon={FileText} title="Terms of" highlightedText="Service" description="Please read these terms carefully before using Med-Infinite's services." />
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-12"><Calendar className="h-5 w-5" /><span>Last updated: December 1, 2024</span></div>

        <div className="max-w-3xl mx-auto space-y-6">
          {sections.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;