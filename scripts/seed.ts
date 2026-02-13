// ============================================
// קובץ: scripts/seed.ts
// גרסה: 2.0 - מכיל את כל האישורים הכלכליים המפורטים
// מבוסס על ספר ניהול משרד הת"ש + ספר התשמ"ש 2025
// ============================================

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// --- טיפוסים ---
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

export interface RequestTemplate {
    id: string;
    title: string;
    category: string;
    shortDescription: string;
    eligibilityCriteria: string[];
    aiKeywords: string[];
    approvingAuthority: string;
    requiresHomeVisit: boolean;
    requiresDeclaration: boolean;
    procedure30Days?: number;
    relatedBenefits?: string[];
    requirements: Requirement[];
    workflow: ProcessStep[];
    soldierActions?: string[];
    mashakActions?: string[];
    slaHours: number;
    lastUpdated: string;
}

// ==========================================
// רשימת אישורים כלכליים סטנדרטיים לתשמ"ש
// חשוב: as const לתיקון שגיאות TypeScript
// ==========================================
const ECONOMIC_DOCS_SOLDIER = [
    { id: 'bank_3m', title: 'תדפיס עו"ש (3 חודשים אחרונים)', description: 'עובר ושב מלא של כל החשבונות', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'credit_3m', title: 'פירוט אשראי (3 חודשים אחרונים)', description: 'פירוט עסקאות בכרטיסי אשראי', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'account_mgmt', title: 'אישור ניהול חשבון', description: 'מכל הבנקים', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'balance_sum', title: 'ריכוז יתרות', description: 'יתרות בכל החשבונות והפיקדונות', type: 'file' as const, required: true },
];

const ECONOMIC_DOCS_PARENTS = [
    { id: 'parents_bank_3m', title: 'תדפיס עו"ש של ההורים (3 חודשים)', description: 'עובר ושב מלא של כל חשבונות ההורים', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'parents_credit_3m', title: 'פירוט אשראי של ההורים (3 חודשים)', description: 'פירוט עסקאות בכרטיסי אשראי', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'parents_account_mgmt', title: 'אישור ניהול חשבון של ההורים', description: 'מכל הבנקים', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'parents_balance_sum', title: 'ריכוז יתרות של ההורים', description: 'יתרות בכל החשבונות והפיקדונות', type: 'file' as const, required: true },
    { id: 'parents_salary', title: 'תלושי שכר של ההורים (3 חודשים)', description: 'או אישור על אי עבודה מביטוח לאומי', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'parents_bituach', title: 'אישור קצבאות מביטוח לאומי', description: 'אם רלוונטי', type: 'file' as const, required: false, allowMultiple: true },
    { id: 'parents_pension', title: 'אישורי פנסיה של ההורים', description: 'אם רלוונטי', type: 'file' as const, required: false, allowMultiple: true },
    { id: 'parents_income_other', title: 'אישורי הכנסות נוספות של ההורים', description: 'שכ"ד, דמי אבטלה, הון וכו׳', type: 'file' as const, required: false, allowMultiple: true },
];

const ECONOMIC_DOCS_SPOUSE = [
    { id: 'spouse_bank_3m', title: 'תדפיס עו"ש של בן/בת הזוג (3 חודשים)', description: 'עובר ושב מלא', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'spouse_credit_3m', title: 'פירוט אשראי של בן/בת הזוג (3 חודשים)', description: 'פירוט עסקאות', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'spouse_salary', title: 'תלושי שכר של בן/בת הזוג (3 חודשים)', description: 'או אישור על אי עבודה', type: 'file' as const, required: true, allowMultiple: true },
    { id: 'spouse_bituach', title: 'אישור קצבאות של בן/בת הזוג', description: 'אם רלוונטי', type: 'file' as const, required: false, allowMultiple: true },
];

const INCOME_DECLARATION = {
    id: 'declaration',
    title: 'הצהרת מהימנות (חתומה)',
    description: 'טופס הצהרה על הכנסות ונכסים',
    type: 'file' as const,
    required: true
};

const CONFIDENTIALITY_WAIVER = {
    id: 'confidentiality',
    title: 'ויתור סודיות',
    description: 'חתום ע"י ההורים/בן הזוג',
    type: 'file' as const,
    required: true
};

// מאגר התבניות המלא - מבוסס על ספר ניהול משרד הת"ש + ספר התשמ"ש
// ==========================================
const DATA_TO_UPLOAD: RequestTemplate[] = [

    // ==========================================
    // קטגוריה: תשמ"ש (תשלומי משפחה)
    // ==========================================
    {
        id: "tashmash-parents",
        title: 'תשמ"ש הורים',
        category: "tashmash",
        shortDescription: 'סיוע חודשי לחייל שהוריו נמצאים במצוקה כלכלית.',
        eligibilityCriteria: [
            'הורי החייל נמצאים במצוקה כלכלית',
            'הכנסת המשפחה נמוכה מסף הזכאות',
            'החייל אינו נשוי/ידוע בציבור',
            'ההורים אינם בעלי נכסים משמעותיים'
        ],
        aiKeywords: ['הורים', 'כלכלי', 'מצוקה', 'חובות', 'מינוס', 'אין כסף', 'הכנסה נמוכה', 'עוני', 'סיוע להורים', 'תשמ"ש הורים'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: true,
        procedure30Days: 30,
        relatedBenefits: ['מענק בזק', 'תווי קנייה', 'הלוואה', 'הלנה'],
        requirements: [
            INCOME_DECLARATION,
            CONFIDENTIALITY_WAIVER,
            { id: 'parents_id', title: 'צילום תעודות זהות של ההורים + ספח', description: 'כולל פירוט כל האחים והאחיות', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'parents_marriage', title: 'תעודת נישואין של ההורים', description: 'או אישור על מצב משפחתי', type: 'file', required: true, assignedTo: 'soldier' },
            ...ECONOMIC_DOCS_PARENTS.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'vehicle', title: 'אישור בעלות על רכב', description: 'אם קיים רכב בבעלות ההורים', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'property', title: 'אישור בעלות על נדל"ן', description: 'אם קיים נכס בבעלות ההורים (מלבד דירת מגורים)', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'debts', title: 'אישורי חובות', description: 'מכתבי דרישה, הוצאה לפועל, עיקולים', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'החתמת החייל על הצהרת מהימנות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'קבלת ויתור סודיות חתום מההורים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת שלמות כל המסמכים', description: 'כולל כל האישורים הכלכליים', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'חישוב הכנסה לנפש מול תקרות תשמ"ש', description: '', isAutomated: true, responsible: 'system' },
            { order: 6, title: 'בדיקת נכסים ורכוש', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 7, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 8, title: 'מעקב אחר אישור קצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תעודות זהות של ההורים + ספח (עם פירוט אחים)',
            'להביא תעודת נישואין של ההורים',
            'להביא תדפיס עו"ש של ההורים (3 חודשים)',
            'להביא פירוט אשראי של ההורים (3 חודשים)',
            'להביא אישור ניהול חשבון של ההורים',
            'להביא ריכוז יתרות של ההורים',
            'להביא תלושי שכר של ההורים (3 חודשים)',
            'להביא אישור קצבאות מביטוח לאומי (אם רלוונטי)',
            'להביא אישורי פנסיה (אם רלוונטי)',
            'להשיג ויתור סודיות חתום מההורים',
            'לחתום על הצהרת מהימנות',
            'להביא אישור רכב (אם קיים)',
            'להביא אישור נכסים (אם קיים)'
        ],
        mashakActions: [
            'לפתוח בקשה במערכת "אנשים"',
            'להחתים את החייל על הצהרה',
            'לקבל ויתור סודיות מההורים',
            'לבדוק שלמות כל המסמכים הכלכליים',
            'לחשב הכנסה לנפש',
            'לבדוק נכסים ורכוש',
            'להזין המלצה',
            'לעקוב אחר אישור קצינת ת"ש'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "tashmash-married",
        title: 'תשמ"ש נשוי (ללא ילדים)',
        category: "tashmash",
        shortDescription: 'סיוע לחייל נשוי המתגורר עם בן/בת זוגו.',
        eligibilityCriteria: [
            'החייל נשוי או ידוע בציבור',
            'הזוג מתגורר יחד',
            'אין ילדים משותפים',
            'הכנסת בן/בת הזוג נמוכה מהתקרה'
        ],
        aiKeywords: ['נשוי', 'ידוע בציבור', 'אישה', 'בעל', 'זוג', 'מתגורר עם', 'חתונה', 'תשמ"ש נשוי'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: true,
        procedure30Days: 30,
        relatedBenefits: ['הלנה', 'שכ"ד', 'הוצאות אחזקה'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'marriage_cert', title: 'תעודת נישואין / אישור ידועים בציבור', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'ids', title: 'צילום ת.ז של בני הזוג + ספחים', description: 'סטטוס נשוי מעודכן', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'rent_contract', title: 'חוזה שכירות על שם בני הזוג', description: 'בתוקף, חתום ע"י שניהם', type: 'file', required: true, assignedTo: 'soldier' },
            ...ECONOMIC_DOCS_SPOUSE.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'joint_bank_3m', title: 'דפי חשבון בנק משותפים (3 חודשים)', description: 'אם קיים חשבון משותף', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'החתמת החייל ובן/בת הזוג על הצהרה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת שלמות מסמכים', description: 'כולל כל האישורים הכלכליים', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'חישוב הכנסה לנפש', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תעודת נישואין',
            'להביא ת.ז מעודכנת (סטטוס נשוי) של שני בני הזוג',
            'להביא חוזה שכירות על שם שניהם',
            'להביא תדפיס עו"ש של בן/בת הזוג (3 חודשים)',
            'להביא פירוט אשראי של בן/בת הזוג (3 חודשים)',
            'להביא תלושי שכר של בן/בת הזוג',
            'לחתום על הצהרת מהימנות'
        ],
        mashakActions: [
            'לפתוח בקשה במערכת',
            'להחתים את בני הזוג על הצהרה',
            'לבדוק שלמות מסמכים כלכליים',
            'לחשב הכנסה לנפש',
            'להזין המלצה'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "tashmash-pregnancy",
        title: 'תשמ"ש הריון (שבוע 14+)',
        category: "tashmash",
        shortDescription: 'הכרה לצורך מענק לידה וציוד.',
        eligibilityCriteria: [
            'החיילת בהריון שבוע 14 ומעלה',
            'אישור רפואי המציין את שבוע ההריון ותאריך לידה משוער'
        ],
        aiKeywords: ['הריון', 'בהריון', 'בן', 'ילד', 'תינוק', 'לידה', 'בטן', 'נשים', 'חיילת', 'תשמ"ש הריון'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: true,
        procedure30Days: 30,
        relatedBenefits: ['שמירת הריון', 'חופשת לידה', 'תקופת הורות'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'pregnancy_cert', title: 'אישור רפואי על הריון', description: 'חובה לציין: שבוע הריון, תאריך לידה משוער, חתימת רופא וחותמת', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'husband_id', title: 'צילום ת.ז של הבעל', description: 'אם נשואה', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'marriage_cert', title: 'תעודת נישואין', description: 'אם נשואה', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת שבוע 14+ באישור', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'עדכון מערכות לקראת לידה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור רפואי עם שבוע הריון ותאריך לידה משוער',
            'לחתום על הצהרת מהימנות'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לבדוק שבוע 14+',
            'להזין המלצה',
            'לעדכן מערכות'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "tashmash-married-child",
        title: 'תשמ"ש נשוי + ילד',
        category: "tashmash",
        shortDescription: 'סיוע לחייל נשוי עם ילד אחד לפחות.',
        eligibilityCriteria: [
            'החייל נשוי/ידוע בציבור',
            'יש לזוג ילד אחד לפחות',
            'הכנסת המשפחה נמוכה מהתקרה'
        ],
        aiKeywords: ['נשוי', 'ילד', 'ילדים', 'תינוק', 'בן', 'בת', 'אבא', 'אמא', 'משפחה', 'תשמ"ש נשוי ילד'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: true,
        procedure30Days: 30,
        relatedBenefits: ['הלנה', 'שכ"ד', 'דמי כלכלה', 'הוצאות אחזקה'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'marriage_cert', title: 'תעודת נישואין', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'child_birth_cert', title: 'תעודת לידה של הילד/ים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'ids', title: 'ת.ז של כל בני המשפחה + ספחים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'rent_contract', title: 'חוזה שכירות', description: 'על שם בני הזוג', type: 'file', required: true, assignedTo: 'soldier' },
            ...ECONOMIC_DOCS_SPOUSE.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'joint_bank_3m', title: 'דפי חשבון בנק משותפים (3 חודשים)', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'child_allowance', title: 'אישור קצבת ילדים', description: 'מביטוח לאומי', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת מסמכים', description: 'כולל כל האישורים הכלכליים', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'חישוב הכנסה לנפש', description: 'כולל קצבת ילדים', isAutomated: true, responsible: 'system' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תעודת נישואין',
            'להביא תעודות לידה של הילדים',
            'להביא חוזה שכירות',
            'להביא אישורי הכנסה של בן/בת הזוג',
            'להביא תדפיס עו"ש ופירוט אשראי של בן/בת הזוג',
            'להביא אישור קצבת ילדים (אם רלוונטי)'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לבדוק מסמכים כלכליים',
            'לחשב הכנסה לנפש',
            'להזין המלצה'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: חייל בודד
    // ==========================================
    {
        id: "lone-soldier-muvhak",
        title: 'חייל בודד מובהק',
        category: "lone_soldier",
        shortDescription: 'הכרה כבודד מובהק - הורים מתגוררים בחו"ל.',
        eligibilityCriteria: [
            'הורי החייל מתגוררים דרך קבע בחו"ל',
            'החייל עלה לארץ לבדו או עם משפחתו',
            'אין קרובי משפחה מדרגה ראשונה בארץ שיכולים לתמוך'
        ],
        aiKeywords: ['עולה', 'חו"ל', 'הורים בחו"ל', 'ארה"ב', 'אירופה', 'בדד', 'לבד', 'משפחה בחו"ל', 'לא נמצאים בארץ', 'בודד מובהק'],
        approvingAuthority: 'רמ"ד פרט (מפקדה)',
        requiresHomeVisit: true,
        requiresDeclaration: true,
        procedure30Days: 60,
        relatedBenefits: ['מימון טיסות', 'שכ"ד', 'מענקים', 'בית חייל', 'הלנה'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'passport_entries', title: 'תמצית רישום כניסות ויציאות', description: 'של ההורים והחייל ממשרד הפנים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'passport', title: 'דרכון החייל', description: 'עם חותמות כניסה/יציאה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'parents_passport', title: 'דרכוני ההורים', description: 'עם חותמות', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'parents_abroad_proof', title: 'אישור עבודה/מגורים של ההורים בחו"ל', description: 'חוזה שכירות, אישור מעסיק, חשבונות חשמל/מים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'parents_letter', title: 'מכתב מההורים', description: 'הסבר על מצבם והיעדרם מהארץ, חתום ומתורגם', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'personal_letter', title: 'מכתב אישי של החייל', description: 'תיאור המצב והקשר עם המשפחה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'aliyah_cert', title: 'אישור עלייה', description: 'אם רלוונטי', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', description: 'מהמש"קית', type: 'file', required: true, assignedTo: 'mashak' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עומק עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית (חובה)', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת כניסות/יציאות', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'אימות מגורי הורים בחו"ל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 7, title: 'שליחה לרמ"ד פרט לאישור', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תמצית רישום כניסות/יציאות (משרד הפנים)',
            'להביא דרכון עם חותמות',
            'להביא דרכוני הורים',
            'להביא אישורים על מגורי ההורים בחו"ל',
            'לכתוב מכתב אישי',
            'להביא מכתב מההורים (חתום ומתורגם)',
            'לחתום על הצהרת מהימנות'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לערוך ראיון עומק',
            'לבצע ביקור בית (חובה)',
            'לבדוק כניסות/יציאות',
            'לאמת מגורי הורים בחו"ל',
            'להזין המלצה',
            'לשלוח לרמ"ד פרט'
        ],
        slaHours: 504,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "lone-soldier-hame",
        title: 'חייל בודד חע"מ (חסר עורף משפחתי)',
        category: "lone_soldier",
        shortDescription: 'הכרה כבודד חסר עורף משפחתי - אין קשר עם ההורים.',
        eligibilityCriteria: [
            'לחייל הורים בארץ',
            'אין קשר עם ההורים או קשר מינימלי',
            'ההורים אינם תומכים כלכלית/רגשית',
            'המצב מוכח ע"י גורמים מקצועיים'
        ],
        aiKeywords: ['אין קשר עם הורים', 'נתק', 'ריחוק', 'בעיות בבית', 'משפחה לא תומכת', 'אלימות במשפחה', 'עזבתי הבית', 'לא מדבר עם הורים', 'חע"מ'],
        approvingAuthority: 'וועדת בודדים פיקודית/חילית',
        requiresHomeVisit: true,
        requiresDeclaration: true,
        procedure30Days: 60,
        relatedBenefits: ['שכ"ד', 'מענקים', 'בית חייל', 'הלנה'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'social_worker_report', title: 'דו"ח עו"ס מהרשות המקומית', description: 'המעיד על הנתק/מצב משפחתי', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'affidavit_soldier', title: 'תצהיר עו"ד של החייל', description: 'מפורט, חתום על ידי עורך דין', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'affidavit_witness1', title: 'תצהיר עד 1', description: 'אדם המכיר את המצב המשפחתי', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'affidavit_witness2', title: 'תצהיר עד 2', description: 'אדם נוסף המכיר את המצב', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'personal_letter', title: 'מכתב אישי מפורט', description: 'תיאור השתלשלות האירועים, תאריכים, פרטים', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'bank_check', title: 'דפי חשבון בנק (6 חודשים)', description: 'לשלילת העברות מההורים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'parents_id', title: 'צילום ת.ז הורים', description: 'לאימות זהות', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', description: 'מהמש"קית', type: 'file', required: true, assignedTo: 'mashak' },
            { id: 'mashak_report', title: 'דו"ח מש"קית מפורט', description: 'המלצה ותיאור המקרה', type: 'file', required: true, assignedTo: 'mashak' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עומק מקיף', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית (חובה)', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'תיאום עם עו"ס בקהילה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'בדיקת חשבונות בנק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'הזנת המלצה מפורטת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 7, title: 'הכנה לוועדת בודדים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 8, title: 'ליווי החייל לוועדה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להשיג דו"ח עו"ס מהרשות המקומית',
            'להכין תצהיר עו"ד מפורט',
            'להשיג תצהירים מ-2 עדים',
            'לכתוב מכתב אישי מפורט עם תאריכים',
            'להביא דפי חשבון בנק (6 חודשים)'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לערוך ראיון עומק מקיף',
            'לבצע ביקור בית (חובה)',
            'לתאם עם עו"ס בקהילה',
            'לבדוק חשבונות בנק',
            'להזין המלצה מפורטת',
            'להכין לוועדת בודדים',
            'ללוות לוועדה'
        ],
        slaHours: 720,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "suid-help",
        title: 'זכאי סיוע',
        category: "lone_soldier",
        shortDescription: 'חייל במערכת יחסים מורכבת עם הוריו - קשר חלקי.',
        eligibilityCriteria: [
            'לחייל הורים בארץ',
            'קיים קשר חלקי עם ההורים',
            'ההורים מהווים תא משפחתי תומך באופן חלקי',
            'אינו עומד בקריטריונים לחע"מ'
        ],
        aiKeywords: ['זכאי סיוע', 'קשר חלקי', 'תמיכה חלקית', 'קשר מורכב', 'משפחה לא מלאה'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: true,
        requiresDeclaration: true,
        procedure30Days: 30,
        relatedBenefits: ['שכ"ד חלקי', 'תווי קנייה'],
        requirements: [
            INCOME_DECLARATION,
            { id: 'parents_id', title: 'ת.ז של הורים + ספח', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            ...ECONOMIC_DOCS_PARENTS.slice(0, 4).map(d => ({ ...d, id: d.id + '_partial', title: d.title, required: false, assignedTo: 'soldier' as const })),
            { id: 'support_letter', title: 'מכתב המתאר את הקשר המשפחתי', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', type: 'file', required: true, assignedTo: 'mashak' },
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת הכנסות הורים', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא ת.ז של ההורים',
            'להביא אישורים כלכליים של ההורים',
            'לכתוב מכתב על הקשר המשפחתי'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לראיין את החייל',
            'לבצע ביקור בית',
            'לבדוק הכנסות הורים',
            'להזין המלצה'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: דיור
    // ==========================================
    {
        id: "rent-participation",
        title: 'השתתפות בשכ"ד',
        category: "housing",
        shortDescription: 'סיוע במימון שכר דירה לחיילים בודדים וזכאי סיוע.',
        eligibilityCriteria: [
            'חייל בודד מובהק או חע"מ או זכאי סיוע',
            'שוכר דירה באופן פרטי',
            'חוזה שכירות על שמו'
        ],
        aiKeywords: ['שכר דירה', 'דירה', 'שכ"ד', 'שוכר', 'מגורים', 'הוצאה על דירה', 'בעל הבית', 'השתתפות בשכר'],
        approvingAuthority: 'קצינת ת"ש יחידה / מדור מיעוטים',
        requiresHomeVisit: true,
        requiresDeclaration: false,
        procedure30Days: 30,
        relatedBenefits: ['הוצאות אחזקה'],
        requirements: [
            { id: 'rent_contract', title: 'חוזה שכירות מקורי', description: 'חתום ע"י החייל ובעל הדירה, תקף לשנה לפחות', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'landlord_id', title: 'צילום ת.ז של בעל הדירה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'landlord_bank', title: 'פרטי חשבון בנק של בעל הדירה', description: 'להעברת התשלום', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'bank_ownership', title: 'אישור בעלות על חשבון הבנק של החייל', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'arnona', title: 'חשבון ארנונה', description: 'על שם בעל הדירה', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'electric', title: 'חשבון חשמל', description: 'על שם החייל', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'lone_soldier_cert', title: 'אישור חייל בודד', description: 'אם קיים', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', type: 'file', required: true, assignedTo: 'mashak' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת חוזה השכירות', description: 'וידוא תוקף, שמות, סכום', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת פרטי בעל הדירה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'חישוב גובה הסיוע', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת פרטי חשבון בנק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא חוזה שכירות מקורי (תקף שנה לפחות)',
            'להביא ת.ז של בעל הדירה',
            'להביא פרטי חשבון בנק של בעל הדירה',
            'להביא אישור בעלות על חשבון הבנק שלי',
            'להביא חשבון ארנונה',
            'להביא חשבון חשמל על שמי'
        ],
        mashakActions: [
            'לבדוק את החוזה',
            'לאמת פרטי בעל הדירה',
            'לבצע ביקור בית',
            'לחשב גובה הסיוע',
            'להזין פרטי חשבון',
            'להזין המלצה'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "beit-hachayel",
        title: 'בית החייל',
        category: "housing",
        shortDescription: 'פתרון לינה בבית החייל לחיילים זקוקים.',
        eligibilityCriteria: [
            'חייל בודד / זכאי סיוע / נשוי',
            'זקוק לפתרון לינה',
            'אין פתרון דיור אחר'
        ],
        aiKeywords: ['בית חייל', 'לינה', 'לישון', 'איפה לישון', 'מקום לינה', 'חדר'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: 'commander_approval', title: 'אישור מפקד', description: 'המלצה על הצורך בפתרון', type: 'file', required: true, assignedTo: 'commander' },
            { id: 'photo', title: 'תמונת פספורט', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'lone_cert', title: 'אישור חייל בודד', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת זכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת מקום פנוי', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'תיאום עם בית החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הנפקת הפנייה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור מפקד',
            'להביא תמונת פספורט'
        ],
        mashakActions: [
            'לבדוק זכאות',
            'לבדוק מקום פנוי',
            'לתאם עם בית החייל',
            'להנפיק הפנייה'
        ],
        slaHours: 48,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "maintenance-expenses",
        title: 'הוצאות אחזקת דירה',
        category: "housing",
        shortDescription: 'השתתפות בהוצאות אחזקה עבור חייל בודד או נשוי.',
        eligibilityCriteria: [
            'חייל בודד מובהק / חע"מ',
            'או חייל נשוי + ילד',
            'מתגורר בדירה שכורה'
        ],
        aiKeywords: ['חשמל', 'מים', 'גז', 'ארנונה', 'הוצאות דירה', 'חשבונות', 'תשלומים', 'אחזקה'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 30,
        requirements: [
            { id: 'rent_contract', title: 'חוזה שכירות', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'electric_bills', title: 'חשבונות חשמל (3 חודשים)', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'water_bills', title: 'חשבונות מים (3 חודשים)', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'gas_bills', title: 'חשבונות גז (אם רלוונטי)', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'internet_bills', title: 'חשבונות אינטרנט', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'arnona', title: 'חשבון ארנונה', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת חשבונות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'חישוב גובה הסיוע', description: '', isAutomated: true, responsible: 'system' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא חוזה שכירות',
            'להביא חשבונות חשמל (3 חודשים)',
            'להביא חשבונות מים (3 חודשים)',
            'להביא חשבונות גז (אם רלוונטי)'
        ],
        mashakActions: [
            'לבדוק חשבונות',
            'לחשב גובה הסיוע',
            'להזין המלצה'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: הלנות
    // ==========================================
    {
        id: "helana-part",
        title: 'הלנה מטעמי פרט',
        category: "helana",
        shortDescription: 'לינה בבית הפרטי של החייל מסיבות סוציאליות/אישיות.',
        eligibilityCriteria: [
            'נסיבות סוציאליות המצדיקות הלנה',
            'אישור מפקד',
            'ביקור בית עדכני'
        ],
        aiKeywords: ['לישון בבית', 'הלנה', 'לינה', 'לילות', 'לילה', 'אני רוצה לישון בבית', 'לחזור הביתה', 'הלנה מטעמי פרט'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: true,
        requiresDeclaration: true,
        procedure30Days: 14,
        requirements: [
            INCOME_DECLARATION,
            { id: 'home_visit', title: 'דו"ח ביקור בית', type: 'file', required: true, assignedTo: 'mashak' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
            { id: 'personal_letter', title: 'מכתב הסבר מהחייל', description: 'מדוע נדרשת ההלנה', type: 'file', required: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'ראיון עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'החתמת מפקד', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'שליחה לקצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'לכתוב מכתב הסבר',
            'לחתום על הצהרת מהימנות',
            'לקבל אישור מפקד'
        ],
        mashakActions: [
            'לראיין את החייל',
            'לבצע ביקור בית',
            'להזין המלצה',
            'להחתים מפקד',
            'לשלוח לקצינת ת"ש'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "helana-distance",
        title: 'הלנה מטעמי מרחק',
        category: "helana",
        shortDescription: 'לינה בבית עקב מרחק גיאוגרפי.',
        eligibilityCriteria: [
            'מקום המגורים רחוק מהיחידה',
            'מעל 60 דקות נסיעה',
            'הפחתת נסיעות'
        ],
        aiKeywords: ['מרחק', 'רחוק', 'נסיעה ארוכה', 'שעות על הכביש', 'גוש דן', 'דרום', 'צפון', 'קיבוץ', 'מושב', 'הלנה מרחק'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: 'address_proof', title: 'אישור כתובת', description: 'ת.ז עם כתובת מעודכנת', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'waze_screenshot', title: 'צילום מסך וויז', description: 'זמן נסיעה', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת כתובת ומרחק', description: '', isAutomated: true, responsible: 'system' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'אישור קצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור כתובת מעודכן',
            'לצלם מסך וויז עם זמן נסיעה'
        ],
        mashakActions: [
            'לבדוק כתובת ומרחק',
            'להזין המלצה',
            'לקבל אישור קצינת ת"ש'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: הקלות
    // ==========================================
    {
        id: "hakash-1",
        title: 'הת"ש 1',
        category: "hakash",
        shortDescription: 'לינה בבית לילה אחד בשבוע.',
        eligibilityCriteria: [
            'זכאות מוכחת',
            'סיבה סוציאלית/אישית',
            'אישור מפקד'
        ],
        aiKeywords: ['הת"ש', 'לילה אחד', 'לישון בבית', 'התש 1', 'הקלה'],
        approvingAuthority: 'מפקד יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: 'request_form', title: 'טופס בקשה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
        ],
        workflow: [
            { order: 1, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת הזכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'למלא טופס בקשה',
            'לקבל אישור מפקד'
        ],
        mashakActions: [
            'לראיין את החייל',
            'לבדוק זכאות',
            'להזין המלצה'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "hakash-2",
        title: 'הת"ש 2',
        category: "hakash",
        shortDescription: 'לינה בבית 2 לילות בשבוע.',
        eligibilityCriteria: [
            'מצב סוציאלי מורכב',
            'אישור קצינת ת"ש',
            'ביקור בית'
        ],
        aiKeywords: ['הת"ש 2', 'שני לילות', 'לישון פעמיים', 'התש 2'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: true,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: 'request_form', title: 'טופס בקשה מפורט', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', type: 'file', required: true, assignedTo: 'mashak' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
        ],
        workflow: [
            { order: 1, title: 'ראיון עומק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה מפורטת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'שליחה לקצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'למלא טופס בקשה מפורט',
            'לקבל אישור מפקד'
        ],
        mashakActions: [
            'לערוך ראיון עומק',
            'לבצע ביקור בית',
            'להזין המלצה מפורטת',
            'לשלוח לקצינת ת"ש'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "hakash-3",
        title: 'הת"ש 3',
        category: "hakash",
        shortDescription: 'לינה בבית 3 לילות בשבוע.',
        eligibilityCriteria: [
            'מצב סוציאלי קשה',
            'אישור רמ"ד פרט',
            'ביקור בית',
            'בד"כ אוכלוסיות מיוחדות'
        ],
        aiKeywords: ['הת"ש 3', 'שלושה לילות', 'מצב קשה', 'משפחה מורכבת', 'התש 3'],
        approvingAuthority: 'רמ"ד פרט (מפקדה)',
        requiresHomeVisit: true,
        requiresDeclaration: false,
        procedure30Days: 30,
        requirements: [
            { id: 'request_form', title: 'טופס בקשה מפורט', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'home_visit', title: 'דו"ח ביקור בית', type: 'file', required: true, assignedTo: 'mashak' },
            { id: 'social_report', title: 'דו"ח סוציאלי', type: 'file', required: true, assignedTo: 'mashak' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
        ],
        workflow: [
            { order: 1, title: 'ראיון עומק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'תיאום עם עו"ס', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'שליחה לרמ"ד פרט', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'למלא טופס בקשה מפורט'
        ],
        mashakActions: [
            'לערוך ראיון עומק',
            'לבצע ביקור בית',
            'לתאם עם עו"ס',
            'להזין המלצה',
            'לשלוח לרמ"ד פרט'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: כלכלי
    // ==========================================
    {
        id: "work-permit",
        title: 'אישור עבודה פרטית',
        category: "economic",
        shortDescription: 'היתר לעבוד בשעות הפנויות.',
        eligibilityCriteria: [
            'צורך כלכלי מוכח',
            'העבודה לא תפגע בשירות',
            'אישור מפקד'
        ],
        aiKeywords: ['עבודה', 'לעבוד', 'כסף', 'משרה', 'השלמת הכנסה', 'מינוס בבנק', 'חובות', 'אישור עבודה'],
        approvingAuthority: 'מפקד היחידה (סא"ל)',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            ...ECONOMIC_DOCS_SOLDIER.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'debts', title: 'אישורי חובות', description: 'מכתבי דרישה, הוצאה לפועל', type: 'file', required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'commander_approval', title: 'אישור מפקד ישיר', type: 'file', required: true, assignedTo: 'commander' },
            { id: 'employer_letter', title: 'מכתב מהמעסיק', description: 'תנאי העסקה, שעות', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת הצורך הכלכלי', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת השפעה על השירות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'שליחה למפקד היחידה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תדפיס עו"ש (3 חודשים)',
            'להביא פירוט אשראי (3 חודשים)',
            'להביא אישור ניהול חשבון',
            'להביא ריכוז יתרות',
            'להביא מכתב מהמעסיק',
            'לקבל אישור מפקד'
        ],
        mashakActions: [
            'לבדוק את הצורך הכלכלי',
            'לבדוק השפעה על השירות',
            'להזין המלצה',
            'לשלוח למפקד היחידה'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "bzack-grant",
        title: 'מענק בזק',
        category: "economic",
        shortDescription: 'סיוע כספי מיידי למצוקה חריפה.',
        eligibilityCriteria: [
            'מצוקה כלכלית חריפה ומיידית',
            'אין יכולת התמודדות',
            'אישור קצינת ת"ש'
        ],
        aiKeywords: ['מענק', 'כסף מיידי', 'חובות', 'עיקול', 'הוצאה לפועל', 'ניתוק חשמל', 'אין אוכל', 'מצוקה', 'חירום', 'בזק'],
        approvingAuthority: 'מפקד היחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        requirements: [
            ...ECONOMIC_DOCS_SOLDIER.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'debts', title: 'אישורי חובות/עיקולים', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'execution', title: 'אישור הוצאה לפועל', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'social_report', title: 'דו"ח מש"קית', type: 'file', required: true, assignedTo: 'mashak' },
        ],
        workflow: [
            { order: 1, title: 'ראיון דחוף', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת המצוקה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת אישורים כלכליים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הזנת המלצה דחופה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'אישור מפקד', description: '', isAutomated: false, responsible: 'commander' },
        ],
        soldierActions: [
            'להביא תדפיס עו"ש (3 חודשים)',
            'להביא פירוט אשראי (3 חודשים)',
            'להביא אישור ניהול חשבון',
            'להביא ריכוז יתרות',
            'להביא אישורי חובות/עיקולים'
        ],
        mashakActions: [
            'לערוך ראיון דחוף',
            'לבדוק את המצוקה',
            'לבדוק אישורים כלכליים',
            'לכתוב דו"ח',
            'להזין המלצה דחופה',
            'לקבל אישור מפקד'
        ],
        slaHours: 24,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "vouchers",
        title: 'תווי קנייה',
        category: "economic",
        shortDescription: 'שוברים לקניית מזון וציוד בסיסי.',
        eligibilityCriteria: [
            'מצוקה כלכלית',
            'חייל בודד / זכאי סיוע / תשמ"ש',
            'אישור קצינת ת"ש'
        ],
        aiKeywords: ['תווים', 'שוברים', 'קניות', 'אוכל', 'סופר', 'מזון', 'תו קנייה', 'שובר'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        requirements: [
            { id: 'request', title: 'בקשה בכתב', type: 'text', required: true, assignedTo: 'soldier' },
            { id: 'bank_1m', title: 'דפי חשבון בנק (חודש אחרון)', type: 'file', required: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת הזכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'לכתוב בקשה',
            'להביא דף חשבון בנק (חודש אחרון)'
        ],
        mashakActions: [
            'לבדוק זכאות',
            'להזין המלצה'
        ],
        slaHours: 48,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "loan-immediate",
        title: 'הלוואה מידית',
        category: "economic",
        shortDescription: 'הלוואה עד 5,000 ש"ח לתקופה קצרה.',
        eligibilityCriteria: [
            'צורך כלכלי מוכח',
            'יכולת החזר',
            'אישור מפקד'
        ],
        aiKeywords: ['הלוואה', 'לווה', 'כסף', 'חוב', 'מימון', 'הלוואה מידית'],
        approvingAuthority: 'מפקד היחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            ...ECONOMIC_DOCS_SOLDIER.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'purpose', title: 'הסבר על מטרת ההלוואה', type: 'text', required: true, assignedTo: 'soldier' },
            { id: 'repayment_plan', title: 'תכנית החזר', type: 'text', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת הצורך', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת יכולת החזר', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא דפי בנק מלאים',
            'להסביר את מטרת ההלוואה',
            'להציג תכנית החזר'
        ],
        mashakActions: [
            'לבדוק את הצורך',
            'לבדוק יכולת החזר',
            'להזין המלצה'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: חופשות
    // ==========================================
    {
        id: "special-leave-economic",
        title: 'חופשה מיוחדת כלכלית',
        category: "leave",
        shortDescription: 'חופשה עד 30 יום לעבודה.',
        eligibilityCriteria: [
            'אישור עבודה בתוקף',
            'מצוקה כלכלית מוכחת',
            'המלצת מפקד'
        ],
        aiKeywords: ['חופשה', 'לעבוד', 'חופש', 'ימי עבודה', 'להרוויח', 'חופשה כלכלית'],
        approvingAuthority: 'אל"מ / קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            ...ECONOMIC_DOCS_SOLDIER.map(d => ({ ...d, assignedTo: 'soldier' as const })),
            { id: 'work_permit', title: 'אישור עבודה בתוקף', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'debts', title: 'אישורי חובות', type: 'file', required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת אישור העבודה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת המצוקה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור עבודה בתוקף',
            'להביא אישורי חובות',
            'להביא אישורים כלכליים מלאים',
            'לקבל אישור מפקד'
        ],
        mashakActions: [
            'לבדוק אישור עבודה',
            'לבדוק את המצוקה',
            'לראיין את החייל',
            'להזין המלצה'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "special-leave-wedding",
        title: 'חופשת חתונה',
        category: "leave",
        shortDescription: 'חופשה לרגל נישואין.',
        eligibilityCriteria: [
            'החייל מתחתם/מתחתנת',
            'תאריך החתונה מאושר'
        ],
        aiKeywords: ['חתונה', 'מתחתן', 'נישואין', 'חופשת חתונה', 'חתן', 'כלה'],
        approvingAuthority: 'מפקד יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        relatedBenefits: ['תשמ"ש נשוי'],
        requirements: [
            { id: 'wedding_invitation', title: 'הזמנה לחתונה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'marriage_intent', title: 'אישור על רישום לנישואין', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'אימות תאריך', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא הזמנה לחתונה'
        ],
        mashakActions: [
            'לאמת תאריך',
            'להזין המלצה'
        ],
        slaHours: 24,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "special-leave-birth",
        title: 'חופשת לידה (לאם)',
        category: "leave",
        shortDescription: 'חופשת לידה לחיילת.',
        eligibilityCriteria: [
            'חיילת בהריון',
            'תאריך לידה משוער'
        ],
        aiKeywords: ['לידה', 'ילדה', 'תינוק', 'בן', 'בת', 'יולדת', 'חופשת לידה'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        relatedBenefits: ['תשמ"ש הריון', 'תקופת הורות'],
        requirements: [
            { id: 'birth_cert', title: 'תעודת לידה / אישור בית חולים', type: 'file', required: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'אימות הלידה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'עדכון מערכות', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא תעודת לידה'
        ],
        mashakActions: [
            'לאמת את הלידה',
            'להזין המלצה',
            'לעדכן מערכות'
        ],
        slaHours: 24,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: אוכלוסיות אור
    // ==========================================
    {
        id: "or-new-immigrant",
        title: 'אוכלוסיית אור - עולה חדש',
        category: "or_population",
        shortDescription: 'סיווג כאוכלוסיית אור כעולה חדש.',
        eligibilityCriteria: [
            'עלה לארץ לאחר גיל 16',
            'פחות מ-3 שנים בארץ (בד"כ)'
        ],
        aiKeywords: ['עולה', 'עליה', 'חדש בארץ', 'לא מכיר', 'עברית קשה', 'עולה חדש', 'אוכלוסיית אור'],
        approvingAuthority: 'מש"קית ת"ש',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        relatedBenefits: ['חייל בודד מובהק', 'מענקים', 'משרד הקליטה'],
        requirements: [
            { id: 'aliyah_date', title: 'אישור תאריך עלייה', description: 'משרד הפנים / סוכנות יהודית', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'teudat_oleh', title: 'תעודת עולה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'passport', title: 'דרכון', type: 'file', required: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'סיווג במערכת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'מעקב ראיונות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הפנייה למשרד הקליטה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור תאריך עלייה',
            'להביא תעודת עולה',
            'להביא דרכון'
        ],
        mashakActions: [
            'לסווג במערכת',
            'לתאם ראיונות מעקב',
            'להפנות למשרד הקליטה'
        ],
        slaHours: 24,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "or-broken-home",
        title: 'אוכלוסיית אור - משפחה שכולה',
        category: "or_population",
        shortDescription: 'בן למשפחה שכולה.',
        eligibilityCriteria: [
            'אחד מהוריו נפל בשירות',
            'או אח/אחות',
            'מוכר ע"י משרד הביטחון'
        ],
        aiKeywords: ['שכול', 'הורה נפל', 'אח נפל', 'משפחה שכולה', 'זכרון', 'אוכלוסיית אור'],
        approvingAuthority: 'אוטומטי',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        relatedBenefits: ['הת"ש 3', 'פטור מיחידות קדמיות', 'מענקים'],
        requirements: [],
        workflow: [
            { order: 1, title: 'סימון במערכת', description: '', isAutomated: true, responsible: 'system' },
            { order: 2, title: 'בדיקת הטבות מובנות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הת"ש 3 מובנה', description: '', isAutomated: true, responsible: 'system' },
        ],
        soldierActions: [],
        mashakActions: [
            'לסמן במערכת',
            'לבדוק הטבות מובנות'
        ],
        slaHours: 24,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "or-parent-sick",
        title: 'אוכלוסיית אור - הורה חולה',
        category: "or_population",
        shortDescription: 'חייל שהוריו חולים במחלה קשה.',
        eligibilityCriteria: [
            'הורה חולה במחלה קשה/סופנית',
            'אישור רפואי',
            'תלות ההורה בסיוע'
        ],
        aiKeywords: ['הורה חולה', 'אמא חולה', 'אבא חולה', 'מחלה קשה', 'סרטן', 'חולה סופני', 'אוכלוסיית אור'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: 'medical_cert', title: 'אישור רפואי על מחלה', description: 'מרופא מומחה, עם אבחנה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'hospital_summary', title: 'סיכום אשפוז', description: 'אם רלוונטי', type: 'file', required: false, assignedTo: 'soldier' },
            { id: 'dependency_cert', title: 'אישור על תלות בסיוע', description: 'אם רלוונטי', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'סיווג במערכת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת צרכים', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור רפואי',
            'להביא אישור תלות בסיוע (אם רלוונטי)'
        ],
        mashakActions: [
            'לסווג במערכת',
            'לראיין את החייל',
            'לבדוק צרכים'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },

    // ==========================================
    // קטגוריה: נוספים
    // ==========================================
    {
        id: "flight-funding",
        title: 'מימון טיסה לחייל בודד',
        category: "other",
        shortDescription: 'מימון טיסה לחייל בודד לביקור הורים בחו"ל.',
        eligibilityCriteria: [
            'חייל בודד מובהק',
            'הורים מתגוררים בחו"ל',
            'פעם בשנה'
        ],
        aiKeywords: ['טיסה', 'לטוס', 'חו"ל', 'לבקר הורים', 'כרטיס טיסה', 'נסיעה לחו"ל', 'מימון טיסה'],
        approvingAuthority: 'האגודה למען החייל',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 45,
        requirements: [
            { id: 'lone_cert', title: 'אישור חייל בודד', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'flight_quote', title: 'הצעת מחיר לטיסה', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'parents_address', title: 'כתובת הורים בחו"ל', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'passport_valid', title: 'דרכון בתוקף', type: 'file', required: true, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת זכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הגשת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'תיאום עם האגודה', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להביא אישור חייל בודד',
            'להשיג הצעת מחיר לטיסה',
            'להביא דרכון בתוקף'
        ],
        mashakActions: [
            'לבדוק זכאות',
            'להגיש בקשה',
            'לתאם עם האגודה'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "equipment-loss",
        title: 'אובדן ציוד אישי',
        category: "other",
        shortDescription: 'טיפול באובדן ציוד אישי של החייל.',
        eligibilityCriteria: [
            'אובדן/גניבה של ציוד',
            'דיווח בזמן',
            'אישור מפקד'
        ],
        aiKeywords: ['איבדתי', 'ציוד', 'גניבה', 'נגנב', 'אבד', 'חסר', 'אובדן ציוד'],
        approvingAuthority: 'וועדת אובדן ציוד',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 30,
        requirements: [
            { id: 'loss_report', title: 'דו"ח אובדן/גניגה', description: 'טופס מלא וחתום', type: 'file', required: true, assignedTo: 'soldier' },
            { id: 'commander_approval', title: 'אישור מפקד', type: 'file', required: true, assignedTo: 'commander' },
            { id: 'equipment_list', title: 'רשימת הציוד שאבד', type: 'text', required: true, assignedTo: 'soldier' },
            { id: 'police_report', title: 'דו"ח משטרה', description: 'במקרה של גניבה', type: 'file', required: false, assignedTo: 'soldier' },
        ],
        workflow: [
            { order: 1, title: 'בדיקת המקרה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הפנייה לוועדה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'מעקב', description: '', isAutomated: false, responsible: 'mashak' },
        ],
        soldierActions: [
            'להגיש דו"ח אובדן/גניבה',
            'לרשום את רשימת הציוד',
            'לקבל אישור מפקד',
            'להביא דו"ח משטרה (אם גניבה)'
        ],
        mashakActions: [
            'לבדוק את המקרה',
            'להפנות לוועדה',
            'לעקוב אחר הטיפול'
        ],
        slaHours: 336,
        lastUpdated: new Date().toISOString()
    }
];

// ==========================================
// הפעלת הסקריפט
// ==========================================
dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function uploadTemplates() {
    console.log(`🚀 מתחיל בטעינת ${DATA_TO_UPLOAD.length} תבניות...`);
    try {
        const batch = db.batch();
        DATA_TO_UPLOAD.forEach((template) => {
            const ref = db.collection('requestTemplates').doc(template.id);
            batch.set(ref, template, { merge: true });
        });
        await batch.commit();
        console.log('✅ התבניות נטענו בהצלחה!');

        // סיכום
        console.log('\n📊 סיכום לפי קטגוריות:');
        const categories: Record<string, number> = {};
        DATA_TO_UPLOAD.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + 1;
        });
        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} תבניות`);
        });

        // סיכום דרישות
        console.log('\n📋 סיכום דרישות ואישורים:');
        let totalRequirements = 0;
        DATA_TO_UPLOAD.forEach(t => {
            totalRequirements += t.requirements.length;
        });
        console.log(`   סה"כ ${totalRequirements} דרישות/אישורים`);

    } catch (error) {
        console.error('❌ שגיאה:', error);
    }
}

uploadTemplates();
