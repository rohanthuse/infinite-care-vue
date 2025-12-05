import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
      <Navbar />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">Last updated: December 1, 2024</p>
          
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 prose prose-gray max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-0">1. Acceptance of Terms</h2>
            <p className="text-gray-600">
              By accessing or using Med-Infinite's services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">2. Use License</h2>
            <p className="text-gray-600">
              Permission is granted to temporarily access and use Med-Infinite's services for personal or business purposes in accordance with your subscription plan.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">3. User Responsibilities</h2>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">4. Service Availability</h2>
            <p className="text-gray-600">
              We strive to maintain 99.9% uptime for our services. However, we reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">5. Limitation of Liability</h2>
            <p className="text-gray-600">
              Med-Infinite shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">6. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900">7. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
