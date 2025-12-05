import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Shield, Calendar } from "lucide-react";

const PrivacyPolicy = () => {
  const sections = [
    { title: "Information We Collect", content: "We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes personal identification information, organization details, care recipient data, and usage analytics." },
    { title: "How We Use Your Information", content: "We use the information to provide and improve our services, process transactions, send technical notices and support messages, and ensure compliance with healthcare regulations." },
    { title: "Data Security", content: "We implement industry-standard security measures including end-to-end encryption, regular security audits, SOC 2 Type II certification, and GDPR compliance." },
    { title: "Data Sharing", content: "We do not sell your personal information. We may share information with service providers, to comply with legal obligations, or with your consent." },
    { title: "Your Rights", content: "Under GDPR and UK data protection laws, you have the right to access, correct, delete, object to processing, and request portability of your personal data." },
    { title: "Contact Us", content: "For questions about this privacy policy: privacy@med-infinite.com or 0800 123 4567. You may also lodge a complaint with the ICO." }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <PageHero badge="Legal" badgeIcon={Shield} title="Privacy" highlightedText="Policy" description="Your privacy is important to us. This policy explains how we collect, use, and protect your information." />
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

export default PrivacyPolicy;