
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import { DevTenantSwitcher } from "@/components/system/DevTenantSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  // CRITICAL: Check navigation intent BEFORE any hooks are called
  const isNavigating = sessionStorage.getItem('navigating_to_dashboard') === 'true';
  const targetDashboard = sessionStorage.getItem('target_dashboard');
  
  // If navigating, return loading immediately - don't execute ANY other code
  if (isNavigating && targetDashboard) {
    // Safety: Clear flags after 3 seconds to prevent infinite loading
    setTimeout(() => {
      sessionStorage.removeItem('navigating_to_dashboard');
      sessionStorage.removeItem('target_dashboard');
    }, 3000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-blue-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Only if NOT navigating, initialize hooks and render full page
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading, error: roleError } = useUserRole();
  const hasRedirected = useRef(false);

  // PHASE 2 & 7: Background redirect with protection against double redirects
  useEffect(() => {
    // PHASE 7: Check if redirect is already in progress
    const redirectInProgress = sessionStorage.getItem('redirect_in_progress') === 'true';
    if (redirectInProgress) {
      console.log('[Index] Redirect in progress, skipping Index redirect logic');
      return;
    }

    // PHASE 2: Check if user is being navigated from login
    const isNavigatingFromLogin = sessionStorage.getItem('navigating_to_dashboard') === 'true';
    if (isNavigatingFromLogin) {
      console.log('[Index] Navigation from login in progress, skipping Index redirect logic');
      return;
    }

    const currentPath = window.location.pathname;
    
    // CRITICAL: Only redirect if user is actually on the Index page (/)
    // This prevents interference with TenantLogin navigation
    if (currentPath !== '/') {
      console.log('[Index] User not on Index page, skipping redirect logic');
      return;
    }
    
    // Only redirect if auth is complete AND user is authenticated
    if (!authLoading && !roleLoading && user && userRole && !hasRedirected.current) {
      hasRedirected.current = true;
      
      console.log('[Index] User authenticated with role:', userRole.role, '- preparing redirect');
      
      // Determine redirect path based on role and organization
      let redirectPath = '/dashboard'; // Default fallback
      
      if (userRole.role === 'super_admin') {
        // Super admins ALWAYS go to main admin dashboard (no tenant slug)
        redirectPath = '/dashboard';
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
      
      // Use setTimeout to ensure redirect happens after render
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 0);
    } else if (!authLoading && !roleLoading && user && !userRole && !roleError) {
      console.log('[Index] User authenticated but no role found - redirecting to login');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 0);
    }
  }, [user, userRole, authLoading, roleLoading, roleError, navigate]);

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

  // ALWAYS render landing page immediately - no loading state
  // Redirects happen in background after page is visible

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
