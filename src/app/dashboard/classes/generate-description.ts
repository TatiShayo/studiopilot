"use server";

import OpenAI from "openai";

export async function generateAIDescription(className: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return "OpenAI API key not configured. Add OPENAI_API_KEY to your .env.local.";
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a fitness studio copywriter. Write a compelling, welcoming, and inclusive class description in 2-3 sentences. Mention what the class is about, who it's for (all levels unless specified), and the benefits. Use a warm, motivational tone. Do not use markdown or special formatting.",
        },
        {
          role: "user",
          content: `Write a class description for: ${className}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return (
      response.choices[0]?.message?.content?.trim() ??
      "Failed to generate description. Please try again."
    );
  } catch (error: any) {
    console.error("OpenAI generation error:", error);
    return `Could not generate description: ${error.message || "Unknown error"}. Please type one manually.`;
  }
}
