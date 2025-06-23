
export const validateRoute = (path: string): boolean => {
  // Basic route validation - can be expanded based on your needs
  const validRoutePatterns = [
    /^\/$/,                                                    // Home
    /^\/super-admin$/,                                        // Super admin login
    /^\/carer-login$/,                                        // Carer login
    /^\/client-login$/,                                       // Client login
    /^\/dashboard$/,                                          // Admin dashboard
    /^\/branch-dashboard\/[^\/]+\/[^\/]+(?:\/[^\/]+)*$/,     // Branch dashboard with params
    /^\/carer-dashboard(?:\/[^\/]+)*$/,                      // Carer dashboard
    /^\/client-dashboard(?:\/[^\/]+)*$/,                     // Client dashboard
  ];

  return validRoutePatterns.some(pattern => pattern.test(path));
};

export const getRouteInfo = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  
  return {
    segments,
    isRoot: path === '/',
    isLogin: path.includes('login'),
    isDashboard: path.includes('dashboard'),
    isBranchDashboard: path.includes('branch-dashboard'),
    depth: segments.length
  };
};

export const logRouteChange = (from: string, to: string) => {
  console.log(`[Route Change] ${from} → ${to}`);
  console.log(`[Route Info] From:`, getRouteInfo(from));
  console.log(`[Route Info] To:`, getRouteInfo(to));
};
