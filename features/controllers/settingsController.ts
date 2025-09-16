// /controllers/siteSettingsController.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { SiteSettingsService } from "../services/siteSettingsService.ts";
import { SiteSettingsInput } from "../types/siteSettings.d.ts";

export const getSiteSettings = async (ctx: Context) => {
  try {
    const settings = await SiteSettingsService.getSettings();

    if (!settings) {
      console.warn(`⚠️ No settings found for site key: ${Deno.env.get("SITE_KEY")}`);
      ctx.response.status = 404;
      ctx.response.body = { error: `Settings not found for ${Deno.env.get("SITE_KEY")}` };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = settings;
  } catch (err) {
    console.error("❌ Error fetching settings:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const updateSiteSettings = async (ctx: Context) => {
  try {
    const { value } = await ctx.request.body({ type: "json" });
    const {
      heroHeadline, contactEmail, businessPhone,
      footerText, primaryColor, secondaryColor,
      aboutUsText, facebookUrl, instagramUrl,
      twitterUrl, trackingCode
    } = await value;

    if (!heroHeadline || !contactEmail || !businessPhone) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Hero headline, contact email, and phone are required"
      };
      return;
    }

    const input: SiteSettingsInput = {
      heroHeadline, contactEmail, businessPhone,
      footerText, primaryColor, secondaryColor,
      aboutUsText, facebookUrl, instagramUrl,
      twitterUrl, trackingCode,
    };

    await SiteSettingsService.upsertSettings(input);

    ctx.response.status = 200;
    ctx.response.body = { message: `Settings updated for ${Deno.env.get("SITE_KEY")}` };
  } catch (err) {
    console.error("❌ Error updating settings:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};