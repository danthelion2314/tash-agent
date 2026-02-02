"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { TashService } from "@/lib/tash-service";
import { RequestTemplate, Requirement, ProcessStep } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Save,
    Plus,
    Trash2,
    ArrowRight,
    FileText,
    ListOrdered,
    Loader2,
    AlertTriangle
} from "lucide-react";

export default function EditTemplatePage() {
    const params = useParams();
    const router = useRouter();
    const [template, setTemplate] = useState<RequestTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            if (params.id) {
                const data = await TashService.getTemplateById(params.id as string);
                setTemplate(data);
            }
            setLoading(false);
        }
        load();
    }, [params.id]);

    // --- פונקציות לעריכת דרישות (Requirements) ---

    const updateReq = (index: number, field: keyof Requirement, value: any) => {
        if (!template) return;
        const newReqs = [...template.requirements];
        newReqs[index] = { ...newReqs[index], [field]: value };
        setTemplate({ ...template, requirements: newReqs });
    };

    const deleteReq = (index: number) => {
        if (!template) return;
        const newReqs = template.requirements.filter((_, i) => i !== index);
        setTemplate({ ...template, requirements: newReqs });
    };

    const addReq = () => {
        if (!template) return;
        const newReq: Requirement = {
            id: `custom_${Date.now()}`,
            title: "",
            description: "",
            type: "file",
            required: true,
            allowMultiple: false
        };
        setTemplate({ ...template, requirements: [...template.requirements, newReq] });
    };

    // --- פונקציות לעריכת תהליך (Workflow) ---

    const updateStep = (index: number, field: keyof ProcessStep, value: any) => {
        if (!template) return;
        const newSteps = [...template.workflow];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setTemplate({ ...template, workflow: newSteps });
    };

    const deleteStep = (index: number) => {
        if (!template) return;
        const newSteps = template.workflow.filter((_, i) => i !== index);
        // סידור מחדש של המספרים
        newSteps.forEach((s, i) => s.order = i + 1);
        setTemplate({ ...template, workflow: newSteps });
    };

    const addStep = () => {
        if (!template) return;
        const newStep: ProcessStep = {
            order: template.workflow.length + 1,
            title: "",
            description: "",
            isAutomated: false
        };
        setTemplate({ ...template, workflow: [...template.workflow, newStep] });
    };

    // --- שמירה ---

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);
        try {
            await TashService.updateTemplate(template.id, template);
            alert("השינויים נשמרו בהצלחה ויחולו על כל התיקים החדשים!");
            router.push("/settings/templates");
        } catch (e) {
            alert("שגיאה בשמירה");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AppShell><Loader2 className="animate-spin m-auto" /></AppShell>;
    if (!template) return <AppShell><div>לא נמצא</div></AppShell>;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-[#f8fafc] z-10 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">עריכת תבנית: {template.title}</h1>
                            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                שים לב: שינויים כאן ישפיעו על כל המערכת לצמיתות
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        שמור שינויים
                    </Button>
                </div>

                {/* חלק 1: מסמכים ואישורים (Requirements) */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <FileText className="w-5 h-5 text-blue-600" />
                            דרישות ומסמכים (צ'ק ליסט חייל)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {template.requirements.map((req, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 mt-2">
                                    {i + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">שם המסמך/דרישה</label>
                                        <Input
                                            value={req.title}
                                            onChange={(e) => updateReq(i, 'title', e.target.value)}
                                            className="font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">הסבר נוסף (אופציונלי)</label>
                                        <Input
                                            value={req.description || ""}
                                            onChange={(e) => updateReq(i, 'description', e.target.value)}
                                        />
                                    </div>

                                    {/* הגדרות מתקדמות בשורה אחת */}
                                    <div className="md:col-span-2 flex items-center gap-6 mt-2 bg-slate-50 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`req-${i}`}
                                                checked={req.required}
                                                onCheckedChange={(c) => updateReq(i, 'required', c)}
                                            />
                                            <label htmlFor={`req-${i}`} className="text-sm cursor-pointer">חובה להגיש</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`multi-${i}`}
                                                checked={req.allowMultiple}
                                                onCheckedChange={(c) => updateReq(i, 'allowMultiple', c)}
                                            />
                                            <label htmlFor={`multi-${i}`} className="text-sm cursor-pointer">אפשר ריבוי קבצים</label>
                                        </div>

                                        <div className="flex items-center gap-2 ml-auto">
                                            <span className="text-xs text-slate-500">סוג:</span>
                                            <select
                                                className="text-sm bg-transparent border border-slate-300 rounded px-2 py-1"
                                                value={req.type}
                                                onChange={(e) => updateReq(i, 'type', e.target.value)}
                                            >
                                                <option value="file">קובץ</option>
                                                <option value="boolean">כן/לא</option>
                                                <option value="text">טקסט</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteReq(i)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addReq} className="w-full border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-500">
                            <Plus className="w-4 h-4 mr-2" /> הוסף דרישה חדשה
                        </Button>
                    </CardContent>
                </Card>

                {/* חלק 2: תהליך עבודה (Workflow) */}
                <Card>
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <ListOrdered className="w-5 h-5 text-indigo-600" />
                            תהליך הטיפול (צ'ק ליסט מש"ק)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {template.workflow.map((step, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
                                    {step.order}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={step.title}
                                        onChange={(e) => updateStep(i, 'title', e.target.value)}
                                        className="font-bold border-0 border-b rounded-none focus:ring-0 px-0"
                                        placeholder="כותרת השלב"
                                    />
                                    <Input
                                        value={step.description}
                                        onChange={(e) => updateStep(i, 'description', e.target.value)}
                                        className="text-sm text-slate-500 border-0 focus:ring-0 px-0 h-8"
                                        placeholder="תיאור הפעולה הנדרשת..."
                                    />
                                </div>

                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteStep(i)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addStep} className="w-full border-dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500">
                            <Plus className="w-4 h-4 mr-2" /> הוסף שלב לטיפול
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </AppShell>
    );
}