"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { TashService } from "@/lib/tash-service";
import { RequestTemplate, Requirement, ProcessStep, COMMON_REQUIREMENTS, COMMON_MASHAK_ACTIONS, COMMON_SOLDIER_ACTIONS } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Save, Plus, Trash2, ArrowRight, FileText, ListOrdered, Loader2, AlertTriangle, Info, Copy
} from "lucide-react";

export default function EditTemplatePage() {
    const params = useParams();
    const router = useRouter();
    const [template, setTemplate] = useState<RequestTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isNewMode, setIsNewMode] = useState(false);

    // State for quick add dropdowns
    const [selectedReqIndex, setSelectedReqIndex] = useState<number>(0);
    const [selectedMashakAction, setSelectedMashakAction] = useState<string>("");
    const [selectedSoldierAction, setSelectedSoldierAction] = useState<string>("");

    useEffect(() => {
        async function load() {
            const id = params.id as string;

            if (id === 'new') {
                setIsNewMode(true);
                setTemplate({
                    id: "",
                    title: "",
                    category: "general",
                    shortDescription: "",
                    requirements: [],
                    workflow: [],
                    slaHours: 168,
                    lastUpdated: new Date().toISOString(),
                    eligibilityCriteria: [],
                    aiKeywords: [],
                    approvingAuthority: "",
                    requiresHomeVisit: false,
                    requiresDeclaration: false,
                    relatedBenefits: [],
                    soldierActions: [],
                    mashakActions: []
                });
                setLoading(false);
            } else {
                setIsNewMode(false);
                const data = await TashService.getTemplateById(id);
                setTemplate(data);
                setLoading(false);
            }
        }
        load();
    }, [params.id]);

    const updateMeta = (field: keyof RequestTemplate, value: any) => {
        if (!template) return;
        setTemplate({ ...template, [field]: value });
    };

    // --- דרישות (Requirements) ---
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
            id: `req_${Date.now()}`,
            title: "",
            description: "",
            type: "file",
            required: true,
            allowMultiple: false,
            assignedTo: 'soldier'
        };
        setTemplate({ ...template, requirements: [...template.requirements, newReq] });
    };

    // הוספת דרישה מהרשימה המוגדרת
    const addFromPredefinedReq = () => {
        if (!template) return;
        const predefined = COMMON_REQUIREMENTS[selectedReqIndex];
        const newReq: Requirement = {
            id: `req_${Date.now()}`,
            title: predefined.title,
            description: predefined.description || "",
            type: predefined.type,
            required: predefined.required ?? true,
            allowMultiple: false,
            assignedTo: 'soldier'
        };
        setTemplate({ ...template, requirements: [...template.requirements, newReq] });
    };

    // --- תהליך (Workflow) ---
    const updateStep = (index: number, field: keyof ProcessStep, value: any) => {
        if (!template) return;
        const newSteps = [...template.workflow];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setTemplate({ ...template, workflow: newSteps });
    };

    const deleteStep = (index: number) => {
        if (!template) return;
        const newSteps = template.workflow.filter((_, i) => i !== index);
        newSteps.forEach((s, i) => s.order = i + 1);
        setTemplate({ ...template, workflow: newSteps });
    };

    const addStep = () => {
        if (!template) return;
        const newStep: ProcessStep = {
            order: template.workflow.length + 1,
            title: "",
            description: "",
            isAutomated: false,
            responsible: 'mashak'
        };
        setTemplate({ ...template, workflow: [...template.workflow, newStep] });
    };

    // --- פעולות מש"ק ---
    const addMashakAction = (action?: string) => {
        if (!template) return;
        const actionText = action || selectedMashakAction;
        if (!actionText) return;
        setTemplate({
            ...template,
            mashakActions: [...(template.mashakActions || []), actionText]
        });
        setSelectedMashakAction("");
    };

    const deleteMashakAction = (index: number) => {
        if (!template) return;
        const newActions = [...(template.mashakActions || [])];
        newActions.splice(index, 1);
        setTemplate({ ...template, mashakActions: newActions });
    };

    // --- פעולות חייל ---
    const addSoldierAction = (action?: string) => {
        if (!template) return;
        const actionText = action || selectedSoldierAction;
        if (!actionText) return;
        setTemplate({
            ...template,
            soldierActions: [...(template.soldierActions || []), actionText]
        });
        setSelectedSoldierAction("");
    };

    const deleteSoldierAction = (index: number) => {
        if (!template) return;
        const newActions = [...(template.soldierActions || [])];
        newActions.splice(index, 1);
        setTemplate({ ...template, soldierActions: newActions });
    };

    // --- שמירה ---
    const handleSave = async () => {
        if (!template) return;

        if (!template.title || !template.id) {
            alert("חובה למלא שם תבנית ומזהה ייחודי (ID)");
            return;
        }

        setSaving(true);
        try {
            await TashService.upsertTemplate(template);
            alert("התבנית נשמרה בהצלחה!");
            router.push("/settings/templates");
        } catch (e) {
            alert("שגיאה בשמירה");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AppShell><div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div></AppShell>;
    if (!template) return <AppShell><div>שגיאה בטעינת הנתונים</div></AppShell>;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-20 px-2 md:px-0">

                {/* Header Sticky */}
                <div className="flex items-center justify-between sticky top-0 bg-[#f8fafc]/95 backdrop-blur z-20 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {isNewMode ? "יצירת תבנית חדשה" : `עריכת תבנית: ${template.title}`}
                            </h1>
                            {!isNewMode && (
                                <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    שינויים כאן ישפיעו על בקשות חדשות בלבד
                                </div>
                            )}
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-lg shadow-emerald-900/10">
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        שמור תבנית
                    </Button>
                </div>

                {/* חלק 0: הגדרות כלליות */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="w-5 h-5 text-blue-600" /> פרטים כלליים
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">שם התבנית (כותרת)</label>
                            <Input
                                value={template.title}
                                onChange={(e) => updateMeta('title', e.target.value)}
                                placeholder="לדוגמה: מענק בזק"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">מזהה מערכת (ID)</label>
                            <Input
                                value={template.id}
                                onChange={(e) => updateMeta('id', e.target.value)}
                                placeholder="eng_chars_only (e.g. bzack-grant)"
                                disabled={!isNewMode}
                                className={`bg-white font-mono text-sm ${!isNewMode && 'bg-slate-100 text-slate-500'}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">קטגוריה</label>
                            <Select
                                value={template.category}
                                onValueChange={(val) => updateMeta('category', val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="בחר קטגוריה" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tashmash">תשמ"ש</SelectItem>
                                    <SelectItem value="lone_soldier">חייל בודד</SelectItem>
                                    <SelectItem value="housing">דיור</SelectItem>
                                    <SelectItem value="helana">הלנות</SelectItem>
                                    <SelectItem value="hakash">הקלות</SelectItem>
                                    <SelectItem value="economic">כלכלי</SelectItem>
                                    <SelectItem value="leave">חופשות</SelectItem>
                                    <SelectItem value="or_population">אוכלוסיות אור</SelectItem>
                                    <SelectItem value="other">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">תיאור קצר</label>
                            <Input
                                value={template.shortDescription}
                                onChange={(e) => updateMeta('shortDescription', e.target.value)}
                                placeholder="מה מטרת הבקשה?"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">גורם מאשר</label>
                            <Input
                                value={template.approvingAuthority || ""}
                                onChange={(e) => updateMeta('approvingAuthority', e.target.value)}
                                placeholder="לדוגמה: סא״ל / רמ״ד פרט"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">זמן טיפול (שעות)</label>
                            <Input
                                type="number"
                                value={template.slaHours}
                                onChange={(e) => updateMeta('slaHours', parseInt(e.target.value) || 168)}
                                className="bg-white"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="home-visit"
                                    checked={template.requiresHomeVisit}
                                    onCheckedChange={(c) => updateMeta('requiresHomeVisit', c)}
                                />
                                <label htmlFor="home-visit" className="text-sm">דורש ביקור בית</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="declaration"
                                    checked={template.requiresDeclaration}
                                    onCheckedChange={(c) => updateMeta('requiresDeclaration', c)}
                                />
                                <label htmlFor="declaration" className="text-sm">דורש תצהיר</label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* חלק 0.5: קריטריונים ומילות מפתח */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-blue-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="w-5 h-5 text-blue-600" /> קריטריונים ומילות מפתח (ל-AI)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">קריטריונים לזכאות (מופרדים בפסיק)</label>
                            <Textarea
                                value={(template.eligibilityCriteria || []).join(', ')}
                                onChange={(e) => updateMeta('eligibilityCriteria', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="לדוגמה: הורים בחו״ל, מצוקה כלכלית, אין קרובים בארץ"
                                className="bg-white min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">מילות מפתח לזיהוי (מופרדות בפסיק)</label>
                            <Textarea
                                value={(template.aiKeywords || []).join(', ')}
                                onChange={(e) => updateMeta('aiKeywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="לדוגמה: עולה, חו״ל, הורים, בודד"
                                className="bg-white min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">הטבות נלוות (מופרדות בפסיק)</label>
                            <Input
                                value={(template.relatedBenefits || []).join(', ')}
                                onChange={(e) => updateMeta('relatedBenefits', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                placeholder="לדוגמה: שכ״ד, מענקים, טיסות"
                                className="bg-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* חלק 1: מסמכים ואישורים */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            דרישות ומסמכים ({template.requirements.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {/* הוספה מהירה מרשימה מוגדרת */}
                        <div className="flex gap-2 items-center bg-indigo-50 p-3 rounded-lg border-2 border-dashed border-indigo-300">
                            <select
                                className="flex-1 bg-white border border-indigo-300 rounded px-3 py-2 text-sm"
                                value={selectedReqIndex}
                                onChange={(e) => setSelectedReqIndex(parseInt(e.target.value))}
                            >
                                {COMMON_REQUIREMENTS.map((req, i) => (
                                    <option key={i} value={i}>{req.title} {req.description ? `(${req.description})` : ''}</option>
                                ))}
                            </select>
                            <Button onClick={addFromPredefinedReq} variant="default" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                                <Copy className="w-4 h-4" /> הוסף מהרשימה
                            </Button>
                        </div>

                        {template.requirements.map((req, i) => (
                            <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-colors">
                                <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 mt-2">
                                    {i + 1}
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">שם המסמך</label>
                                        <Input
                                            value={req.title}
                                            onChange={(e) => updateReq(i, 'title', e.target.value)}
                                            className="font-bold bg-slate-50/50 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">הסבר</label>
                                        <Input
                                            value={req.description || ""}
                                            onChange={(e) => updateReq(i, 'description', e.target.value)}
                                            className="bg-slate-50/50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex flex-wrap items-center gap-4 mt-2 bg-slate-50 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`req-${i}`}
                                                checked={req.required}
                                                onCheckedChange={(c) => updateReq(i, 'required', c)}
                                            />
                                            <label htmlFor={`req-${i}`} className="text-sm cursor-pointer">חובה</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`multi-${i}`}
                                                checked={req.allowMultiple}
                                                onCheckedChange={(c) => updateReq(i, 'allowMultiple', c)}
                                            />
                                            <label htmlFor={`multi-${i}`} className="text-sm cursor-pointer">ריבוי קבצים</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">סוג:</span>
                                            <select
                                                className="text-sm bg-white border border-slate-300 rounded px-2 py-1"
                                                value={req.type}
                                                onChange={(e) => updateReq(i, 'type', e.target.value)}
                                            >
                                                <option value="file">קובץ</option>
                                                <option value="boolean">כן/לא</option>
                                                <option value="text">טקסט</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 mr-auto">
                                            <span className="text-xs text-slate-500">מי מביא:</span>
                                            <select
                                                className="text-sm bg-white border border-slate-300 rounded px-2 py-1"
                                                value={req.assignedTo || 'soldier'}
                                                onChange={(e) => updateReq(i, 'assignedTo', e.target.value)}
                                            >
                                                <option value="soldier">החייל</option>
                                                <option value="mashak">המש״ק</option>
                                                <option value="commander">המפקד</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => deleteReq(i)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addReq} className="w-full border-dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500">
                            <Plus className="w-4 h-4 mr-2" /> הוסף מסמך/דרישה חדשה
                        </Button>
                    </CardContent>
                </Card>

                {/* חלק 1.5: פעולות מש"ק */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-emerald-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListOrdered className="w-5 h-5 text-emerald-600" />
                            פעולות מש"ק ({(template.mashakActions || []).length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {/* הוספה מהירה */}
                        <div className="flex gap-2 items-center bg-emerald-50 p-3 rounded-lg border-2 border-dashed border-emerald-300">
                            <select
                                className="flex-1 bg-white border border-emerald-300 rounded px-3 py-2 text-sm"
                                value={selectedMashakAction}
                                onChange={(e) => setSelectedMashakAction(e.target.value)}
                            >
                                <option value="">בחר פעולה...</option>
                                {COMMON_MASHAK_ACTIONS.map((action, i) => (
                                    <option key={i} value={action}>{action}</option>
                                ))}
                            </select>
                            <Button onClick={() => addMashakAction()} variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1" disabled={!selectedMashakAction}>
                                <Plus className="w-4 h-4" /> הוסף
                            </Button>
                        </div>

                        {(template.mashakActions || []).map((action, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-3 rounded-lg border border-slate-200 group">
                                <div className="bg-emerald-100 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700">
                                    {i + 1}
                                </div>
                                <span className="flex-1">{action}</span>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => deleteMashakAction(i)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* חלק 1.6: פעולות חייל */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-blue-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="w-5 h-5 text-blue-600" />
                            פעולות חייל ({(template.soldierActions || []).length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {/* הוספה מהירה */}
                        <div className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border-2 border-dashed border-blue-300">
                            <select
                                className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-sm"
                                value={selectedSoldierAction}
                                onChange={(e) => setSelectedSoldierAction(e.target.value)}
                            >
                                <option value="">בחר פעולה...</option>
                                {COMMON_SOLDIER_ACTIONS.map((action, i) => (
                                    <option key={i} value={action}>{action}</option>
                                ))}
                            </select>
                            <Button onClick={() => addSoldierAction()} variant="default" className="bg-blue-600 hover:bg-blue-700 gap-1" disabled={!selectedSoldierAction}>
                                <Plus className="w-4 h-4" /> הוסף
                            </Button>
                        </div>

                        {(template.soldierActions || []).map((action, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-3 rounded-lg border border-slate-200 group">
                                <div className="bg-blue-100 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                                    {i + 1}
                                </div>
                                <span className="flex-1">{action}</span>
                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={() => deleteSoldierAction(i)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* חלק 2: תהליך עבודה */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListOrdered className="w-5 h-5 text-emerald-600" />
                            תהליך הטיפול ({template.workflow.length} שלבים)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {template.workflow.map((step, i) => (
                            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-300 transition-colors">
                                <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                                    {step.order}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={step.title}
                                        onChange={(e) => updateStep(i, 'title', e.target.value)}
                                        className="font-bold border-0 border-b rounded-none focus:ring-0 px-0 focus:border-emerald-500"
                                        placeholder="כותרת השלב"
                                    />
                                    <Input
                                        value={step.description}
                                        onChange={(e) => updateStep(i, 'description', e.target.value)}
                                        className="text-sm text-slate-500 border-0 focus:ring-0 px-0 h-8"
                                        placeholder="תיאור הפעולה הנדרשת..."
                                    />
                                </div>

                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => deleteStep(i)}>
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addStep} className="w-full border-dashed border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500">
                            <Plus className="w-4 h-4 mr-2" /> הוסף שלב לטיפול
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </AppShell>
    );
}