import { GoogleGenAI, Type } from "@google/genai";
import { PatientCase, CaseInput } from "../types";

export const isPlaceholder = (key: string | undefined): boolean => {
  if (!key) return true;
  const k = key.trim();
  return k === "" || 
         k === "undefined" || 
         k === "null" || 
         k.startsWith("YOUR_") || 
         k.includes("MY_GEMINI_API_KEY") ||
         k.length < 10; // Most API keys are longer than 10 chars
};

export const getApiKey = (manualKey?: string) => {
  if (manualKey && !isPlaceholder(manualKey)) {
    return manualKey.trim();
  }
  
  const envKey = 
    process.env.GEMINI_API_KEY || 
    process.env.VITE_GEMINI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.VITE_GOOGLE_API_KEY || 
    process.env.Google_API_Key || 
    process.env.VITE_Google_API_Key || 
    process.env.API_KEY ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_API_KEY ||
    (import.meta as any).env?.VITE_Google_API_Key ||
    (import.meta as any).env?.VITE_API_KEY;
    
  if (envKey && !isPlaceholder(envKey)) {
    return envKey.trim();
  }
  
  return "";
};

export const getApiKeySource = (manualKey?: string) => {
  if (manualKey && !isPlaceholder(manualKey)) return "Manual (Browser)";
  
  if (!isPlaceholder(process.env.GEMINI_API_KEY)) return "Vercel (GEMINI_API_KEY)";
  if (!isPlaceholder(process.env.VITE_GEMINI_API_KEY)) return "Vercel (VITE_GEMINI_API_KEY)";
  if (!isPlaceholder(process.env.GOOGLE_API_KEY)) return "Vercel (GOOGLE_API_KEY)";
  if (!isPlaceholder(process.env.VITE_GOOGLE_API_KEY)) return "Vercel (VITE_GOOGLE_API_KEY)";
  if (!isPlaceholder((process.env as any).Google_API_Key)) return "Vercel (Google_API_Key)";
  if (!isPlaceholder((process.env as any).VITE_Google_API_Key)) return "Vercel (VITE_Google_API_Key)";
  if (!isPlaceholder(process.env.API_KEY)) return "Vercel (API_KEY)";
  
  if (!isPlaceholder((import.meta as any).env?.VITE_GEMINI_API_KEY)) return "Vite (VITE_GEMINI_API_KEY)";
  if (!isPlaceholder((import.meta as any).env?.VITE_GOOGLE_API_KEY)) return "Vite (VITE_GOOGLE_API_KEY)";
  if (!isPlaceholder((import.meta as any).env?.VITE_Google_API_Key)) return "Vite (VITE_Google_API_Key)";
  if (!isPlaceholder((import.meta as any).env?.VITE_API_KEY)) return "Vite (VITE_API_KEY)";
  
  return "None";
};

export const generatePatientCase = async (input: CaseInput, manualKey?: string, signal?: AbortSignal): Promise<PatientCase> => {
  const API_KEY = getApiKey(manualKey);
  const source = getApiKeySource(manualKey);
  
  console.log(`[Gemini] Attempting generation. Source: ${source}`);
  if (API_KEY) {
    console.log(`[Gemini] Key found: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`);
  }

  if (!API_KEY) {
    console.error("[Gemini] No valid API key found for generation");
    throw new Error("API_KEY_MISSING");
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Create an internal timeout that also respects the external signal
  const internalController = new AbortController();
  const timeoutId = setTimeout(() => internalController.abort(), 120000); // Increased to 120s for Pro model
  
  // If external signal is provided, listen for it
  if (signal) {
    signal.addEventListener('abort', () => internalController.abort());
  }
  
  const prompt = `Generate a richly detailed, realistic synthetic patient case for medical education.
  
  Disease/Condition: ${input.disease}
  Age Range: ${input.ageRange}
  Biological Sex: ${input.biologicalSex}
  Race/Ethnicity: ${input.race}
  Complexity Level: ${input.complexity}
  Additional Instructions: ${input.additionalInstructions || "None"}
  
  The case must be structured with all 15 clinical sections:
  1. Patient demographics (fictional name, occupation, marital status, race/ethnicity)
  2. Chief complaint in the patient's own words
  3. History of present illness (HPI)
  4. Past medical history (PMH)
  5. Medications
  6. Allergies
  7. Family history
  8. Social history
  9. Review of systems (ROS)
  10. Physical exam (PE) with specific vital signs and organ-system findings
  11. Laboratory results (Labs) with real numeric values, reference ranges, and H/L flags
  12. Imaging & diagnostics written as actual radiology/cardiology reports
  13. Differential Diagnosis
  14. Final Diagnosis
  15. Clinical discussion questions (escalating difficulty) and Teaching points.
  
  Include "red herrings" (irrelevant but plausible findings) to make the case realistic.
  Ensure lab values are medically consistent with the condition and complexity level.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            demographics: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                age: { type: Type.STRING },
                sex: { type: Type.STRING },
                race: { type: Type.STRING },
                occupation: { type: Type.STRING },
                maritalStatus: { type: Type.STRING },
                location: { type: Type.STRING },
              },
              required: ["name", "age", "sex", "race", "occupation", "maritalStatus"],
            },
            chiefComplaint: { type: Type.STRING },
            historyOfPresentIllness: { type: Type.STRING },
            pastMedicalHistory: { type: Type.ARRAY, items: { type: Type.STRING } },
            medications: { type: Type.ARRAY, items: { type: Type.STRING } },
            allergies: { type: Type.ARRAY, items: { type: Type.STRING } },
            familyHistory: { type: Type.STRING },
            socialHistory: { type: Type.STRING },
            reviewOfSystems: { type: Type.STRING },
            physicalExam: {
              type: Type.OBJECT,
              properties: {
                vitals: {
                  type: Type.OBJECT,
                  properties: {
                    bp: { type: Type.STRING },
                    hr: { type: Type.STRING },
                    rr: { type: Type.STRING },
                    temp: { type: Type.STRING },
                    spo2: { type: Type.STRING },
                  },
                  required: ["bp", "hr", "rr", "temp", "spo2"],
                },
                general: { type: Type.STRING },
                heent: { type: Type.STRING },
                cardiovascular: { type: Type.STRING },
                respiratory: { type: Type.STRING },
                abdomen: { type: Type.STRING },
                neurological: { type: Type.STRING },
                musculoskeletal: { type: Type.STRING },
                skin: { type: Type.STRING },
              },
              required: ["vitals", "general", "cardiovascular", "respiratory", "abdomen"],
            },
            labs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  referenceRange: { type: Type.STRING },
                  flag: { type: Type.STRING, enum: ["H", "L", "Normal"] },
                },
                required: ["testName", "value", "unit", "referenceRange"],
              },
            },
            imaging: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  modality: { type: Type.STRING },
                  indication: { type: Type.STRING },
                  findings: { type: Type.STRING },
                  impression: { type: Type.STRING },
                },
                required: ["modality", "findings", "impression"],
              },
            },
            differentialDiagnosis: { type: Type.ARRAY, items: { type: Type.STRING } },
            finalDiagnosis: { type: Type.STRING },
            discussionQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                  answer: { type: Type.STRING },
                },
                required: ["question", "difficulty", "answer"],
              },
            },
            teachingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            redHerrings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "demographics", "chiefComplaint", "historyOfPresentIllness", "pastMedicalHistory",
            "medications", "allergies", "familyHistory", "socialHistory", "reviewOfSystems",
            "physicalExam", "labs", "imaging", "differentialDiagnosis", "finalDiagnosis",
            "discussionQuestions", "teachingPoints"
          ],
        },
      },
    });

    clearTimeout(timeoutId);
    const text = response.text;
    if (!text) throw new Error("The AI returned an empty response.");
    
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      input,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Gemini API Error:", error);
    
    // Extract the most useful error message
    let message = "An unexpected error occurred.";
    
    if (error.name === 'AbortError') {
      message = "The request timed out. The case generation took too long. Please try again with a simpler condition or check your connection.";
    } else if (error.message?.includes("API key not valid")) {
      message = "Invalid API Key. Please check your key in Settings.";
    } else if (error.message?.includes("quota")) {
      message = "API Quota exceeded. Please try again later or use a different key.";
    } else if (error.message?.includes("model not found")) {
      message = "The selected AI model (gemini-3-flash-preview) is not available for this key.";
    } else if (error.message) {
      message = error.message;
    }
    
    throw new Error(message);
  }
};

export const testApiKey = async (manualKey?: string): Promise<boolean> => {
  const API_KEY = getApiKey(manualKey);
  const source = getApiKeySource(manualKey);
  
  console.log(`[Gemini] Testing key. Source: ${source}`);
  
  if (!API_KEY) {
    console.error("[Gemini] No valid API key found for testing");
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Say 'OK' if you can hear me.",
    });
    const success = response.text.includes("OK");
    console.log(`[Gemini] Test result: ${success ? "SUCCESS" : "FAILED (Unexpected response)"}`);
    return success;
  } catch (error: any) {
    console.error("[Gemini] API Test Error:", error);
    throw error;
  }
};
