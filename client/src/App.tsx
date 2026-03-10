import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ValidateKey from "@/pages/validate-key";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Keys from "@/pages/keys";
import Generate from "@/pages/generate";
import Revenue from "@/pages/revenue";
import Settings from "@/pages/settings";
import ShowcaseAdmin from "@/pages/showcase-admin";
import PackagesAdmin from "@/pages/packages-admin";
import BeliSekarang from "@/pages/beli";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

function AdminProtectedRouter() {
  return (
    <Switch>
      <Route path="/kings" component={() => <Redirect to="/kings/dashboard" />} />
      <Route path="/kings/dashboard" component={Dashboard} />
      <Route path="/kings/keys" component={Keys} />
      <Route path="/kings/generate" component={Generate} />
      <Route path="/kings/revenue" component={Revenue} />
      <Route path="/kings/settings" component={Settings} />
      <Route path="/kings/showcase" component={ShowcaseAdmin} />
      <Route path="/kings/packages" component={PackagesAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminArea() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full circuit-overlay">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
            <div className="absolute inset-0 glass pointer-events-none" />
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <AdminProtectedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RootRouter() {
  const [location] = useLocation();

  // Public routes
  if (location === "/") {
    return <Landing />;
  }
  if (location === "/validate") {
    return <ValidateKey />;
  }
  if (location === "/beli") {
    return <BeliSekarang />;
  }

  // Admin routes (hidden path): /kings, /kings/dashboard, ...
  if (location.startsWith("/kings")) {
    return <AdminArea />;
  }

  return <NotFound />;
}

function AppContent() {
  return <RootRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
