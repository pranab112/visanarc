// @google/genai coding guidelines followed: Using GoogleGenAI with named apiKey parameter, correct model selection for complex tasks, and property-based text extraction.
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSop = async (
  studentName: string,
  course: string,
  university: string,
  country: string,
  background: string
): Promise<string> => {
  try {
    const prompt = `Act as an expert academic admissions architect. Draft an original, highly streamlined Statement of Purpose (SOP) for ${studentName} applying to ${course} at ${university} in ${country}. 
    
    Background Details: ${background}
    
    CRITICAL CRITERIA FOR SUCCESS:
    1. Hook & Introduction: Start with a compelling narrative or vision, not generic greetings.
    2. Originality: Avoid academic cliches. Use a professional yet personal tone that reflects the student's unique voice.
    3. Academic Alignment: Connect previous studies directly to the modules of ${course}.
    4. Why this University: Provide specific reasons (research labs, faculty, or curriculum) that make ${university} the perfect fit.
    5. Why this Country: Explain the value of studying in ${country} over the home country.
    6. Career Trajectory: Explicitly state short-term and long-term career goals after graduation.
    7. Professional Conclusion: A strong, confident closing statement.
    
    Word Count: Maximum 700 words.
    Tone: Professional, ambitious, and sincere.`;

    // Fix: Using gemini-3-pro-preview for SOP generation as it is a complex academic reasoning and creative task
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate SOP.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating SOP. Please check your API key or network connection.";
  }
};

export const analyzeVisaRisk = async (
  profile: string,
  country: string
): Promise<string> => {
  try {
    const prompt = `Act as an expert visa consultant for ${country}. Analyze the visa approval probability based on the following student profile:
    
    ${profile}

    Evaluate the profile strictly based on current immigration trends for ${country}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { 
              type: Type.STRING, 
              enum: ["Low", "Medium", "High"],
              description: "The overall risk level of the application."
            },
            approvalProbability: { 
              type: Type.STRING, 
              description: "Estimated percentage chance of approval (e.g., '85%')."
            },
            keyStrengths: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of positive aspects of the profile."
            },
            riskFactors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of potential red flags or weaknesses."
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable steps to improve the application success rate."
            }
          },
          required: ["riskScore", "approvalProbability", "keyStrengths", "riskFactors", "recommendations"]
        }
      }
    });
    return response.text || "{}";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Error analyzing visa risk.");
  }
};

export const auditStudentCompliance = async (
  profile: string,
  uploadedDocs: string[]
): Promise<any[]> => {
  try {
    const prompt = `Act as a strict compliance auditor for a study abroad agency. Review the student's profile and the list of documents they have actually uploaded.
    
    Student Profile:
    ${profile}

    Uploaded Documents:
    ${uploadedDocs.length > 0 ? uploadedDocs.join(', ') : 'NONE'}

    Identify consistency errors, critical missing files, and expiry warnings. Return a JSON list of findings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["Critical", "Warning", "Verified"] },
              category: { type: Type.STRING },
              message: { type: Type.STRING }
            },
            required: ["type", "category", "message"]
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return [{ type: 'Warning', category: 'System', message: 'Could not complete AI audit at this time.' }];
  }
};

// Added missing extractPassportData function to handle multimodal OCR for student intake
export const extractPassportData = async (
  base64Data: string,
  mimeType: string
): Promise<{
  name: string;
  passportNumber: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  confidenceScore: number;
} | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: 'Extract the full name, passport number, date of birth, nationality, and gender from this passport image. Return the data as JSON.',
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            passportNumber: { type: Type.STRING },
            dateOfBirth: { type: Type.STRING, description: 'ISO format: YYYY-MM-DD' },
            nationality: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ["Male", "Female", "Other"] },
            confidenceScore: { type: Type.NUMBER, description: 'Confidence score from 0.0 to 1.0' }
          },
          required: ["name", "passportNumber", "dateOfBirth", "nationality", "gender", "confidenceScore"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Passport OCR Error:", error);
    return null;
  }
};

export interface UniRecommendation {
  name: string;
  location: string;
  tuition: string;
  acceptanceChance: 'High' | 'Medium' | 'Low';
  reason: string;
}

export const recommendUniversities = async (
  profile: {
    name: string,
    country: string,
    gpa: string,
    testType: string,
    testScore: string,
    financialCap: string,
    courseInterest: string
  }
): Promise<UniRecommendation[]> => {
  try {
    const prompt = `Act as an expert education counsellor. Recommend 4 universities in ${profile.country} for a student named ${profile.name}. 
    GPA: ${profile.gpa}, English: ${profile.testType} ${profile.testScore}, Interest: ${profile.courseInterest}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              tuition: { type: Type.STRING },
              acceptanceChance: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              reason: { type: Type.STRING }
            },
            required: ["name", "location", "tuition", "acceptanceChance", "reason"]
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as UniRecommendation[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

// --- SEARCH GROUNDING FEATURE ---

export const getImmigrationNews = async (country: string): Promise<{ text: string, sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are the latest immigration updates and visa policy changes for international students in ${country} for 2025? Provide a concise summary.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => chunk.web) || [];
    return {
      text: response.text || "No news found.",
      sources: sources.filter((s: any) => s && s.uri)
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return { text: "Failed to fetch current updates.", sources: [] };
  }
};

// --- IMAGE GENERATION FEATURE ---

export const generateMarketingPoster = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `High-quality education consultancy marketing poster: ${prompt}. Professional design, clean typography, vibrant colors, realistic setting.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "9:16" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

// --- VIDEO GENERATION (VEO) FEATURE ---

export const generatePromoVideo = async (prompt: string): Promise<string | null> => {
  try {
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await freshAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic marketing video for study abroad agency: ${prompt}. 4k, smooth transitions, professional lighting.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Veo Video Generation Error:", error);
    return null;
  }
};

// --- LIVE API INTERVIEW FEATURE ---

export const connectLiveInterview = async (callbacks: any, country: string) => {
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return freshAi.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: `You are a strict but fair visa officer for ${country}. Your goal is to conduct a credibility interview. Ask difficult questions about finances, academic gaps, and intentions to return to home country. One question at a time. Speak concisely.`,
    },
  });
};

// --- AUDIO UTILS ---

export function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodePCM(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}