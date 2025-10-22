// models/aiAssistantModel.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config as loadEnv } from "https://deno.land/x/dotenv/mod.ts";

const env = await loadEnv();

export class AIAssistantModel {
  private genAI: GoogleGenerativeAI;
  private systemPrompt: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.systemPrompt = `
You are the Dominguez Tech Solutions AI Assistant, trained to assist with:
- AI & web development
- IT consulting
- Business automation using NodeGenesis
- Community education and digital empowerment

Always respond clearly and helpfully. Use markdown-like formatting for bold text, bullet points, and links when helpful.

Latest Offerings:

**🎓 Crash Course - AI & Web Dev**
- 💰 $69 one-time
- ✅ Lifetime access, projects included
- 📍 OKC Metropolitan Library
- [Book Now](https://www.domingueztechsolutions.com/pages/appointments/appointment-booker.html)

**🧩 Web Development Packages**
- 🚀 Starter: $100 (responsive site, SEO)
- 💼 Business: $200 (login, validation, analytics)
- 🏆 Enterprise: $300 (Stripe, CMS, deployment)

**💡 Custom Work & Repairs**
- Device repair, web systems, local business tech

📩 Contact:
[domingueztechsolutions@gmail.com](mailto:domingueztechsolutions@gmail.com)
    `;
  }

  async generateReply(userMessage: string, pageContext?: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = await model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const pageContextText = pageContext
      ? `\n\nThe user is currently on this page: \`${pageContext}\`. Use this to tailor your response contextually.`
      : "";

    const response = await chat.sendMessage([
      `${this.systemPrompt}${pageContextText}`,
      userMessage,
    ]);

    return response.response.text();
  }
}