// services/aiAssistantService.ts
import { AIAssistantModel } from "../models/aiAssistantModel.ts";
import { AIChatRequest, AIChatResponse } from "../types/aiAssistant.d.ts";

/**
 * AI Assistant Service for Deno Genesis Framework
 * Handles chat responses with context awareness and error handling
 */
export class AIAssistantService {
  private static model = new AIAssistantModel();
  private static readonly DEFAULT_WELCOME_MESSAGE = `
**Welcome to Dominguez Tech Solutions! ⚙️**

I'm Deno Genesis AI Assistant ready to help you with your AI augmented workflow.

How can I assist you today?
  `.trim();

  /**
   * Process chat message and generate AI response
   * @param input - Chat request containing message and optional page context
   * @returns Promise resolving to chat response
   */
  static async sendChatMessage(input: AIChatRequest): Promise<AIChatResponse> {
    try {
      // Handle empty or missing message with welcome prompt
      if (!input.message?.trim()) {
        return {
          reply: this.DEFAULT_WELCOME_MESSAGE,
          timestamp: new Date().toISOString(),
          context: {
            type: "welcome",
            page: input.page || "unknown"
          }
        };
      }

      // Generate AI response with page context
      const reply = await this.model.generateReply(
        input.message.trim(), 
        input.page
      );

      return {
        reply,
        timestamp: new Date().toISOString(),
        context: {
          type: "ai_response",
          page: input.page || "unknown",
          messageLength: input.message.length
        }
      };

    } catch (error) {
      console.error("🚨 [AIAssistantService] Error processing chat message:", error);
      
      return {
        reply: "I'm Deno Genesis AI Assistant, but I'm experiencing technical difficulties with my AI augmented workflow capabilities. Please try again in a moment or contact us directly at domingueztechsolutions@gmail.com.",
        timestamp: new Date().toISOString(),
        context: {
          type: "error",
          page: input.page || "unknown",
          errorType: error.name || "UnknownError"
        },
        error: {
          message: "AI workflow service temporarily unavailable",
          code: "AI_SERVICE_ERROR"
        }
      };
    }
  }

  /**
   * Health check for AI service
   * @returns Promise resolving to service health status
   */
  static async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    details?: string;
  }> {
    try {
      const testRequest: AIChatRequest = {
        message: "health check",
        page: "system"
      };

      const startTime = Date.now();
      await this.sendChatMessage(testRequest);
      const responseTime = Date.now() - startTime;

      if (responseTime < 1000) {
        return {
          status: "healthy",
          timestamp: new Date().toISOString()
        };
      } else if (responseTime < 5000) {
        return {
          status: "degraded",
          timestamp: new Date().toISOString(),
          details: `Slow response: ${responseTime}ms`
        };
      } else {
        return {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          details: `Timeout risk: ${responseTime}ms`
        };
      }

    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        details: error.message
      };
    }
  }

  /**
   * Get service metrics for monitoring
   * @returns Service performance metrics
   */
  static getMetrics(): {
    name: string;
    version: string;
    uptime: string;
    lastHealthCheck: string;
  } {
    return {
      name: "AIAssistantService",
      version: "1.0.0",
      uptime: process?.uptime ? `${Math.floor(process.uptime())}s` : "unknown",
      lastHealthCheck: new Date().toISOString()
    };
  }
}