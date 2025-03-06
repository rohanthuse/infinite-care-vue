
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Home, ArrowLeft } from "lucide-react";

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
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-med-200 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
        
        {/* Left column - Image and brand */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start relative z-10">
          <div className="flex items-center space-x-2 mb-8">
            <Heart className="text-med-500 h-6 w-6" />
            <span className="bg-gradient-to-r from-med-500 to-med-700 bg-clip-text text-transparent text-2xl font-semibold">
              Med-Infinite
            </span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img 
              src="https://images.unsplash.com/photo-1470813740244-df37b8c1edcb" 
              alt="404 Illustration" 
              className="w-full max-w-sm rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg flex items-end">
              <div className="p-4 text-white">
                <p className="text-sm font-medium">Looking for something?</p>
              </div>
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
            <h1 className="text-7xl md:text-8xl font-bold text-med-500 mb-4">404</h1>
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
              className="flex items-center gap-2 border-med-300 hover:bg-med-50"
            >
              <ArrowLeft size={18} />
              Go Back
            </Button>
            <Button
              onClick={goHome}
              className="flex items-center gap-2 bg-med-500 hover:bg-med-600"
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
