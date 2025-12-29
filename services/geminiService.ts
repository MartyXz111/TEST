
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// Note: API key is automatically handled by the environment as per requirements.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const streamChatResponse = async (
  history: Message[],
  onChunk: (chunk: string) => void
) => {
  const ai = getAIClient();
  const model = 'gemini-2.5-flash-lite-latest';

  // Convert application message history to Gemini contents format
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        fullText += textChunk;
        onChunk(textChunk);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
