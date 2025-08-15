
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Home, ArrowLeft, FileX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-blue-50 p-4">
      <div className="w-full max-w-4xl px-6 py-12 rounded-2xl bg-white shadow-soft flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        {/* Abstract gradient background blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
        
        {/* Left column - Illustration and brand */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start relative z-10">
          <div className="flex items-center space-x-2 mb-8">
            <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-6 w-6" />
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent text-xl font-bold">
                MED-INFINITE
              </span>
              <span className="text-xs text-gray-500 -mt-1">ENDLESS CARE</span>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* 404 Illustration */}
            <div className="w-full max-w-sm h-64 flex items-center justify-center bg-blue-50 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
              
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative"
              >
                {/* Document illustration */}
                <div className="relative">
                  <div className="w-40 h-48 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 w-full h-8 bg-blue-600"></div>
                    <FileX size={64} className="text-blue-600 mt-4" />
                    <div className="mt-4 px-4">
                      <div className="h-2 w-24 bg-gray-200 rounded-full mb-2"></div>
                      <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Animated circles */}
                  <motion.div 
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500"
                    animate={{ 
                      y: [0, -5, 0], 
                      x: [0, 3, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      repeatType: "reverse"
                    }}
                  />
                  <motion.div 
                    className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-blue-600"
                    animate={{ 
                      y: [0, 5, 0], 
                      x: [0, -3, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.5,
                      repeatType: "reverse"
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Right column - Error content */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-7xl md:text-8xl font-bold text-blue-600 mb-4">404</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on track.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button
              onClick={goBack}
              variant="outline"
              className="flex items-center gap-2 border-blue-300 hover:bg-blue-50"
            >
              <ArrowLeft size={18} />
              Go Back
            </Button>
            <Button
              onClick={goHome}
              className="flex items-center gap-2"
            >
              <Home size={18} />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <p className="mt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Med-Infinite. All rights reserved.
      </p>
    </div>
  );
};

export default NotFound;
