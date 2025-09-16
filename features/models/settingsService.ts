// /models/siteSettingsModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { SiteSettings, SiteSettingsInput } from "../types/siteSettings.d.ts";

export class SiteSettingsModel {
  static async getSettings(): Promise<SiteSettings | null> {
    const rows = await db.query(
      `SELECT
        hero_headline, contact_email, business_phone, footer_text,
        primary_color, secondary_color, about_us_text,
        facebook_url, instagram_url, twitter_url, tracking_code
      FROM site_settings WHERE site_key = ? LIMIT 1`,
      [SITE_KEY],
    );

    return rows && rows.length > 0 ? rows[0] as SiteSettings : null;
  }

  static async insertSettings(data: SiteSettingsInput): Promise<void> {
    await db.execute(
      `INSERT INTO site_settings (
        site_key, hero_headline, contact_email, business_phone,
        footer_text, primary_color, secondary_color, about_us_text,
        facebook_url, instagram_url, twitter_url, tracking_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        SITE_KEY, data.heroHeadline, data.contactEmail, data.businessPhone,
        data.footerText, data.primaryColor, data.secondaryColor, data.aboutUsText,
        data.facebookUrl, data.instagramUrl, data.twitterUrl, data.trackingCode,
      ],
    );
  }

  static async updateSettings(data: SiteSettingsInput): Promise<void> {
    await db.execute(
      `UPDATE site_settings SET
        hero_headline = ?, contact_email = ?, business_phone = ?,
        footer_text = ?, primary_color = ?, secondary_color = ?, about_us_text = ?,
        facebook_url = ?, instagram_url = ?, twitter_url = ?, tracking_code = ?
       WHERE site_key = ?`,
      [
        data.heroHeadline, data.contactEmail, data.businessPhone,
        data.footerText, data.primaryColor, data.secondaryColor, data.aboutUsText,
        data.facebookUrl, data.instagramUrl, data.twitterUrl, data.trackingCode,
        SITE_KEY,
      ],
    );
  }

  static async exists(): Promise<boolean> {
    const rows = await db.query(
      "SELECT id FROM site_settings WHERE site_key = ?",
      [SITE_KEY],
    );
    return rows.length > 0;
  }
}
