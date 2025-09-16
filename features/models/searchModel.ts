// searchModel.ts
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
// Or import { cheerio } from "https://deno.land/x/cheerio/mod.ts";

export function parseHtmlContent(html: string): { title: string; text: string } {
  // Use DOMParser to parse the HTML string
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) {
    // If parsing fails, return fallback values
    return { title: "", text: html };
  }
  const title = doc.querySelector("title")?.textContent || "";
  // Remove scripts and styles from the DOM before getting text
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  const bodyText = doc.querySelector("body")?.textContent || doc.body?.textContent || doc.textContent || "";
  return { title, text: bodyText };
}
