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

    if (loading) return <AppShell><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div></AppShell>;
    if (!soldier) return <AppShell><div className="p-8 text-center text-slate-500">חייל לא נמצא</div></AppShell>;

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto space-y-6 pb-20 px-2 md:px-0">

                {/* Header */}
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{soldier.fullName}</h1>
                            <div className="flex items-center gap-3 text-slate-500 mt-1 text-sm font-medium">
                                <span className="bg-slate-100 px-2 py-0.5 rounded">מ.א: {soldier.personalId}</span>
                                {soldier.unit && <span>| {soldier.unit}</span>}
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/soldiers')} className="w-full md:w-auto">
                        <ChevronLeft className="w-4 h-4 ml-1" /> חזרה לרשימה
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-slate-200 px-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                        תיק אישי והיסטוריה
                    </button>
                    <button
                        onClick={() => setActiveTab('consult')}
                        className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'consult' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                    >
                        התייעצות ופתיחת בקשה
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-lg font-medium text-slate-600">התיק ריק</p>
                                    <p className="text-sm text-slate-400 mb-4">לא נמצאו בקשות קודמות עבור חייל זה</p>
                                    <Button onClick={() => setActiveTab('consult')} className="bg-indigo-600">פתח בקשה ראשונה</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {history.map(c => (
                                        <Card key={c.id} className="cursor-pointer hover:shadow-md transition-all border-slate-200 hover:border-blue-300 group bg-white" onClick={() => router.push(`/cases/${c.id}`)}>
                                            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-50">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">{c.status === 'active' ? 'בטיפול' : 'סגור'}</Badge>
                                                    <span className="text-xs text-slate-400">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                                </div>
                                                <CardTitle className="text-base mt-2 group-hover:text-blue-600 transition-colors">{c.templateTitle}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-slate-500 line-clamp-2 h-10">{c.soldierDescription}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consult Tab */}
                    {activeTab === 'consult' && (
                        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 animate-in fade-in">

                            {/* Input Area */}
                            <div className="lg:col-span-5 space-y-6 order-1">

                                {/* Manual Select */}
                                <Card className="border-slate-200 shadow-sm bg-white">
                                    <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-slate-600" />
                                        <h3 className="font-bold text-slate-700 text-sm">פתיחה ידנית מהירה</h3>
                                    </div>
                                    <CardContent className="p-4">
                                        <Select onValueChange={handleManualSelect} disabled={creatingCase}>
                                            <SelectTrigger className="w-full h-11 bg-white border-slate-200">
                                                <SelectValue placeholder="בחר סוג בקשה מהרשימה..." />
                                            </SelectTrigger>
                                            {/* התיקון כאן: bg-white ו-z-index */}
                                            <SelectContent className="bg-white border-slate-200 shadow-xl max-h-[300px] z-[9999]">
                                                {Object.entries(groupedTemplates).map(([category, items]) => (
                                                    <SelectGroup key={category}>
                                                        <SelectLabel className="bg-slate-100 pl-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                                                            {category === 'tashmash' ? 'תשמ"ש' : category === 'lone_soldier' ? 'חייל בודד' : category === 'housing' ? 'דיור' : category === 'economic' ? 'כלכלי' : 'כללי'}
                                                        </SelectLabel>
                                                        {items.map(item => (
                                                            <SelectItem key={item.id} value={item.id} className="cursor-pointer hover:bg-slate-50">
                                                                {item.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium bg-slate-50 px-2 rounded-full">או התייעץ עם המומחה</span>
                                    <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                {/* AI Input */}
                                <Card className="border-indigo-100 shadow-md bg-white">
                                    <div className="bg-gradient-to-r from-indigo-50 to-white p-4 border-b border-indigo-100">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                            <BrainCircuit className="w-5 h-5" /> תיאור המקרה לניתוח
                                        </h3>
                                    </div>
                                    <CardContent className="p-4 space-y-4">
                                        <Textarea
                                            placeholder="תאר את הבעיה בחופשיות... (למשל: החייל נכנס לחובות בגלל הימורים)"
                                            className="min-h-[150px] resize-none focus:ring-indigo-500 bg-white border-slate-200"
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                        />
                                        <Button onClick={handleConsultAi} disabled={isAnalyzing || !aiInput} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 shadow-lg shadow-indigo-900/20">
                                            {isAnalyzing ? <Loader2 className="animate-spin ml-2" /> : <Sparkles className="ml-2 w-4 h-4" />}
                                            נתח זכאות
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* AI Results */}
                            <div className="lg:col-span-7 space-y-4 order-2">
                                {suggestions.length > 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> המלצות AI:
                                        </h3>
                                        <div className="space-y-3">
                                            {suggestions.map((req, idx) => (
                                                <div key={req.id} onClick={() => handleStartCase(req)} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700">{req.title}</h4>
                                                            <p className="text-sm text-slate-500 mt-1">{req.shortDescription}</p>
                                                        </div>
                                                        <div className="bg-slate-50 p-2 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600"><Plus className="w-5 h-5" /></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    !isAnalyzing && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl min-h-[300px] bg-slate-50/30">
                                            <Sparkles className="w-10 h-10 mb-2 opacity-20" />
                                            <p className="font-medium">המתנה לנתונים...</p>
                                            <p className="text-sm opacity-70">הזן פרטים או בחר בקשה ידנית מהרשימה</p>
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