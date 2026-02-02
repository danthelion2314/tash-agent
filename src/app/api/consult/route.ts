import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllTemplatesForAI } from "@/lib/tash-admin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

        const allTemplates = await getAllTemplatesForAI();

        // בניית הקשר עשיר יותר ל-AI
        const templatesContext = allTemplates.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            description: t.shortDescription,
            // אנחנו שולחים ל-AI גם את רשימת הדרישות כדי שיבין את ה"מחיר" של כל בקשה
            requirements: t.requirements.map((r: any) => r.title).join(", ")
        }));

        const prompt = `
      אתה קצין ת"ש מומחה בצה"ל (Senior Welfare Officer). 
      תפקידך לנתח את המקרה של החייל ולהמליץ על מסלולי הטיפול המדויקים ביותר מתוך הרשימה הסגורה.

      ### חוקי ההיגיון (Decision Logic based on IDF Protocols):
      1. **בודדים:**
         - הורים בחו"ל? -> המלץ על "חייל בודד מובהק" (lone-soldier-muvhak).
         - הורים בארץ אך אין קשר/סיכון? -> המלץ על "חייל בודד חע"מ" (lone-soldier-hame).
         - חייל בודד צריך עזרה בשכר דירה? -> המלץ על "השתתפות בשכר דירה" (rent-participation).
      
      2. **כלכלי:**
         - מצוקה כלכלית של ההורים (מינוס, חובות, אין אוכל)? -> המלץ על "תשמ"ש הורים" (tashmash-parents).
         - מצוקה *חריפה ומיידית* (עיקולים, ניתוק חשמל)? -> המלץ על "מענק בזק" (bzack-grant).
         - החייל רוצה לעבוד כדי לעזור בבית? -> המלץ על "אישור עבודה" (work-permit) + "מיוחדת כלכלית" (special-economic-leave).

      3. **משפחה:**
         - חייל נשוי? -> המלץ על "תשמ"ש נשוי" (tashmash-married-basic).
         - הריון? -> המלץ על "תשמ"ש הריון" (tashmash-pregnancy).

      ### נתוני המקרה:
      "${text}"

      ### רשימת הנהלים הקיימים במערכת:
      ${JSON.stringify(templatesContext)}

      ### הוראות פלט:
      1. החזר JSON בלבד.
      2. המבנה חייב להיות מערך של מזהים (IDs) בלבד.
      3. אם יש ספק, תן את האפשרות הרלוונטית ביותר.
      
      דוגמה לתשובה תקינה:
      ["lone-soldier-hame", "bzack-grant"]
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        let recommendedIds: string[] = [];
        try {
            recommendedIds = JSON.parse(cleanJson);
        } catch (e) {
            console.error("AI JSON Parse Error", textResponse);
            return NextResponse.json({ suggestions: [] });
        }

        const recommendedTemplates = allTemplates.filter(t => recommendedIds.includes(t.id));

        return NextResponse.json({ suggestions: recommendedTemplates });

    } catch (error) {
        console.error("AI Consultation Error:", error);
        return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
    }
}