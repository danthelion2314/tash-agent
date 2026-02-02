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
            <div className="max-w-5xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="w-8 h-8 text-slate-700" />
                            ניהול נהלים ותבניות
                        </h1>
                        <p className="text-slate-500 mt-1">
                            כאן תוכל להוסיף, לערוך ולמחוק את סוגי הבקשות שקיימים במערכת.
                        </p>
                    </div>

                    <Button onClick={() => router.push('/settings/templates/new')} className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-900/20">
                        <Plus className="w-5 h-5" /> תבנית חדשה
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">אין תבניות במערכת</p>
                        <Button variant="link" onClick={() => router.push('/settings/templates/new')}>צור את הראשונה</Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((t) => (
                            <Card
                                key={t.id}
                                className="hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group border-slate-200"
                                onClick={() => router.push(`/settings/templates/${t.id}`)}
                            >
                                <CardContent className="p-5 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">{t.title}</h3>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                                {t.category === 'tashmash' ? 'תשמ"ש' : t.category === 'lone_soldier' ? 'חייל בודד' : t.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-1">{t.shortDescription}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                            <Edit3 className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => handleDelete(e, t.id, t.title)}
                                        >
                                            <Trash2 className="w-5 h-5" />
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