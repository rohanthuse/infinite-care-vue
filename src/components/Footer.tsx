
import { Heart } from "lucide-react";

const Footer = () => {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { text: "Features", href: "#features" },
        { text: "Pricing", href: "#" },
        { text: "Case Studies", href: "#" },
        { text: "Resources", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About Us", href: "#" },
        { text: "Careers", href: "#" },
        { text: "News", href: "#" },
        { text: "Partners", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { text: "Help Center", href: "#" },
        { text: "Contact Us", href: "#" },
        { text: "Privacy Policy", href: "#" },
        { text: "Terms of Service", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Logo and description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 text-2xl font-semibold mb-4">
              <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-7 w-7" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Med-Infinite
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Empowering healthcare providers and caregivers with innovative solutions for better patient outcomes and streamlined care management.
            </p>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Med-Infinite. All rights reserved.
            </div>
          </div>

          {/* Footer links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
