"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
    const { user, loginWithGoogle } = useAuth();
    const router = useRouter();

    // אם המשתמש כבר מחובר, שלח אותו לדף הבית
    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(224,30%,7%)]">

            {/* Animated gradient mesh background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] right-[-15%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] float-slow" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] float-medium" />
                <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] float-slow" />
            </div>

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
                <Card className="bg-white/[0.06] backdrop-blur-2xl border-white/[0.08] shadow-2xl text-white rounded-2xl overflow-hidden">

                    {/* Gradient top border accent */}
                    <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <CardHeader className="text-center pb-2 pt-10">
                        <div className="mx-auto w-[72px] h-[72px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 relative">
                            <ShieldCheck className="w-9 h-9 text-white" />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 blur-xl opacity-40" />
                        </div>
                        <CardTitle className="text-[32px] font-bold tracking-tight gradient-text pb-1">
                            Tash Agent
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-[16px] mt-2">
                            מערכת ניהול ת"ש חכמה
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6 pb-10 px-8">
                        <div className="space-y-2 text-center text-sm text-slate-500">
                            <p>התחברות מאובטחת למערכת</p>
                        </div>

                        <Button
                            onClick={loginWithGoogle}
                            className="w-full h-[52px] bg-white text-slate-900 hover:bg-slate-50 font-semibold text-[15px] transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-lg shadow-black/10 border-0"
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            התחבר באמצעות Google
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 mt-6">
                            <Sparkles className="w-3 h-3" />
                            <span>Powered by IDF AI Core</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Subtle bottom glow */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/10 blur-3xl rounded-full" />
            </div>
        </div>
    );
}