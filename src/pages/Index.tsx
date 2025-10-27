import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { DevTenantSwitcher } from "@/components/system/DevTenantSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  // Hide initial loader after auth check completes or after 2 seconds max
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      setShowInitialLoader(false);
    }

    // Safety timeout - always hide loader after 2 seconds
    const timeout = setTimeout(() => {
      setShowInitialLoader(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [authLoading, roleLoading]);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    console.log('[Index] Auth state check:', { user: !!user, authLoading, roleLoading, userRole });
    
    if (authLoading || roleLoading) {
      console.log('[Index] Still loading, waiting...');
      return;
    }

    if (user && userRole) {
      console.log('[Index] User authenticated with role:', userRole.role, '- redirecting immediately');
      
      // Determine redirect path based on role and organization
      let redirectPath = '/dashboard'; // Default fallback
      
      if (userRole.role === 'super_admin' && userRole.organizationSlug) {
        redirectPath = `/${userRole.organizationSlug}/dashboard`;
      } else if (userRole.role === 'app_admin') {
        redirectPath = '/system-dashboard';
      } else if (userRole.organizationSlug) {
        // For other roles with organization context
        switch (userRole.role) {
          case 'branch_admin':
            redirectPath = `/${userRole.organizationSlug}/dashboard`;
            break;
          case 'carer':
            redirectPath = `/${userRole.organizationSlug}/carer-dashboard`;
            break;
          case 'client':
            redirectPath = `/${userRole.organizationSlug}/client-dashboard`;
            break;
          default:
            redirectPath = `/${userRole.organizationSlug}/dashboard`;
        }
      }
      
      console.log('[Index] Redirecting authenticated user to:', redirectPath);
      window.location.href = redirectPath;
      return;
    } else if (user && !userRole) {
      console.log('[Index] User authenticated but no role found - redirecting to login');
      navigate('/login', { replace: true });
    } else {
      console.log('[Index] User not authenticated, showing landing page');
    }
  }, [user, userRole, authLoading, roleLoading, navigate]);

  useEffect(() => {
    // Intersection Observer for animations
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    });

    document.querySelectorAll('.reveal-animation').forEach(el => {
      observer.observe(el);
    });

    // Add parallax scroll effect for hero section
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const heroElements = document.querySelectorAll('.parallax');
      
      heroElements.forEach((element) => {
        const el = element as HTMLElement;
        const speed = el.dataset.speed || "0.1";
        const yPos = -(scrollPosition * parseFloat(speed));
        el.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <main className="home-page-light bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50 min-h-screen">
      {/* Initial Loading Overlay - Only shows for first 2 seconds max */}
      {showInitialLoader && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Loading Med-Infinite...</p>
          </div>
        </div>
      )}

      <div className="absolute top-0 right-0 w-full h-screen pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/20 to-transparent -translate-y-1/3 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-100/20 to-transparent translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
      </div>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load navigation</div>}>
        <Navbar />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load hero section</div>}>
        <Hero />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load features</div>}>
        <Features />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load testimonials</div>}>
        <Testimonials />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load call to action</div>}>
        <CallToAction />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={<div className="p-8 text-center">Failed to load footer</div>}>
        <Footer />
      </ErrorBoundary>
      
      {/* Development Tools - Only visible on localhost */}
      {window.location.hostname === 'localhost' && (
        <div className="fixed bottom-4 right-4 z-50">
          <DevTenantSwitcher />
        </div>
      )}
    </main>
  );
};

export default Index;
