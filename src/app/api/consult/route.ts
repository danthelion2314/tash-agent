import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllTemplatesForAI } from "@/lib/tash-admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text, soldierProfile } = await req.json();

        if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

        const allTemplates = await getAllTemplatesForAI();

        // בניית הקשר עשיר יותר ל-AI עם קריטריונים ומילות מפתח
        const templatesContext = allTemplates.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            description: t.shortDescription,
            // קריטריונים לזכאות
            criteria: t.eligibilityCriteria || [],
            // מילות מפתח
            keywords: t.aiKeywords || [],
            // גורם מאשר
            approvingAuthority: t.approvingAuthority || '',
            // האם דורש ביקור בית
            requiresHomeVisit: t.requiresHomeVisit || false,
            // רשימת הדרישות
            requirements: t.requirements?.map((r: any) => ({
                title: r.title,
                required: r.required,
                assignedTo: r.assignedTo || 'soldier'
            })) || [],
            // פעולות מש"ק
            mashakActions: t.mashakActions || [],
            // פעולות חייל
            soldierActions: t.soldierActions || []
        }));

        const prompt = `
אתה קצין ת"ש מומחה בצה"ל (Senior Welfare Officer). 
תפקידך לנתח את המקרה של החייל ולהמליץ על מסלולי הטיפול המדויקים ביותר מתוך הרשימה הסגורה.

### חוקי ההיגיון (Decision Logic based on IDF Protocols):

**1. אוכלוסיות מיוחדות:**
- הורים בחו"ל? → המלץ על "חייל בודד מובהק" (lone-soldier-muvhak).
- הורים בארץ אך אין קשר/נתק משפחתי? → המלץ על "חייל בודד חע"מ" (lone-soldier-hame).
- קשר חלקי עם הורים? → המלץ על "זכאי סיוע" (suid-help).
- עלה חדש? → המלץ על "אוכלוסיית אור - עולה חדש" (or-new-immigrant).
- משפחה שכולה? → המלץ על "אוכלוסיית אור - משפחה שכולה" (or-broken-home).
- הורה חולה? → המלץ על "אוכלוסיית אור - הורה חולה" (or-parent-sick).

**2. תשמ"ש:**
- מצוקה כלכלית של ההורים? → המלץ על "תשמ"ש הורים" (tashmash-parents).
- חייל נשוי? → המלץ על "תשמ"ש נשוי" (tashmash-married).
- חיילת בהריון? → המלץ על "תשמ"ש הריון" (tashmash-pregnancy).
- נשוי + ילד? → המלץ על "תשמ"ש נשוי + ילד" (tashmash-married-child).

**3. דיור:**
- חייל בודד צריך עזרה בשכ"ד? → המלץ על "השתתפות בשכ"ד" (rent-participation).
- צריך מקום לינה? → המלץ על "בית החייל" (beit-hachayal).
- הוצאות דירה? → המלץ על "הוצאות אחזקת דירה" (maintenance-expenses).

**4. הלנות:**
- רוצה לישון בבית מסיבות אישיות? → המלץ על "הלנה מטעמי פרט" (helana-part).
- מרחק גדול מהבית? → המלץ על "הלנה מטעמי מרחק" (helana-distance).
- צפיפות ביחידה? → המלץ על "הלנה מטעמי צפיפות" (helana-crowding).

**5. הקלות:**
- לילה אחד בשבוע? → המלץ על "הת"ש 1" (hakash-1).
- שני לילות? → המלץ על "הת"ש 2" (hakash-2).
- שלושה לילות? → המלץ על "הת"ש 3" (hakash-3).

**6. כלכלי:**
- מצוקה חריפה ומיידית? → המלץ על "מענק בזק" (bzack-grant).
- רוצה לעבוד? → המלץ על "אישור עבודה" (work-permit).
- צריך אוכל/קניות? → המלץ על "תווי קנייה" (vouchers).
- צריך הלוואה? → המלץ על "הלוואה מידית" (loan-immediate).
- חופשה לעבודה? → המלץ על "חופשה מיוחדת כלכלית" (special-leave-economic).

**7. חופשות:**
- מתחתן? → המלץ על "חופשת חתונה" (special-leave-wedding).
- יולדת? → המלץ על "חופשת לידה" (special-leave-birth).

**8. נוספים:**
- טיסה לחו"ל? → המלץ על "מימון טיסה" (flight-funding).
- איבד ציוד? → המלץ על "אובדן ציוד" (equipment-loss).

### נתוני המקרה:
"${text}"

${soldierProfile ? `
### מידע נוסף על החייל:
- שם: ${soldierProfile.fullName || 'לא ידוע'}
- יחידה: ${soldierProfile.unit || 'לא ידוע'}
- חייל בודד: ${soldierProfile.isLoneSoldier ? 'כן' : 'לא'}
- תשמ"ש: ${soldierProfile.isTashmash ? 'כן' : 'לא'}
- אוכלוסיית אור: ${soldierProfile.isOrPopulation ? 'כן' : 'לא'}
` : ''}

### רשימת הנהלים הקיימים במערכת:
${JSON.stringify(templatesContext, null, 2)}

### הוראות פלט:
1. החזר JSON בלבד.
2. המבנה חייב להיות:
{
  "recommendedIds": ["id1", "id2"],
  "explanation": "הסבר קצר על ההמלצות",
  "nextSteps": {
    "soldierNeeds": ["מה החייל צריך להביא"],
    "mashakNeeds": ["מה המש\"ק צריך לעשות"]
  }
}
3. אם יש ספק, תן את האפשרות הרלוונטית ביותר.
4. תמיד כלול את רשימת המסמכים שהחייל צריך להביא.
5. תמיד כלול את רשימת הפעולות שהמש\"ק צריך לעשות.
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(cleanJson);
        } catch (e) {
            console.error("AI JSON Parse Error", textResponse);
            // ניסיון לפרסר רק את ה-IDs
            const idsMatch = textResponse.match(/\[\"[^\"]+\"(?:\s*,\s*\"[^\"]+\")*\]/);
            if (idsMatch) {
                parsedResponse = {
                    recommendedIds: JSON.parse(idsMatch[0]),
                    explanation: "ראה תשובת AI",
                    nextSteps: { soldierNeeds: [], mashakNeeds: [] }
                };
            } else {
                return NextResponse.json({ suggestions: [], rawResponse: textResponse });
            }
        }

        const recommendedIds = parsedResponse.recommendedIds || [];
        const recommendedTemplates = allTemplates.filter(t => recommendedIds.includes(t.id));

        return NextResponse.json({
            suggestions: recommendedTemplates,
            explanation: parsedResponse.explanation,
            nextSteps: parsedResponse.nextSteps,
            rawResponse: textResponse
        });

    } catch (error) {
        console.error("AI Consultation Error:", error);
        return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
    }
}