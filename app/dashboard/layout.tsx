"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useState, useEffect } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));

    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={mounted ? isSidebarCollapsed : true}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main content */}
        <div
          className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-300 ${
            mounted && !isSidebarCollapsed ? "lg:ml-64" : ""
          }`}
        >
          {/* Top Bar */}
          <TopBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarOpen={mounted ? !isSidebarCollapsed : false}
          />

          <main className="flex-1 p-4 md:p-6 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
                  
          {/* Footer */}
          
          <footer className="px-6 py-4 mt-auto border-t border-border/40 bg-background/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                © 2025{" "}
                <span className="font-semibold text-foreground">
                  MMKR Solutions
                </span>
                . All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <a
                  href="#privacy"
                  className="hover:text-primary transition-colors"
                >
                  Privacy
                </a>
                <span>•</span>
                <a
                  href="#terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms
                </a>
                <span>•</span>
                <a
                  href="#contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}
