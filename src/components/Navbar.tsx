
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CustomButton } from "@/components/ui/CustomButton";
import { Heart, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleSignIn = () => {
    navigate("/login");
  };
  
  const navItems = [
    { text: "Home", href: "#hero" },
    { text: "Features", href: "#features" },
    { text: "Testimonials", href: "#testimonials" },
    { text: "Contact", href: "#contact" }
  ];
  
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4", 
      isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center space-x-2 text-2xl font-semibold">
          <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-8 w-8" />
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent text-xl font-bold">
              MED-INFINITE
            </span>
            <span className="text-xs text-gray-500 -mt-1">ENDLESS CARE</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href={item.href} 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              {item.text}
            </a>
          ))}
        </nav>

        {/* Call to Action Buttons */}
        <div className="hidden md:flex items-center">
          <CustomButton 
            variant="pill" 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSignIn}
          >
            Sign In to Your Account
          </CustomButton>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700 focus:outline-none" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-white z-40 pt-20 transition-transform duration-300 ease-in-out-cubic md:hidden", 
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="container mx-auto px-4 flex flex-col space-y-6 py-6">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href={item.href} 
              className="text-xl font-medium text-gray-800 hover:text-blue-600 py-2 border-b border-gray-100" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.text}
            </a>
          ))}
          <div className="pt-4">
            <CustomButton 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleSignIn();
              }}
            >
              Sign In to Your Account
            </CustomButton>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
