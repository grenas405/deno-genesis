// services/aiAssistantService.ts

import { AIAssistantModel } from "../models/aiAssistantModel.ts";
import { AIChatRequest, AIChatResponse } from "../types/aiAssistant.d.ts";

export class AIAssistantService {
  private static model = new AIAssistantModel();

  static async sendChatMessage(input: AIChatRequest): Promise<AIChatResponse> {
    if (!input.message) {
      return {
        reply: `
**Welcome to Dominguez Tech Solutions! ⚙️**

I'm your AI assistant. I can help you explore our crash course, web packages, or custom tech services.

🗓️ **Book your appointment:**
[Appointment Booker](https://www.domingueztechsolutions.com/pages/appointments/appointment-booker.html)

📩 **Email us:**
[domingueztechsolutions@gmail.com](mailto:domingueztechsolutions@gmail.com)

How can I assist you today?
        `,
      };
    }

    const reply = await this.model.generateReply(input.message, input.page);
    return { reply };
  }
}