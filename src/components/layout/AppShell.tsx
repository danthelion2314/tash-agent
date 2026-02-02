"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Settings,
    LogOut,
    Menu,
    Sparkles,
    X,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

interface AppShellProps {
    children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // זיהוי מובייל חכם
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024; // Tablet and below
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false); // סגור כברירת מחדל במובייל
            } else {
                setIsSidebarOpen(true); // פתוח כברירת מחדל במחשב
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // סגירה אוטומטית במעבר דף (במובייל בלבד)
    useEffect(() => {
        if (isMobile) setIsSidebarOpen(false);
    }, [pathname, isMobile]);

    const menuItems = [
        { icon: LayoutDashboard, label: "לוח בקרה", href: "/" },
        { icon: Users, label: "החיילים שלי", href: "/soldiers" },
        { icon: Settings, label: "הגדרות נהלים", href: "/settings/templates" },
    ];

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">

            {/* 1. Mobile Overlay (רקע כהה כשפותחים תפריט) */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* 2. Sidebar Navigation */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : (isMobile ? 0 : 80),
                    x: isMobile && !isSidebarOpen ? 280 : 0 // RTL Fix: הזזה ימינה במקום שמאלה
                }}
                className={`
          h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out
          ${isMobile ? 'fixed right-0 top-0 bottom-0 z-50' : 'relative z-30'} 
        `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50 shrink-0">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && !isMobile && 'justify-center w-full'}`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <Sparkles className="text-white w-5 h-5" />
                        </div>
                        {(isSidebarOpen || isMobile) && (
                            <span className="font-bold text-lg tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Tash Agent
                            </span>
                        )}
                    </div>

                    {/* כפתור סגירה למובייל */}
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={`
                    flex items-center gap-4 px-3 py-3.5 rounded-xl cursor-pointer transition-all duration-200 group relative
                    ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                                        }
                    ${!isSidebarOpen && !isMobile && 'justify-center'}
                  `}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} />

                                    {(isSidebarOpen || isMobile) && (
                                        <span className="font-medium truncate text-sm">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Tooltip for collapsed desktop */}
                                    {!isSidebarOpen && !isMobile && (
                                        <div className="absolute right-full mr-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-800/50 shrink-0">
                    {user ? (
                        <div className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${!isSidebarOpen && !isMobile ? 'justify-center' : 'hover:bg-slate-800/50'}`}>
                            <Avatar className="w-9 h-9 border border-slate-600">
                                <AvatarImage src={user.photoURL || ""} />
                                <AvatarFallback className="bg-slate-700 text-slate-300">
                                    {user.displayName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>

                            {(isSidebarOpen || isMobile) && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-sm font-semibold text-slate-200 truncate">
                                        {user.displayName || "משתמש"}
                                    </span>
                                    <div
                                        onClick={logout}
                                        className="text-xs text-red-400 hover:text-red-300 w-fit flex items-center gap-1 mt-0.5 cursor-pointer"
                                    >
                                        <LogOut className="w-3 h-3" /> התנתק
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="secondary" className="w-full text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-0">
                                {isSidebarOpen ? "התחבר למערכת" : <LogOut className="w-4 h-4" />}
                            </Button>
                        </Link>
                    )}
                </div>
            </motion.aside>

            {/* 3. Main Content Wrapper */}
            <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[#f8fafc]">

                {/* Mobile Header Bar */}
                <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-slate-800 text-lg">Tash Agent</span>
                    </div>
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}