// /services/siteSettingsService.ts
import { SiteSettingsModel } from "../models/siteSettingsModel.ts";
import { SiteSettings, SiteSettingsInput } from "../types/siteSettings.d.ts";

export class SiteSettingsService {
  static async getSettings(): Promise<SiteSettings | null> {
    return await SiteSettingsModel.getSettings();
  }

  static async upsertSettings(data: SiteSettingsInput): Promise<void> {
    const exists = await SiteSettingsModel.exists();
    if (exists) {
      await SiteSettingsModel.updateSettings(data);
    } else {
      await SiteSettingsModel.insertSettings(data);
    }
  }
}