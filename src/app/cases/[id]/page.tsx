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

    if (loading) return <AppShell><Loader2 className="animate-spin m-auto" /></AppShell>;
    if (!caseData) return <AppShell><div>תיק לא נמצא</div></AppShell>;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">תיק פעיל</Badge>
                            <span className="text-slate-400 text-sm">{new Date(caseData.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{caseData.templateTitle}</h1>
                        <p className="text-slate-500 max-w-2xl mt-1 truncate">"{caseData.soldierDescription}"</p>
                    </div>

                    <Button variant="outline" className="gap-2">
                        <Save className="w-4 h-4" /> שמירה ידנית
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* אזור העבודה המרכזי */}
                    <div className="md:col-span-8 space-y-6">

                        {/* טאבים לבחירה */}
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('soldier')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'soldier' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText className="w-4 h-4" /> משימות לחייל
                            </button>
                            <button
                                onClick={() => setActiveTab('commander')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'commander' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <UserCog className="w-4 h-4" /> משימות למש"ק
                            </button>
                        </div>

                        <Card className="border-slate-200 shadow-sm min-h-[500px]">
                            <CardContent className="p-6 space-y-4">

                                {/* רשימת המשימות */}
                                <div className="space-y-2">
                                    {(activeTab === 'soldier' ? caseData.soldierChecklist : caseData.commanderChecklist).map((item) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${item.isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                                        >
                                            <Checkbox
                                                checked={item.isChecked}
                                                onCheckedChange={() => toggleCheck(activeTab, item.id)}
                                                className={`w-5 h-5 ${item.isChecked ? 'data-[state=checked]:bg-green-600 border-green-600' : 'border-slate-300'}`}
                                            />
                                            <span className={`flex-1 text-sm md:text-base ${item.isChecked ? 'text-green-800 line-through decoration-green-800/50' : 'text-slate-700'}`}>
                                                {item.text}
                                            </span>

                                            {/* כפתור מחיקה שמופיע רק ב-Hover */}
                                            <button
                                                onClick={() => deleteItem(activeTab, item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* הוספת שורה חדשה */}
                                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100">
                                    <Input
                                        placeholder={activeTab === 'soldier' ? "הוסף מסמך חסר..." : "הוסף משימה עבורך..."}
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                        className="flex-1 border-slate-200 focus:ring-blue-500"
                                    />
                                    <Button onClick={addItem} size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                    {/* סרגל צד - סטטוס כללי */}
                    <div className="md:col-span-4 space-y-6">
                        <Card className="bg-slate-50 border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    סטטוס התקדמות
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">השלמת מסמכי חייל</span>
                                        <span className="font-bold text-slate-800">
                                            {Math.round((caseData.soldierChecklist.filter(i => i.isChecked).length / caseData.soldierChecklist.length) * 100 || 0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${(caseData.soldierChecklist.filter(i => i.isChecked).length / caseData.soldierChecklist.length) * 100 || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">ביצוע מש"ק</span>
                                        <span className="font-bold text-slate-800">
                                            {Math.round((caseData.commanderChecklist.filter(i => i.isChecked).length / caseData.commanderChecklist.length) * 100 || 0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${(caseData.commanderChecklist.filter(i => i.isChecked).length / caseData.commanderChecklist.length) * 100 || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </AppShell>
    );
}