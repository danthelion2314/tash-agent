// ============================================
// קובץ: scripts/seed.ts
// החלף את הקובץ הקיים בזה
// מכיל את כל התבניות מספר ניהול משרד הת"ש - ספטמבר 2025
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
// מאגר התבניות המלא - מבוסס על ספר ניהול משרד הת"ש
// ==========================================
const DATA_TO_UPLOAD: RequestTemplate[] = [

    // ==========================================
    // קטגוריה: תשמ"ש (תשלומי משפחה)
    // ==========================================
    {
        id: "tashmash-parents",
        title: 'תשמ"ש הורים',
        category: "tashmash",
        shortDescription: 'סיוע חודשי לחייל שהוריו נמצאים במצוקה כלכלית ואינם מגיעים לסף הכנסה לנפש.',
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
        relatedBenefits: ['מענק בזק', 'תווי קנייה', 'הלוואה'],
        requirements: [
            { id: "declaration", title: 'הצהרת מהימנות (חתומה)', description: 'טופס הצהרה על מצב כלכלי', type: "file", required: true, assignedTo: 'soldier' },
            { id: "parents_id", title: 'צילום תעודות זהות של ההורים + ספח', description: 'כולל פירוט האחים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "bank_statements", title: 'דפי חשבון בנק של ההורים (3 חודשים אחרונים)', description: 'כל החשבונות', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "salary_slips", title: 'תלושי שכר של ההורים (3 חודשים אחרונים)', description: 'או אישור על אי עבודה', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "bituach_leumi", title: 'אישורי קצבאות מביטוח לאומי', description: 'אם רלוונטי', type: "file", required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: "pension_docs", title: 'אישורי פנסיה', description: 'אם רלוונטי', type: "file", required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: "vehicle_doc", title: 'אישור בעלות על רכב (אם קיים)', description: 'רישיון רכב', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'החתמת החייל על הצהרת מהימנות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת שלמות המסמכים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת הכנסות מול תקרות תשמ"ש', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'מעקב אחר אישור קצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא תעודות זהות של ההורים',
            'להביא דפי חשבון בנק (3 חודשים)',
            'להביא תלושי שכר / אישורי קצבה',
            'לחתום על הצהרת מהימנות'
        ],
        mashakActions: [
            'לפתוח בקשה במערכת "אנשים"',
            'להחתים את החייל על הצהרה',
            'לבדוק שלמות מסמכים',
            'לחשב הכנסה לנפש',
            'להזין המלצה',
            'לעקוב אחר אישור'
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
        relatedBenefits: ['הלנה', 'שכ"ד'],
        requirements: [
            { id: "marriage_cert", title: 'תעודת נישואין / אישור ידועים בציבור', type: "file", required: true, assignedTo: 'soldier' },
            { id: "ids", title: 'צילום ת.ז של בני הזוג + ספחים', description: 'סטטוס נשוי מעודכן', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "rent_contract", title: 'חוזה שכירות על שם בני הזוג', description: 'בתוקף', type: "file", required: true, assignedTo: 'soldier' },
            { id: "spouse_income", title: 'אישורי הכנסה של בן/בת הזוג', description: '3 תלושים אחרונים / אישור אי עבודה', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "bank_statements", title: 'דפי חשבון בנק משותפים (3 חודשים)', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'החתמת החייל ובן/בת הזוג על הצהרה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת שלמות מסמכים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'חישוב הכנסה לנפש', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא תעודת נישואין',
            'להביא ת.ז מעודכנת (סטטוס נשוי)',
            'להביא חוזה שכירות',
            'להביא אישורי הכנסה של בן/בת הזוג'
        ],
        mashakActions: [
            'לפתוח בקשה במערכת',
            'להחתים את בני הזוג על הצהרה',
            'לבדוק שלמות מסמכים',
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
        relatedBenefits: ['שמירת הריון', 'חופשת לידה'],
        requirements: [
            { id: "pregnancy_cert", title: 'אישור רפואי על הריון', description: 'חובה לציין: שבוע הריון, תאריך לידה משוער, חתימת רופא', type: "file", required: true, assignedTo: 'soldier' },
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה במערכת "אנשים"', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת שבוע 14+ באישור', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור רפואי עם שבוע הריון',
            'לחתום על הצהרת מהימנות'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לבדוק שבוע 14+',
            'להזין המלצה'
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
        relatedBenefits: ['הלנה', 'שכ"ד', 'דמי כלכלה'],
        requirements: [
            { id: "marriage_cert", title: 'תעודת נישואין', type: "file", required: true, assignedTo: 'soldier' },
            { id: "child_birth_cert", title: 'תעודת לידה של הילד/ים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "ids", title: 'ת.ז של כל בני המשפחה + ספחים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "rent_contract", title: 'חוזה שכירות', type: "file", required: true, assignedTo: 'soldier' },
            { id: "spouse_income", title: 'אישורי הכנסה של בן/בת הזוג', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "bank_statements", title: 'דפי חשבון בנק (3 חודשים)', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת מסמכים', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'חישוב הכנסה לנפש', description: '', isAutomated: true, responsible: 'system' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא תעודת נישואין',
            'להביא תעודות לידה של הילדים',
            'להביא חוזה שכירות',
            'להביא אישורי הכנסה'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לבדוק מסמכים',
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
        relatedBenefits: ['מימון טיסות', 'שכ"ד', 'מענקים', 'בית חייל'],
        requirements: [
            { id: "passport_entries", title: 'תמצית רישום כניסות ויציאות (הורים + חייל)', description: 'משרד הפנים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "parents_abroad_proof", title: 'אישור עבודה/מגורים של ההורים בחו"ל', description: 'חוזה שכירות, אישור מעסיק, חשבונות', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "parents_letter", title: 'מכתב מההורים', description: 'הסבר על מצבם והיעדרם מהארץ', type: "file", required: true, assignedTo: 'soldier' },
            { id: "personal_letter", title: 'מכתב אישי של החייל', description: 'תיאור המצב', type: "file", required: true, assignedTo: 'soldier' },
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עומק עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית (חובה)', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת כניסות/יציאות', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'שליחה לרמ"ד פרט לאישור', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא תמצית רישום כניסות/יציאות',
            'להביא אישורים על מגורי ההורים בחו"ל',
            'לכתוב מכתב אישי',
            'להביא מכתב מההורים'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לערוך ראיון עומק',
            'לבצע ביקור בית (חובה)',
            'לבדוק כניסות/יציאות',
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
        relatedBenefits: ['שכ"ד', 'מענקים', 'בית חייל'],
        requirements: [
            { id: "social_worker_report", title: 'דו"ח עו"ס מהרשות המקומית', description: 'המעיד על הנתק', type: "file", required: true, assignedTo: 'soldier' },
            { id: "affidavits", title: 'תצהירים משפטיים', description: 'תצהיר החייל + 2 עדים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "personal_letter", title: 'מכתב אישי מפורט', description: 'תיאור השתלשלות האירועים', type: "file", required: true, assignedTo: 'soldier' },
            { id: "bank_check", title: 'דפי חשבון בנק', description: 'לשלילת העברות מההורים', type: "file", required: true, assignedTo: 'soldier' },
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עומק מקיף', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית (חובה)', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'תיאום עם עו"ס בקהילה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'הזנת המלצה מפורטת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 6, title: 'הכנה לוועדת בודדים', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להשיג דו"ח עו"ס מהרשות',
            'להכין תצהירים משפטיים',
            'לכתוב מכתב מפורט',
            'להביא דפי חשבון בנק'
        ],
        mashakActions: [
            'לפתוח בקשה',
            'לערוך ראיון עומק מקיף',
            'לבצע ביקור בית (חובה)',
            'לתאם עם עו"ס בקהילה',
            'להזין המלצה מפורטת',
            'להכין לוועדת בודדים'
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
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' },
            { id: "ids", title: 'ת.ז של הורים + ספח', type: "file", required: true, assignedTo: 'soldier' },
            { id: "bank_statements", title: 'דפי חשבון בנק (3 חודשים)', type: "file", required: true, assignedTo: 'soldier' },
            { id: "support_letter", title: 'מכתב המתאר את הקשר המשפחתי', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'פתיחת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'בדיקת הכנסות הורים', description: '', isAutomated: true, responsible: 'system' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא ת.ז של ההורים',
            'להביא דפי חשבון בנק',
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
            { id: "rent_contract", title: 'חוזה שכירות מקורי', description: 'חתום ע"י החייל ובעל הדירה, תקף לשנה לפחות', type: "file", required: true, assignedTo: 'soldier' },
            { id: "landlord_id", title: 'צילום ת.ז של בעל הדירה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "bank_ownership", title: 'אישור בעלות על חשבון הבנק של החייל', type: "file", required: true, assignedTo: 'soldier' },
            { id: "arnona", title: 'חשבון ארנונה', description: 'על שם בעל הדירה', type: "file", required: false, assignedTo: 'soldier' },
            { id: "lone_soldier_cert", title: 'אישור חייל בודד', description: 'אם קיים', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת חוזה השכירות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת פרטי בעל הדירה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'חישוב גובה הסיוע', description: '', isAutomated: true, responsible: 'system' },
            { order: 4, title: 'הזנת פרטי חשבון בנק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא חוזה שכירות מקורי',
            'להביא ת.ז של בעל הדירה',
            'להביא אישור בעלות על חשבון בנק',
            'להביא חשבון ארנונה'
        ],
        mashakActions: [
            'לבדוק את החוזה',
            'לאמת פרטי בעל הדירה',
            'לחשב גובה הסיוע',
            'להזין פרטי חשבון',
            'להזין המלצה'
        ],
        slaHours: 168,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "beit-hachayal",
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
            { id: "commander_approval", title: 'אישור מפקד', description: 'המלצה על הצורך בפתרון', type: "file", required: true, assignedTo: 'commander' },
            { id: "photo", title: 'תמונת פספורט', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת זכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'תיאום עם בית החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הנפקת הפנייה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור מפקד',
            'להביא תמונת פספורט'
        ],
        mashakActions: [
            'לבדוק זכאות',
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
            { id: "rent_contract", title: 'חוזה שכירות', type: "file", required: true, assignedTo: 'soldier' },
            { id: "electric_bills", title: 'חשבונות חשמל (3 חודשים)', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "water_bills", title: 'חשבונות מים (3 חודשים)', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "gas_bills", title: 'חשבונות גז (אם רלוונטי)', type: "file", required: false, allowMultiple: true, assignedTo: 'soldier' },
            { id: "internet_bills", title: 'חשבונות אינטרנט', type: "file", required: false, allowMultiple: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת חשבונות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'חישוב גובה הסיוע', description: '', isAutomated: true, responsible: 'system' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא חוזה שכירות',
            'להביא חשבונות חשמל (3 חודשים)',
            'להביא חשבונות מים (3 חודשים)'
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
            { id: "declaration", title: 'הצהרת מהימנות', type: "file", required: true, assignedTo: 'soldier' },
            { id: "home_visit", title: 'דו"ח ביקור בית', type: "file", required: true, assignedTo: 'mashak' },
            { id: "commander_approval", title: 'אישור מפקד', type: "file", required: true, assignedTo: 'commander' }
        ],
        workflow: [
            { order: 1, title: 'ראיון עם החייל', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'החתמת מפקד', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'שליחה לקצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
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
            'מעל 60 דקות נסיעה (בדרך כלל)',
            'הפחתת נסיעות'
        ],
        aiKeywords: ['מרחק', 'רחוק', 'נסיעה ארוכה', 'שעות על הכביש', 'גוש דן', 'דרום', 'צפון', 'קיבוץ', 'מושב', 'הלנה מרחק'],
        approvingAuthority: 'קצינת ת"ש יחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 14,
        requirements: [
            { id: "address_proof", title: 'אישור כתובת', type: "file", required: true, assignedTo: 'soldier' },
            { id: "travel_time", title: 'אישור זמן נסיעה', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת כתובת ומרחק', description: '', isAutomated: true, responsible: 'system' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'אישור קצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור כתובת'
        ],
        mashakActions: [
            'לבדוק כתובת ומרחק',
            'להזין המלצה',
            'לקבל אישור קצינת ת"ש'
        ],
        slaHours: 72,
        lastUpdated: new Date().toISOString()
    },
    {
        id: "helana-crowding",
        title: 'הלנה מטעמי צפיפות',
        category: "helana",
        shortDescription: 'הלנה עקב צפיפות בחדרי החיילים.',
        eligibilityCriteria: [
            'צפיפות מוכחת בחדרים',
            'אישור מפקד היחידה',
            'בד"כ יחידות סגורות'
        ],
        aiKeywords: ['צפוף', 'אין מקום', 'חדר קטן', 'מיטות', 'מחסור במקומות', 'צפיפות'],
        approvingAuthority: 'מפקד היחידה',
        requiresHomeVisit: false,
        requiresDeclaration: false,
        procedure30Days: 7,
        requirements: [
            { id: "commander_approval", title: 'אישור מפקד על צפיפות', type: "file", required: true, assignedTo: 'commander' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת הצפיפות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'תיאום עם מפקד', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [],
        mashakActions: [
            'לבדוק את הצפיפות',
            'לתאם עם המפקד',
            'להזין המלצה'
        ],
        slaHours: 48,
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
            { id: "request_form", title: 'טופס בקשה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "commander_approval", title: 'אישור מפקד', type: "file", required: true, assignedTo: 'commander' }
        ],
        workflow: [
            { order: 1, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת הזכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
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
            { id: "request_form", title: 'טופס בקשה מפורט', type: "file", required: true, assignedTo: 'soldier' },
            { id: "home_visit", title: 'דו"ח ביקור בית', type: "file", required: true, assignedTo: 'mashak' },
            { id: "commander_approval", title: 'אישור מפקד', type: "file", required: true, assignedTo: 'commander' }
        ],
        workflow: [
            { order: 1, title: 'ראיון עומק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה מפורטת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'שליחה לקצינת ת"ש', description: '', isAutomated: false, responsible: 'mashak' }
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
            { id: "request_form", title: 'טופס בקשה מפורט', type: "file", required: true, assignedTo: 'soldier' },
            { id: "home_visit", title: 'דו"ח ביקור בית', type: "file", required: true, assignedTo: 'mashak' },
            { id: "social_report", title: 'דו"ח סוציאלי', type: "file", required: true, assignedTo: 'mashak' }
        ],
        workflow: [
            { order: 1, title: 'ראיון עומק', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ביקור בית', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'תיאום עם עו"ס', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 5, title: 'שליחה לרמ"ד פרט', description: '', isAutomated: false, responsible: 'mashak' }
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
            { id: "bank_minus", title: 'דפי חשבון בנק (מינוס)', type: "file", required: true, assignedTo: 'soldier' },
            { id: "commander_approval", title: 'אישור מפקד ישיר', type: "file", required: true, assignedTo: 'commander' },
            { id: "employer_letter", title: 'מכתב מהמעסיק', description: 'תנאי העסקה', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת הצורך', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת השפעה על השירות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'שליחה למפקד היחידה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא דפי חשבון בנק',
            'לקבל אישור מפקד',
            'להביא מכתב מהמעסיק (אופציונלי)'
        ],
        mashakActions: [
            'לבדוק את הצורך',
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
            { id: "bank_3m", title: 'דפי בנק 3 חודשים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "debts", title: 'אישורי חובות/עיקולים', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "social_report", title: 'דו"ח מש"קית', type: "text", required: true, assignedTo: 'mashak' }
        ],
        workflow: [
            { order: 1, title: 'ראיון דחוף', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת המצוקה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה דחופה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'אישור מפקד', description: '', isAutomated: false, responsible: 'commander' }
        ],
        soldierActions: [
            'להביא דפי בנק 3 חודשים',
            'להביא אישורי חובות/עיקולים'
        ],
        mashakActions: [
            'לערוך ראיון דחוף',
            'לבדוק את המצוקה',
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
            { id: "request", title: 'בקשה', type: "text", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת הזכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להגיש בקשה'
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
            { id: "bank", title: 'דפי בנק', type: "file", required: true, assignedTo: 'soldier' },
            { id: "purpose", title: 'הסבר על מטרת ההלוואה', type: "text", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת הצורך', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת יכולת החזר', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא דפי בנק',
            'להסביר את מטרת ההלוואה'
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
            { id: "work_permit", title: 'אישור עבודה בתוקף', type: "file", required: true, assignedTo: 'soldier' },
            { id: "debts", title: 'אישורי חובות', type: "file", required: true, allowMultiple: true, assignedTo: 'soldier' },
            { id: "commander_approval", title: 'אישור מפקד', type: "file", required: true, assignedTo: 'commander' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת אישור העבודה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'בדיקת המצוקה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 4, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור עבודה בתוקף',
            'להביא אישורי חובות',
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
            { id: "wedding_invitation", title: 'הזמנה לחתונה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "marriage_intent", title: 'אישור על רישום לנישואין', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'אימות תאריך', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' }
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
            { id: "birth_cert", title: 'תעודת לידה / אישור בית חולים', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'אימות הלידה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הזנת המלצה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'עדכון מערכות', description: '', isAutomated: false, responsible: 'mashak' }
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
        relatedBenefits: ['חייל בודד מובהק', 'מענקים'],
        requirements: [
            { id: "aliyah_date", title: 'אישור תאריך עלייה', type: "file", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'סיווג במערכת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'מעקב ראיונות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הפנייה למשרד הקליטה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור תאריך עלייה'
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
        relatedBenefits: ['הת"ש 3', 'פטור מיחידות קדמיות'],
        requirements: [],
        workflow: [
            { order: 1, title: 'סימון במערכת', description: '', isAutomated: true, responsible: 'system' },
            { order: 2, title: 'בדיקת הטבות מובנות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'הת"ש 3 מובנה', description: '', isAutomated: true, responsible: 'system' }
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
            { id: "medical_cert", title: 'אישור רפואי על מחלה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "dependency_cert", title: 'אישור על תלות בסיוע', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'סיווג במערכת', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'ראיון', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'בדיקת צרכים', description: '', isAutomated: false, responsible: 'mashak' }
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
            { id: "lone_cert", title: 'אישור חייל בודד', type: "file", required: true, assignedTo: 'soldier' },
            { id: "flight_booking", title: 'הזמנת טיסה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "parents_approval", title: 'אישור הורים', type: "file", required: false, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת זכאות', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הגשת בקשה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'תיאום עם האגודה', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להביא אישור חייל בודד',
            'להזמין טיסה'
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
            { id: "loss_report", title: 'דו"ח אובדן/גניבה', type: "file", required: true, assignedTo: 'soldier' },
            { id: "commander_approval", title: 'אישור מפקד', type: "file", required: true, assignedTo: 'commander' },
            { id: "equipment_list", title: 'רשימת הציוד שאבד', type: "text", required: true, assignedTo: 'soldier' }
        ],
        workflow: [
            { order: 1, title: 'בדיקת המקרה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 2, title: 'הפנייה לוועדה', description: '', isAutomated: false, responsible: 'mashak' },
            { order: 3, title: 'מעקב', description: '', isAutomated: false, responsible: 'mashak' }
        ],
        soldierActions: [
            'להגיש דו"ח אובדן/גניבה',
            'לרשום את רשימת הציוד',
            'לקבל אישור מפקד'
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
    } catch (error) {
        console.error('❌ שגיאה:', error);
    }
}

uploadTemplates();
