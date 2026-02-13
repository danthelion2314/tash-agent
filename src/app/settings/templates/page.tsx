"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { TashService } from "@/lib/tash-service";
import { RequestTemplate } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Edit3, Loader2, Plus, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function TemplatesSettingsPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<RequestTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setLoading(true);
        const data = await TashService.getAllTemplates();
        setTemplates(data);
        setLoading(false);
    }

    const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation(); // מונע כניסה לדף העריכה כשלוחצים על המחיקה
        if (confirm(`האם אתה בטוח שברצונך למחוק את התבנית "${title}"? פעולה זו אינה הפיכה.`)) {
            await TashService.deleteTemplate(id);
            loadTemplates(); // רענון הרשימה
        }
    };

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200/60">
                                <Settings className="w-5 h-5 text-slate-700" />
                            </div>
                            ניהול נהלים ותבניות
                        </h1>
                        <p className="text-slate-500 mt-1 mr-[52px]">
                            כאן תוכל להוסיף, לערוך ולמחוק את סוגי הבקשות שקיימים במערכת.
                        </p>
                    </div>

                    <Button onClick={() => router.push('/settings/templates/new')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-lg shadow-blue-600/20 border-0 rounded-xl h-11 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-5 h-5" /> תבנית חדשה
                    </Button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                        <p className="text-sm text-slate-400">טוען תבניות...</p>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-7 h-7 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-semibold text-lg">אין תבניות במערכת</p>
                        <Button variant="link" onClick={() => router.push('/settings/templates/new')} className="text-blue-600 mt-1">צור את הראשונה</Button>
                    </div>
                ) : (
                    <div className="grid gap-3 stagger-children">
                        {templates.map((t) => (
                            <Card
                                key={t.id}
                                className="card-interactive border-slate-200/60 bg-white/80 backdrop-blur-sm group rounded-xl"
                                onClick={() => router.push(`/settings/templates/${t.id}`)}
                            >
                                <CardContent className="p-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-200/30 shrink-0">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-[16px] text-slate-800 group-hover:text-blue-700 transition-colors truncate">{t.title}</h3>
                                                <Badge variant="secondary" className="bg-slate-100/80 text-slate-600 font-normal text-[11px] px-2 py-0.5 rounded-lg shrink-0">
                                                    {t.category === 'tashmash' ? 'תשמ"ש' : t.category === 'lone_soldier' ? 'חייל בודד' : t.category}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-1">{t.shortDescription}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            onClick={(e) => handleDelete(e, t.id, t.title)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}