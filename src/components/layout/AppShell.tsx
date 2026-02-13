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
    LayoutDashboard,
    ChevronRight,
    ChevronLeft
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
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
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
        <div className="flex h-screen w-full gradient-mesh overflow-hidden relative">

            {/* 1. Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* 2. Sidebar Navigation */}
            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : (isMobile ? 0 : 76),
                    x: isMobile && !isSidebarOpen ? 280 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`
                    h-full sidebar-gradient text-white flex flex-col shadow-2xl overflow-hidden
                    ${isMobile ? 'fixed right-0 top-0 bottom-0 z-50' : 'relative z-30'}
                `}
            >
                {/* Logo Area */}
                <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/[0.06] shrink-0">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen && !isMobile && 'justify-center w-full'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 relative">
                            <Sparkles className="text-white w-5 h-5" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 blur-lg opacity-40" />
                        </div>
                        {(isSidebarOpen || isMobile) && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col"
                            >
                                <span className="font-bold text-[17px] tracking-tight whitespace-nowrap gradient-text">
                                    Tash Agent
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                                    IDF Smart System
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Desktop collapse button */}
                    {!isMobile && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all"
                        >
                            {isSidebarOpen ?
                                <ChevronRight className="w-4 h-4" /> :
                                <ChevronLeft className="w-4 h-4" />
                            }
                        </button>
                    )}

                    {/* Mobile close */}
                    {isMobile && (
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto no-scrollbar">
                    {(isSidebarOpen || isMobile) && (
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.12em] pr-3 mb-3">
                            ניווט ראשי
                        </p>
                    )}
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={`
                                        flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-gradient-to-l from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-900/30'
                                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                                        }
                                        ${!isSidebarOpen && !isMobile && 'justify-center'}
                                    `}
                                >
                                    <div className={`relative ${isActive ? '' : ''}`}>
                                        <item.icon className={`w-[20px] h-[20px] shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`} />
                                    </div>

                                    {(isSidebarOpen || isMobile) && (
                                        <span className="font-medium truncate text-[14px]">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Active indicator dot */}
                                    {isActive && !isSidebarOpen && !isMobile && (
                                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-400 rounded-full" />
                                    )}

                                    {/* Tooltip for collapsed desktop */}
                                    {!isSidebarOpen && !isMobile && (
                                        <div className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl pointer-events-none">
                                            {item.label}
                                            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-800 rotate-45" />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-3 border-t border-white/[0.06] shrink-0">
                    {user ? (
                        <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${!isSidebarOpen && !isMobile ? 'justify-center' : 'hover:bg-white/[0.06]'}`}>
                            <div className="relative">
                                <Avatar className="w-9 h-9 ring-2 ring-white/10 ring-offset-1 ring-offset-transparent">
                                    <AvatarImage src={user.photoURL || ""} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold">
                                        {user.displayName?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                            </div>

                            {(isSidebarOpen || isMobile) && (
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-sm font-semibold text-slate-200 truncate">
                                        {user.displayName || "משתמש"}
                                    </span>
                                    <div
                                        onClick={logout}
                                        className="text-xs text-red-400/80 hover:text-red-300 w-fit flex items-center gap-1 mt-0.5 cursor-pointer transition-colors"
                                    >
                                        <LogOut className="w-3 h-3" /> התנתק
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="secondary" className="w-full text-xs bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white border-0 transition-all">
                                {isSidebarOpen ? "התחבר למערכת" : <LogOut className="w-4 h-4" />}
                            </Button>
                        </Link>
                    )}
                </div>
            </motion.aside>

            {/* 3. Main Content Wrapper */}
            <main className="flex-1 flex flex-col h-full w-full overflow-hidden">

                {/* Mobile Header Bar */}
                <header className="lg:hidden h-[64px] glass-strong flex items-center justify-between px-4 shrink-0 z-20 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center">
                                <Sparkles className="text-white w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-800 text-[15px]">Tash Agent</span>
                        </div>
                    </div>
                    <Avatar className="w-8 h-8 ring-2 ring-slate-100">
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold">
                            {user?.displayName?.charAt(0)}
                        </AvatarFallback>
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