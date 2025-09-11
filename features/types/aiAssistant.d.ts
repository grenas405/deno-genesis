// types/aiAssistant.d.ts

export interface AIChatRequest {
  message?: string;
  page?: string;
}

export interface AIChatResponse {
  reply: string;
}

export interface AIServiceInterface {
  sendChatMessage(input: AIChatRequest): Promise<AIChatResponse>;
}