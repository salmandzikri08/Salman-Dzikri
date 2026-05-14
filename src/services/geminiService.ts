import { GoogleGenAI } from "@google/genai";
import { ConsultationMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getHerbalConsultation(history: ConsultationMessage[], userInput: string) {
  const systemPrompt = `Anda adalah Ahli Herbal Tradisional Indonesia (Jamu Specialist). 
  Nama anda adalah "Bude JamuKu". Tugas anda adalah memberikan saran jamu yang tepat berdasarkan keluhan pengguna.
  
  Ketentuan:
  1. Berikan rekomendasi jamu yang relevan (seperti Beras Kencur, Kunyit Asam, Temulawak, dsb).
  2. Jelaskan manfaat jamu tersebut secara singkat dan ramah.
  3. Gunakan bahasa Indonesia yang hangat dan santun (seperti seorang Bude).
  4. Selalu ingatkan bahwa saran ini bukan pengganti nasihat medis profesional jika gejala berlanjut.
  5. Jika pengguna menanyakan jamu tertentu, jelaskan bahan-bahannya.
  
  Percakapan Terakhir:
  ${history.map(m => `${m.role === 'user' ? 'User' : 'Bude'}: ${m.content}`).join('\n')}
  
  Input pengguna saat ini: ${userInput}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: systemPrompt }] }],
    });
    
    if (!response.text) {
      console.error("Gemini empty response:", response);
      return "Maaf Nak, Bude agak bingung. Bisa diulang pertanyaannya?";
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes("API_KEY_INVALID")) {
      return "Maaf, ada kendala dengan kunci akses Bude. Silakan hubungi pengembang.";
    }
    return "Maaf, Bude sedang sibuk menumbuk jamu. Sebentar ya, coba tanya lagi nanti!";
  }
}
