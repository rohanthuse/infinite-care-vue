
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
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  
  // Defensive auth hook with error handling
  let user = null;
  let authLoading = false;
  
  try {
    const auth = useAuth();
    user = auth.user;
    authLoading = auth.loading;
  } catch (error) {
    console.error('[Index] Auth context error:', error);
    // Landing page is public - continue rendering without auth
  }
  
  // Defensive user role hook with error handling
  let userRole = null;
  let roleLoading = false;
  let roleError = null;
  
  try {
    const roleData = useUserRole();
    userRole = roleData.data;
    roleLoading = roleData.isLoading;
    roleError = roleData.error;
  } catch (error) {
    console.error('[Index] UserRole hook error:', error);
    // Continue rendering without role data
  }

  // PHASE 1: Defensive flag clearing on mount - always runs first
  useEffect(() => {
    console.log('[Index] Mounted, clearing any stale navigation flags');
    
    // Clear stale flags immediately
    const navigatingFlag = sessionStorage.getItem('navigating_to_dashboard');
    const targetDashboard = sessionStorage.getItem('target_dashboard');
    const flagTimestamp = sessionStorage.getItem('navigation_flag_timestamp');
    
    // Clear flags older than 5 seconds
    if (flagTimestamp) {
      const age = Date.now() - parseInt(flagTimestamp);
      if (age > 5000) {
        console.warn('[Index] Clearing stale flags (age:', age, 'ms)');
        sessionStorage.removeItem('navigating_to_dashboard');
        sessionStorage.removeItem('target_dashboard');
        sessionStorage.removeItem('redirect_in_progress');
        sessionStorage.removeItem('navigation_flag_timestamp');
      }
    }
    
    // Failsafe: Force clear after 2 seconds regardless
    const failsafeTimer = setTimeout(() => {
      if (sessionStorage.getItem('navigating_to_dashboard') === 'true') {
        console.warn('[Index] Failsafe: Force clearing navigation flags');
        sessionStorage.removeItem('navigating_to_dashboard');
        sessionStorage.removeItem('target_dashboard');
        sessionStorage.removeItem('redirect_in_progress');
        sessionStorage.removeItem('navigation_flag_timestamp');
      }
    }, 2000);
    
    return () => clearTimeout(failsafeTimer);
  }, []);

  // CRITICAL: Intercept password recovery tokens on Index and redirect to reset page
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log('[Index] Recovery tokens detected in hash, redirecting to /reset-password');
      // Preserve the hash when redirecting
      navigate('/reset-password' + hash, { replace: true });
    }
  }, [navigate]);

  // PHASE 2 & 7: Background redirect with protection against double redirects
  useEffect(() => {
    // CRITICAL: Skip redirect logic if recovery tokens are present
    const hash = window.location.hash;
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      console.log('[Index] Recovery tokens detected, skipping authenticated redirect logic');
      return; // Exit early - let the recovery redirect handle this
    }

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
        // Super admins go to tenant dashboard if organization available, otherwise main dashboard
        if (userRole.organizationSlug) {
          redirectPath = `/${userRole.organizationSlug}/dashboard`;
        } else {
          redirectPath = '/dashboard';
        }
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
    }
    // Removed redirect to login for users without roles to prevent infinite loop
    // Users without roles will stay on Index page or will be handled by UnifiedLogin
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
