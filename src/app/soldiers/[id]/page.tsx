"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { TashService } from "@/lib/tash-service";
import { Soldier, ConsultationCase, RequestTemplate } from "@/types/schema";
import { useAuth } from "@/components/providers/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    User, History, BrainCircuit, Plus, ChevronLeft, Sparkles, Loader2, CheckCircle2, LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";

export default function SoldierProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [soldier, setSoldier] = useState<Soldier | null>(null);
    const [history, setHistory] = useState<ConsultationCase[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'consult'>('history');
    const [loading, setLoading] = useState(true);

    // AI & Manual Selection State
    const [aiInput, setAiInput] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<RequestTemplate[]>([]);
    const [allTemplates, setAllTemplates] = useState<RequestTemplate[]>([]);
    const [creatingCase, setCreatingCase] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!params.id) return;
            try {
                const soldierSnap = await getDoc(doc(db, "soldiers", params.id as string));
                if (soldierSnap.exists()) {
                    setSoldier({ id: soldierSnap.id, ...soldierSnap.data() } as Soldier);
                }
                await fetchHistory();
                const templates = await TashService.getAllTemplates();
                setAllTemplates(templates);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [params.id]);

    const fetchHistory = async () => {
        const q = query(collection(db, "consultations"), where("soldierId", "==", params.id), orderBy("createdAt", "desc"));
        const historySnap = await getDocs(q);
        setHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultationCase)));
    };

    const handleConsultAi = async () => {
        if (!aiInput.trim()) return;
        setIsAnalyzing(true);
        setSuggestions([]);
        try {
            const response = await fetch("/api/consult", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: aiInput }),
            });
            if (!response.ok) throw new Error("API failed");
            const data = await response.json();
            setSuggestions(data.suggestions || []);
            if (data.suggestions?.length === 0) alert("לא נמצאו התאמות. נסה לבחור ידנית.");
        } catch (e) {
            console.error(e);
            alert("שגיאה בניתוח הנתונים");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualSelect = (templateId: string) => {
        const selected = allTemplates.find(t => t.id === templateId);
        if (selected) {
            handleStartCase(selected, "נפתח ידנית (ללא AI)");
        }
    };

    const handleStartCase = async (template: RequestTemplate, descriptionOverride?: string) => {
        if (!user || !soldier) return;
        setCreatingCase(true);
        try {
            const safeReqs = template.requirements || [];
            const safeWorkflow = template.workflow || [];

            const soldierChecklist = safeReqs.map(req => ({
                id: req.id, text: req.title, isChecked: false, type: 'soldier_doc' as const
            }));
            const commanderChecklist = safeWorkflow.map(step => ({
                id: `step_${step.order}`, text: step.title, isChecked: false, type: 'commander_action' as const
            }));

            const docRef = await addDoc(collection(db, "consultations"), {
                userId: user.uid,
                soldierId: soldier.id,
                soldierName: soldier.fullName,
                soldierDescription: descriptionOverride || aiInput || "נפתח ידנית",
                templateId: template.id,
                templateTitle: template.title,
                soldierChecklist,
                commanderChecklist,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            router.push(`/cases/${docRef.id}`);
        } catch (error) {
            console.error(error);
            alert("שגיאה ביצירת התיק");
            setCreatingCase(false);
        }
    };

    const groupedTemplates = allTemplates.reduce((acc, curr) => {
        const cat = curr.category || "כללי";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {} as Record<string, RequestTemplate[]>);

    if (loading) return <AppShell><div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div></AppShell>;
    if (!soldier) return <AppShell><div className="flex h-full items-center justify-center text-slate-400">חייל לא נמצא</div></AppShell>;

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0 animate-fade-up">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 border border-blue-200/30">
                            <User className="w-7 h-7 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900">{soldier.fullName}</h1>
                            <div className="flex items-center gap-3 text-slate-500 mt-1 text-sm font-medium">
                                <span className="bg-slate-100/80 px-2.5 py-0.5 rounded-lg text-slate-600 text-xs font-mono">מ.א: {soldier.personalId}</span>
                                {soldier.unit && <span className="text-slate-400">| {soldier.unit}</span>}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/soldiers')} className="w-full md:w-auto rounded-xl border-slate-200 hover:border-blue-300 transition-all">
                        <ChevronLeft className="w-4 h-4 ml-1" /> חזרה לרשימה
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit backdrop-blur-sm border border-slate-200/40">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-2.5 pt-2.5 px-5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'history'
                            ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        תיק אישי והיסטוריה
                    </button>
                    <button
                        onClick={() => setActiveTab('consult')}
                        className={`pb-2.5 pt-2.5 px-5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'consult'
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        התייעצות ופתיחת בקשה
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-200">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <History className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-semibold text-slate-600">התיק ריק</p>
                                    <p className="text-sm text-slate-400 mb-5">לא נמצאו בקשות קודמות עבור חייל זה</p>
                                    <Button onClick={() => setActiveTab('consult')} className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0 rounded-xl h-10 px-6 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                        פתח בקשה ראשונה
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                                    {history.map(c => (
                                        <Card key={c.id} className="card-interactive border-slate-200/60 bg-white/80 backdrop-blur-sm group rounded-xl overflow-hidden" onClick={() => router.push(`/cases/${c.id}`)}>
                                            {/* Progress strip */}
                                            <div className="h-1 bg-slate-100">
                                                <div
                                                    className={`h-full rounded-r-full ${c.status === 'active' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-emerald-400'}`}
                                                    style={{ width: `${(c.soldierChecklist.filter(i => i.isChecked).length / Math.max(c.soldierChecklist.length, 1)) * 100}%` }}
                                                />
                                            </div>
                                            <CardHeader className="pb-2 pt-4 px-5">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="secondary" className={`text-[11px] px-2.5 py-0.5 rounded-lg font-semibold ${c.status === 'active'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                                        }`}>
                                                        {c.status === 'active' ? 'בטיפול' : 'סגור'}
                                                    </Badge>
                                                    <span className="text-[11px] text-slate-400 font-mono">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                </div>
                                                <CardTitle className="text-[15px] mt-2 group-hover:text-blue-600 transition-colors font-bold">{c.templateTitle}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-2 pb-5 px-5">
                                                <p className="text-sm text-slate-500 line-clamp-2 h-10 leading-relaxed">{c.soldierDescription}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consult Tab */}
                    {activeTab === 'consult' && (
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

                            {/* Input Area */}
                            <div className="lg:col-span-5 space-y-5 order-1">

                                {/* Manual Select */}
                                <Card className="border-slate-200/60 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 p-4 border-b border-slate-100 flex items-center gap-2.5">
                                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                                            <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                        <h3 className="font-bold text-slate-700 text-sm">פתיחה ידנית מהירה</h3>
                                    </div>
                                    <CardContent className="p-4">
                                        <Select onValueChange={handleManualSelect} disabled={creatingCase}>
                                            <SelectTrigger className="w-full h-11 bg-white border-slate-200 rounded-xl">
                                                <SelectValue placeholder="בחר סוג בקשה מהרשימה..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-slate-200 shadow-xl max-h-[300px] z-[9999] rounded-xl">
                                                {Object.entries(groupedTemplates).map(([category, items]) => (
                                                    <SelectGroup key={category}>
                                                        <SelectLabel className="bg-slate-50 pl-2 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                                                            {category === 'tashmash' ? 'תשמ"ש' : category === 'lone_soldier' ? 'חייל בודד' : category === 'housing' ? 'דיור' : category === 'economic' ? 'כלכלי' : 'כללי'}
                                                        </SelectLabel>
                                                        {items.map(item => (
                                                            <SelectItem key={item.id} value={item.id} className="cursor-pointer hover:bg-slate-50 rounded-lg">
                                                                {item.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>

                                <div className="relative flex items-center py-1">
                                    <div className="flex-grow border-t border-slate-200/60"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-[11px] font-semibold bg-slate-50/80 px-3 py-1 rounded-full border border-slate-200/40">או התייעץ עם המומחה</span>
                                    <div className="flex-grow border-t border-slate-200/60"></div>
                                </div>

                                {/* AI Input */}
                                <Card className="border-indigo-200/40 shadow-md bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/40 p-4 border-b border-indigo-100/60">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg flex items-center justify-center border border-indigo-200/30">
                                                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            תיאור המקרה לניתוח
                                        </h3>
                                    </div>
                                    <CardContent className="p-4 space-y-4">
                                        <Textarea
                                            placeholder="תאר את הבעיה בחופשיות... (למשל: החייל נכנס לחובות בגלל הימורים)"
                                            className="min-h-[150px] resize-none bg-white/60 border-slate-200 rounded-xl transition-all focus:bg-white"
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                        />
                                        <Button onClick={handleConsultAi} disabled={isAnalyzing || !aiInput} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-11 shadow-lg shadow-indigo-600/20 border-0 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]">
                                            {isAnalyzing ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2 w-4 h-4" />}
                                            נתח זכאות
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* AI Results */}
                            <div className="lg:col-span-7 space-y-4 order-2">
                                {suggestions.length > 0 ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2.5">
                                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            המלצות AI:
                                        </h3>
                                        <div className="space-y-3 stagger-children">
                                            {suggestions.map((req, idx) => (
                                                <div key={req.id} onClick={() => handleStartCase(req)} className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group card-interactive">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-[16px] text-slate-900 group-hover:text-indigo-700 transition-colors">{req.title}</h4>
                                                            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{req.shortDescription}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-2.5 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0 ml-4">
                                                            <Plus className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    !isAnalyzing && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl min-h-[300px] bg-slate-50/20">
                                            <div className="w-14 h-14 bg-slate-100/80 rounded-2xl flex items-center justify-center mb-4">
                                                <Sparkles className="w-7 h-7 text-slate-300" />
                                            </div>
                                            <p className="font-semibold text-slate-500">המתנה לנתונים...</p>
                                            <p className="text-sm text-slate-400 mt-1">הזן פרטים או בחר בקשה ידנית מהרשימה</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}