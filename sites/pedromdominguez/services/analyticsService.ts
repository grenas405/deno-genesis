// /services/analyticsService.ts
import { AnalyticsModel } from "../models/analyticsModel.ts";
import { SiteAnalytics } from "../types/analytics.d.ts";

export class AnalyticsService {
  static async getAnalytics(): Promise<SiteAnalytics> {
    return await AnalyticsModel.getSiteAnalytics();
  }
}