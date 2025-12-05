import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">Last updated: December 1, 2024</p>
          
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-0">1. Information We Collect</h2>
            <p className="text-gray-600">
              We collect information you provide directly to us, including personal information such as your name, email address, and organization details when you register for an account or contact us.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
            <p className="text-gray-600">
              We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">3. Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect the security of your personal information. All data is encrypted in transit and at rest.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">4. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">5. Your Rights</h2>
            <p className="text-gray-600">
              You have the right to access, correct, or delete your personal information. You may also have the right to restrict or object to certain processing of your data.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">6. Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at privacy@med-infinite.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
