"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { TashService } from "@/lib/tash-service";
import { RequestTemplate } from "@/types/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Edit3, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TemplatesSettingsPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<RequestTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await TashService.getAllTemplates();
            setTemplates(data);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Settings className="w-8 h-8 text-slate-700" />
                        ניהול נהלים ותבניות
                    </h1>
                </div>
                <p className="text-slate-500">
                    כאן תוכל לערוך את דרישות המערכת באופן קבוע. כל שינוי שתבצע כאן ישפיע על כל התיקים העתידיים שתפתח.
                </p>

                {loading ? (
                    <Loader2 className="animate-spin m-auto" />
                ) : (
                    <div className="grid gap-4">
                        {templates.map((t) => (
                            <Card key={t.id} className="hover:border-blue-400 transition-all cursor-pointer" onClick={() => router.push(`/settings/templates/${t.id}`)}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{t.title}</h3>
                                        <p className="text-sm text-slate-500">{t.shortDescription}</p>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Edit3 className="w-5 h-5 text-blue-600" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}