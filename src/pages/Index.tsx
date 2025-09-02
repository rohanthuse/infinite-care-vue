
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/UnifiedAuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingScreen } from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { DevTenantSwitcher } from "@/components/system/DevTenantSwitcher";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  // Handle authenticated user redirects
  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (user && userRole) {
      console.log('[Index] Authenticated user detected:', userRole.role);
      
      // Redirect authenticated users to appropriate dashboard
      if (userRole.role === 'super_admin') {
        console.log('[Index] Redirecting super admin to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (userRole.role === 'branch_admin') {
        console.log('[Index] Redirecting branch admin to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (userRole.role === 'carer') {
        console.log('[Index] Redirecting carer to carer dashboard');
        // Get tenant slug if available
        const tenantSlug = localStorage.getItem('dev-tenant') || 'demo';
        navigate(`/${tenantSlug}/carer-dashboard`, { replace: true });
      } else if (userRole.role === 'client') {
        console.log('[Index] Redirecting client to client dashboard');
        // Get tenant slug if available
        const tenantSlug = localStorage.getItem('dev-tenant') || 'demo';
        navigate(`/${tenantSlug}/client-dashboard`, { replace: true });
      }
    }
  }, [user, userRole, authLoading, roleLoading, navigate]);

  // Show loading screen while checking authentication
  if (authLoading || (user && roleLoading)) {
    return <LoadingScreen />;
  }

  // Only show landing page for unauthenticated users
  if (user && userRole) {
    return <LoadingScreen />; // This should not be reached due to redirect above
  }
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
      <div className="absolute top-0 right-0 w-full h-screen pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/20 to-transparent -translate-y
        -1/3 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-100/20 to-transparent translate-y-1/2 -translate-x-1/3 blur-3xl"></div>
      </div>
      
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <CallToAction />
      <Footer />
      
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
