"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIRequestPayload, AIResponse } from "@/lib/ai/types";

// Initialize Gemini
// Note: GOOGLE_API_KEY must be set in environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash";

export async function generateAIContent(payload: AIRequestPayload): Promise<AIResponse> {
  if (!process.env.GOOGLE_API_KEY) {
    return { success: false, error: "AI Service not configured (Missing API Key)" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    let prompt = "";

    // Prompt Engineering Layer
    switch (payload.mode) {
      case 'VAULT_ORGANIZE':
        prompt = `
          You are a Data Organizer. I will provide a list of website names and URLs.
          Group them into logical folders (e.g., 'Finance', 'Social', 'Streaming', 'Dev', 'Shopping', 'Work').
          Return ONLY a JSON object where keys are Folder Names and values are arrays of IDs.
          Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
          Input: ${JSON.stringify(payload.data)}
        `;
        break;

      case 'PASSWORD_AUDIT':
        prompt = `
          Analyze the entropy and strength of this password string. 
          Return a JSON with: 
          - score (1-10)
          - timeToCrack (estimated)
          - feedback (specific suggestions to improve)
          Do not repeat the password in the response.
          Input: "${payload.data?.password || ""}"
        `;
        break;

      case 'URL_SAFETY':
        prompt = `
          Analyze this URL for potential phishing or security risks.
          URL: "${payload.data?.url || ""}"
          Return a JSON with:
          - safe (boolean)
          - riskLevel (Low, Medium, High)
          - reason (short explanation)
        `;
        break;
        
      case 'GENERAL_QUERY':
        prompt = payload.prompt || "";
        break;

      default:
        return { success: false, error: "Invalid mode" };
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Cleanup markdown if Gemini adds it despite instructions
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return { success: true, data: text };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { success: false, error: "Failed to generate AI response" };
  }
}

