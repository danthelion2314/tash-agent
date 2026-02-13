"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { ConsultationCase } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Clock, CheckCircle2, Loader2, TrendingUp, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeCases, setActiveCases] = useState<ConsultationCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      try {
        // שליפת 5 התיקים האחרונים שפתוחים
        const q = query(
          collection(db, "consultations"),
          where("userId", "==", user.uid),
          where("status", "==", "active"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setActiveCases(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ConsultationCase)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto pb-20">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-10 text-white shadow-xl animate-fade-up">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-600 via-indigo-600 to-purple-700" />
          {/* Mesh pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
          {/* Floating orbs */}
          <div className="absolute top-[-40px] left-[-40px] w-[200px] h-[200px] bg-white/[0.06] rounded-full blur-2xl float-slow" />
          <div className="absolute bottom-[-60px] right-[-40px] w-[250px] h-[250px] bg-purple-400/[0.08] rounded-full blur-3xl float-medium" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span className="text-blue-200 text-sm font-medium">מערכת ניהול ת&quot;ש</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">
              שלום, {user?.displayName?.split(" ")[0] || "משתמש"} 👋
            </h1>
            <p className="text-blue-100/80 text-lg max-w-xl">
              ברוך הבא למערכת ניהול הת&quot;ש החכמה. כאן תוכל לנהל תיקים, לעקוב אחר משימות ולקבל המלצות AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/soldiers">
                <Button className="bg-white/95 text-indigo-700 hover:bg-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-black/10 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Users className="w-4 h-4 ml-2" />
                  רשימת החיילים שלי
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children" style={{ animationDelay: '0.1s' }}>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover-lift rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeCases.length}</p>
                <p className="text-sm text-slate-500">תיקים פתוחים</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover-lift rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {activeCases.reduce((acc, c) => acc + c.soldierChecklist.filter(i => i.isChecked).length, 0)}
                </p>
                <p className="text-sm text-slate-500">משימות שהושלמו</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm hover-lift rounded-xl col-span-2 md:col-span-1">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {activeCases.length > 0
                    ? Math.round(
                      (activeCases.reduce((acc, c) => acc + c.soldierChecklist.filter(i => i.isChecked).length, 0) /
                        Math.max(activeCases.reduce((acc, c) => acc + c.soldierChecklist.length, 0), 1)) * 100
                    )
                    : 0}%
                </p>
                <p className="text-sm text-slate-500">התקדמות כללית</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Cases Section */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-[18px] h-[18px] text-blue-600" />
              </div>
              תיקים בטיפול ({activeCases.length})
            </h2>
            <Link href="/soldiers" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">
              לכל החיילים
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                <p className="text-sm text-slate-400">טוען תיקים...</p>
              </div>
            </div>
          ) : activeCases.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50 border-slate-200 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-lg font-semibold text-slate-700">אין תיקים פתוחים כרגע</p>
                <p className="text-sm text-slate-400 mt-1">כל הכבוד! סיימת את כל המשימות.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {activeCases.map((c) => (
                <Card
                  key={c.id}
                  className="card-interactive border-slate-200/60 bg-white/80 backdrop-blur-sm group rounded-xl overflow-hidden"
                  onClick={() => router.push(`/cases/${c.id}`)}
                >
                  {/* Progress bar at top */}
                  <div className="h-1 bg-slate-100 w-full">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 rounded-r-full"
                      style={{ width: `${(c.soldierChecklist.filter(i => i.isChecked).length / Math.max(c.soldierChecklist.length, 1)) * 100}%` }}
                    />
                  </div>
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100/60">
                        {c.templateTitle}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(c.createdAt?.seconds * 1000).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <CardTitle className="text-[17px] mt-2.5 group-hover:text-blue-600 transition-colors font-bold">
                      {c.soldierName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-5 pb-5">
                    <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4 leading-relaxed">
                      {c.soldierDescription}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <span className="font-bold text-slate-800 text-sm">
                            {c.soldierChecklist.filter(i => i.isChecked).length}
                          </span>
                          <span className="text-slate-400">מתוך</span>
                          <span>{c.soldierChecklist.length}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all group-hover:scale-110">
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}