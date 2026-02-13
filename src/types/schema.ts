// ============================================
// קובץ: src/types/schema.ts
// תוקן: שדות חדשים הם אופציונליים למניעת שגיאות build
// ============================================

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

export interface Requirement {
    id: string;
    title: string;
    description?: string;
    type: FieldType;
    required: boolean;
    validationRule?: string;
    allowMultiple?: boolean;
    assignedTo?: 'soldier' | 'mashak' | 'commander';
}

export interface ProcessStep {
    order: number;
    title: string;
    description: string;
    isAutomated: boolean;
    responsible?: 'soldier' | 'mashak' | 'commander' | 'system';
}

// ============================================
// ממשק תבנית בקשה - כל השדות החדשים אופציונליים
// ============================================
export interface RequestTemplate {
    id: string;
    title: string;
    category: string;
    shortDescription: string;

    // === שדות חדשים (אופציונליים לתאימות לאחור) ===
    eligibilityCriteria?: string[];
    aiKeywords?: string[];
    approvingAuthority?: string;
    requiresHomeVisit?: boolean;
    requiresDeclaration?: boolean;
    procedure30Days?: number;
    relatedBenefits?: string[];

    // === שדות קיימים ===
    requirements: Requirement[];
    workflow: ProcessStep[];
    soldierActions?: string[];
    mashakActions?: string[];
    slaHours: number;
    lastUpdated: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    isChecked: boolean;
    type: 'soldier_doc' | 'commander_action' | 'mashak_action';
    category?: 'document' | 'action';
}

export interface Soldier {
    id: string;
    personalId: string;
    fullName: string;
    unit?: string;
    phone?: string;
    notes?: string;
    isLoneSoldier?: boolean;
    loneSoldierType?: 'muvhak' | 'hame' | 'suid-help';
    isTashmash?: boolean;
    tashmashType?: 'parents' | 'married' | 'pregnancy' | 'married-child';
    isOrPopulation?: boolean;
    orType?: string;
    createdAt: any;
    updatedAt?: any;
}

export interface ConsultationCase {
    id: string;
    userId: string;
    soldierId: string;
    soldierName: string;
    soldierDescription: string;
    templateId: string;
    templateTitle: string;
    soldierChecklist: ChecklistItem[];
    commanderChecklist: ChecklistItem[];
    status: 'active' | 'completed' | 'archived';
    mashakChecklist?: ChecklistItem[];
    aiRecommendation?: string;
    matchedKeywords?: string[];
    createdAt: any;
    updatedAt: any;
}

// ============================================
// רשימת אישורים ופעולות נפוצים לבחירה מהירה
// ============================================
export const COMMON_REQUIREMENTS = [
    // === אישורים כלכליים ===
    { title: 'תדפיס עו"ש (3 חודשים)', type: 'file' as FieldType, description: 'תדפיס עובר ושב מלא' },
    { title: 'פירוט אשראי (3 חודשים)', type: 'file' as FieldType, description: 'פירוט עסקאות בכרטיסי אשראי' },
    { title: 'אישור ניהול חשבון', type: 'file' as FieldType, description: 'מהבנק' },
    { title: 'ריכוז יתרות', type: 'file' as FieldType, description: 'יתרות בכל החשבונות' },
    { title: 'אישור הכנסות מעבודה', type: 'file' as FieldType, description: 'מהמעסיק' },
    { title: 'תלושי שכר (3 חודשים)', type: 'file' as FieldType },
    { title: 'אישור על אי עבודה', type: 'file' as FieldType, description: 'מביטוח לאומי' },
    { title: 'אישור קצבה מביטוח לאומי', type: 'file' as FieldType },
    { title: 'אישור פנסיה', type: 'file' as FieldType },
    { title: 'אישור דמי אבטלה', type: 'file' as FieldType },
    { title: 'אישור הכנסות משכ"ד', type: 'file' as FieldType, description: 'מימ"ט או משכיראות' },
    { title: 'אישור הכנסות מהון', type: 'file' as FieldType },
    { title: 'אישור הכנסות ממלגה/לימודים', type: 'file' as FieldType },

    // === אישורים אישיים ===
    { title: 'צילום תעודת זהות', type: 'file' as FieldType },
    { title: 'צילום ת.ז + ספח', type: 'file' as FieldType, description: 'מעודכן' },
    { title: 'תעודת נישואין', type: 'file' as FieldType },
    { title: 'תעודת לידה', type: 'file' as FieldType },
    { title: 'תעודת עלייה', type: 'file' as FieldType },
    { title: 'דרכון', type: 'file' as FieldType },

    // === אישורים רפואיים ===
    { title: 'אישור רפואי', type: 'file' as FieldType },
    { title: 'אישור רופא', type: 'file' as FieldType },
    { title: 'אישור בית חולים', type: 'file' as FieldType },
    { title: 'סיכום מחלה', type: 'file' as FieldType },
    { title: 'אישור נכות', type: 'file' as FieldType, description: 'מביטוח לאומי' },

    // === אישורי דיור ===
    { title: 'חוזה שכירות', type: 'file' as FieldType },
    { title: 'חשבון ארנונה', type: 'file' as FieldType },
    { title: 'חשבון חשמל', type: 'file' as FieldType },
    { title: 'חשבון מים', type: 'file' as FieldType },
    { title: 'חשבון גז', type: 'file' as FieldType },
    { title: 'אישור בעלות על דירה', type: 'file' as FieldType },

    // === אישורי רכב ===
    { title: 'רישיון רכב', type: 'file' as FieldType },
    { title: 'אישור בעלות על רכב', type: 'file' as FieldType },
    { title: 'ביטוח רכב', type: 'file' as FieldType },

    // === הצהרות ===
    { title: 'הצהרת מהימנות', type: 'file' as FieldType, required: true },
    { title: 'הצהרה על הכנסות', type: 'file' as FieldType },
    { title: 'ויתור סודיות', type: 'file' as FieldType, description: 'להורים' },

    // === אישורי חוב ===
    { title: 'אישור חובות', type: 'file' as FieldType },
    { title: 'צו עיקול', type: 'file' as FieldType },
    { title: 'אישור הוצאה לפועל', type: 'file' as FieldType },
    { title: 'פסק דין', type: 'file' as FieldType },

    // === אישורים נוספים ===
    { title: 'אישור מפקד', type: 'file' as FieldType },
    { title: 'אישור יחידה', type: 'file' as FieldType },
    { title: 'מכתב אישי', type: 'file' as FieldType },
    { title: 'דו"ח עו"ס', type: 'file' as FieldType, description: 'מהרשות המקומית' },
    { title: 'דו"ח ביקור בית', type: 'file' as FieldType },
    { title: 'תצהיר עו"ד', type: 'file' as FieldType },
    { title: 'תמצית רישום משרד הפנים', type: 'file' as FieldType },
    { title: 'אישור ידועים בציבור', type: 'file' as FieldType }
];

// ============================================
// רשימת פעולות מש"ק נפוצות
// ============================================
export const COMMON_MASHAK_ACTIONS = [
    'פתיחת בקשה במערכת "אנשים"',
    'החתמת החייל על הצהרת מהימנות',
    'בדיקת שלמות המסמכים',
    'ראיון עם החייל',
    'ראיון עומק',
    'ביקור בית',
    'הזנת המלצה',
    'הזנת המלצה מפורטת',
    'שליחה לקצינת ת"ש',
    'שליחה למפקד היחידה',
    'שליחה לרמ"ד פרט',
    'תיאום עם עו"ס בקהילה',
    'הכנה לוועדה',
    'מעקב אחר אישור',
    'עדכון מערכות',
    'חישוב הכנסה לנפש',
    'בדיקת הכנסות מול תקרות',
    'הזנת פרטי חשבון בנק',
    'תיאום עם בית החייל',
    'תיאום עם האגודה למען החייל',
    'הפנייה למשרד הקליטה',
    'בדיקת זכאות',
    'אימות נתונים',
    'צילום מסמכים',
    'העברת מסמכים לגורמים מאשרים'
];

// ============================================
// רשימת פעולות חייל נפוצות
// ============================================
export const COMMON_SOLDIER_ACTIONS = [
    'להביא דפי חשבון בנק (3 חודשים)',
    'להביא תלושי שכר (3 חודשים)',
    'להביא תעודת זהות',
    'להביא תעודת זהות של הורים',
    'לחתום על הצהרת מהימנות',
    'להביא אישור רפואי',
    'להביא חוזה שכירות',
    'לקבל אישור מפקד',
    'לכתוב מכתב אישי',
    'להביא מכתב מההורים',
    'להביא אישורי חובות',
    'להביא תעודת נישואין',
    'להביא תעודת לידה',
    'להביא אישור עלייה',
    'להביא אישור קצבה מביטוח לאומי',
    'להשיג דו"ח עו"ס מהרשות',
    'להכין תצהירים משפטיים',
    'להביא דרכון',
    'להביא תמונת פספורט',
    'להביא אישור כתובת'
];

// ============================================
// קטגוריות זמינות
// ============================================
export const REQUEST_CATEGORIES = {
    tashmash: { name: 'תשמ"ש', icon: '💰' },
    lone_soldier: { name: 'חייל בודד', icon: '🧑‍✈️' },
    housing: { name: 'דיור', icon: '🏠' },
    helana: { name: 'הלנות', icon: '🌙' },
    hakash: { name: 'הקלות', icon: '📅' },
    economic: { name: 'כלכלי', icon: '💵' },
    leave: { name: 'חופשות', icon: '🏖️' },
    shortening: { name: 'קיצור שירות', icon: '⏱️' },
    or_population: { name: 'אוכלוסיות אור', icon: '⭐' },
    other: { name: 'אחר', icon: '📋' }
} as const;
