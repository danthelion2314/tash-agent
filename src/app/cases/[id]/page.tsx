"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ConsultationCase, ChecklistItem } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    Trash2,
    Plus,
    Save,
    FileText,
    UserCog,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function CasePage() {
    const params = useParams();
    const [caseData, setCaseData] = useState<ConsultationCase | null>(null);
    const [loading, setLoading] = useState(true);
    const [newItemText, setNewItemText] = useState("");
    const [activeTab, setActiveTab] = useState<'soldier' | 'commander'>('soldier');

    // טעינת התיק מה-DB
    useEffect(() => {
        async function loadCase() {
            if (!params.id) return;
            const docRef = doc(db, "consultations", params.id as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setCaseData({ id: snap.id, ...snap.data() } as ConsultationCase);
            }
            setLoading(false);
        }
        loadCase();
    }, [params.id]);

    // סימון V
    const toggleCheck = async (type: 'soldier' | 'commander', itemId: string) => {
        if (!caseData) return;
        const listKey = type === 'soldier' ? 'soldierChecklist' : 'commanderChecklist';

        const updatedList = caseData[listKey].map(item =>
            item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );

        const updatedCase = { ...caseData, [listKey]: updatedList };
        setCaseData(updatedCase);

        // שמירה שקטה ברקע (Autosave)
        await updateDoc(doc(db, "consultations", caseData.id), { [listKey]: updatedList });
    };

    // מחיקת סעיף
    const deleteItem = async (type: 'soldier' | 'commander', itemId: string) => {
        if (!caseData) return;
        const listKey = type === 'soldier' ? 'soldierChecklist' : 'commanderChecklist';

        const updatedList = caseData[listKey].filter(item => item.id !== itemId);
        const updatedCase = { ...caseData, [listKey]: updatedList };
        setCaseData(updatedCase);
        await updateDoc(doc(db, "consultations", caseData.id), { [listKey]: updatedList });
    };

    // הוספת סעיף ידני
    const addItem = async () => {
        if (!caseData || !newItemText.trim()) return;
        const listKey = activeTab === 'soldier' ? 'soldierChecklist' : 'commanderChecklist';

        const newItem: ChecklistItem = {
            id: `manual_${Date.now()}`,
            text: newItemText,
            isChecked: false,
            type: activeTab === 'soldier' ? 'soldier_doc' : 'commander_action'
        };

        const updatedList = [...caseData[listKey], newItem];
        const updatedCase = { ...caseData, [listKey]: updatedList };

        setCaseData(updatedCase);
        setNewItemText(""); // איפוס שדה הקלט
        await updateDoc(doc(db, "consultations", caseData.id), { [listKey]: updatedList });
    };

    if (loading) return <AppShell><div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div></AppShell>;
    if (!caseData) return <AppShell><div className="flex h-full items-center justify-center text-slate-400">תיק לא נמצא</div></AppShell>;

    const soldierProgress = caseData.soldierChecklist.length > 0
        ? Math.round((caseData.soldierChecklist.filter(i => i.isChecked).length / caseData.soldierChecklist.length) * 100)
        : 0;
    const commanderProgress = caseData.commanderChecklist.length > 0
        ? Math.round((caseData.commanderChecklist.filter(i => i.isChecked).length / caseData.commanderChecklist.length) * 100)
        : 0;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 px-3 py-1 rounded-lg font-semibold">
                                תיק פעיל
                            </Badge>
                            <span className="text-slate-400 text-sm">{new Date(caseData.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{caseData.templateTitle}</h1>
                        <p className="text-slate-500 max-w-2xl mt-1 truncate">"{caseData.soldierDescription}"</p>
                    </div>

                    <Button variant="outline" className="gap-2 rounded-xl h-10 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                        <Save className="w-4 h-4" /> שמירה ידנית
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

                    {/* אזור העבודה המרכזי */}
                    <div className="md:col-span-8 space-y-5">

                        {/* טאבים לבחירה */}
                        <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit backdrop-blur-sm border border-slate-200/40">
                            <button
                                onClick={() => setActiveTab('soldier')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'soldier'
                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <FileText className="w-4 h-4" /> משימות לחייל
                            </button>
                            <button
                                onClick={() => setActiveTab('commander')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'commander'
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <UserCog className="w-4 h-4" /> משימות למש&quot;ק
                            </button>
                        </div>

                        <Card className="border-slate-200/60 shadow-sm min-h-[500px] bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden">
                            {/* Progress strip at top */}
                            <div className="h-1 bg-slate-100 w-full">
                                <div
                                    className={`h-full transition-all duration-700 rounded-r-full ${activeTab === 'soldier'
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                                        : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                                        }`}
                                    style={{ width: `${activeTab === 'soldier' ? soldierProgress : commanderProgress}%` }}
                                />
                            </div>
                            <CardContent className="p-5 md:p-6 space-y-3">

                                {/* רשימת המשימות */}
                                <div className="space-y-2">
                                    {(activeTab === 'soldier' ? caseData.soldierChecklist : caseData.commanderChecklist).map((item) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all ${item.isChecked
                                                ? 'bg-emerald-50/60 border-emerald-200/60'
                                                : 'bg-white border-slate-100 hover:border-blue-200/60 hover:shadow-sm'
                                                }`}
                                        >
                                            <Checkbox
                                                checked={item.isChecked}
                                                onCheckedChange={() => toggleCheck(activeTab, item.id)}
                                                className={`w-5 h-5 rounded-md transition-all ${item.isChecked
                                                    ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                                                    : 'border-slate-300'
                                                    }`}
                                            />
                                            <span className={`flex-1 text-sm md:text-[15px] transition-all ${item.isChecked
                                                ? 'text-emerald-800/80 line-through decoration-emerald-600/30'
                                                : 'text-slate-700'
                                                }`}>
                                                {item.text}
                                            </span>

                                            {/* כפתור מחיקה שמופיע רק ב-Hover */}
                                            <button
                                                onClick={() => deleteItem(activeTab, item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* הוספת שורה חדשה */}
                                <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
                                    <Input
                                        placeholder={activeTab === 'soldier' ? "הוסף מסמך חסר..." : "הוסף משימה עבורך..."}
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                        className="flex-1 border-slate-200 rounded-xl h-11 bg-slate-50/50 focus:bg-white transition-colors"
                                    />
                                    <Button onClick={addItem} size="icon" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shrink-0 rounded-xl h-11 w-11 border-0 shadow-sm transition-all hover:scale-105 active:scale-95">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* סרגל צד - סטטוס כללי */}
                    <div className="md:col-span-4 space-y-5">
                        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 rounded-xl overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    סטטוס התקדמות
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pb-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 font-medium">השלמת מסמכי חייל</span>
                                        <span className="font-bold text-slate-800 bg-blue-50 px-2 py-0.5 rounded-md text-xs">
                                            {soldierProgress}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 rounded-full progress-animated"
                                            style={{ width: `${soldierProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        {caseData.soldierChecklist.filter(i => i.isChecked).length} מתוך {caseData.soldierChecklist.length} מסמכים
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-5">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 font-medium">ביצוע מש&quot;ק</span>
                                        <span className="font-bold text-slate-800 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">
                                            {commanderProgress}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-700 rounded-full progress-animated"
                                            style={{ width: `${commanderProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        {caseData.commanderChecklist.filter(i => i.isChecked).length} מתוך {caseData.commanderChecklist.length} משימות
                                    </p>
                                </div>

                                {/* Overall progress */}
                                {soldierProgress === 100 && commanderProgress === 100 && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 rounded-xl p-4 text-center mt-2">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-emerald-800 font-bold text-sm">כל המשימות הושלמו! 🎉</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </AppShell>
    );
}