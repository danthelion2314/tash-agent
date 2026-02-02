"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { ConsultationCase } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Clock, CheckCircle2, Loader2 } from "lucide-react"; // <--- התיקון כאן
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white shadow-xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">
            שלום, {user?.displayName?.split(" ")[0] || "משתמש"} 👋
          </h1>
          <p className="text-blue-100 text-lg opacity-90">
            ברוך הבא למערכת ניהול הת"ש החכמה.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/soldiers">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 border-0 font-bold h-12 px-6">
                <Users className="w-4 h-4 ml-2" />
                רשימת החיילים שלי
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Cases Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              תיקים בטיפול ({activeCases.length})
            </h2>
            <Link href="/soldiers" className="text-sm text-blue-600 hover:underline font-medium">
              לכל החיילים &larr;
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
          ) : activeCases.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50 border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mb-4 text-green-500 opacity-50" />
                <p className="text-lg font-medium">אין תיקים פתוחים כרגע</p>
                <p className="text-sm">כל הכבוד! סיימת את כל המשימות.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCases.map((c) => (
                <Card
                  key={c.id}
                  className="hover:shadow-lg transition-all cursor-pointer border-slate-200 hover:border-blue-400 group"
                  onClick={() => router.push(`/cases/${c.id}`)}
                >
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                        {c.templateTitle}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(c.createdAt?.seconds * 1000).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2 group-hover:text-blue-600 transition-colors">
                      {c.soldierName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4 leading-snug">
                      {c.soldierDescription}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-800 text-sm">
                          {c.soldierChecklist.filter(i => i.isChecked).length}
                        </span>
                        <span className="mx-1">מתוך</span>
                        {c.soldierChecklist.length} מסמכים
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <ArrowRight className="w-4 h-4" />
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