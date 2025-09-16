import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join, relative } from "https://deno.land/std@0.224.0/path/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import type { SearchResult } from "../types/search.ts";

export const SearchService = {
  async searchSite(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const PAGES_DIR = join(Deno.cwd(), "public/pages");

    for await (const entry of walk(PAGES_DIR, { exts: [".html"], includeDirs: false })) {
      if (entry.path.endsWith("/search.html")) continue;

      let content: string;
      try {
        content = await Deno.readTextFile(entry.path);
      } catch (err) {
        console.error(`❌ Failed to read: ${entry.path}`, err);
        continue;
      }

      const doc = new DOMParser().parseFromString(content, "text/html");
      if (!doc) continue;

      const text = doc.body?.textContent || "";
      const lowerText = text.toLowerCase();
      const idx = lowerText.indexOf(lowerQuery);

      if (idx !== -1) {
        const snippetRadius = 60;
        const start = Math.max(idx - snippetRadius, 0);
        const end = Math.min(idx + lowerQuery.length + snippetRadius, text.length);
        let snippet = text.slice(start, end).trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < text.length) snippet += "...";

        const title = doc.querySelector("title")?.textContent?.trim() || "Untitled";

        // ✅ Always generate full /pages/ path
        let relativePath = relative(PAGES_DIR, entry.path);
        let urlPath = `/pages/${relativePath}`;

        // Ensure it ends with .html (should be true from walk filter, but safe!)
        if (!urlPath.endsWith(".html")) {
          urlPath += ".html";
        }

        console.log(`🔗 Final Search URL: ${urlPath}`);

        results.push({ title, url: urlPath, snippet });
      }
    }

    console.log(`✅ Search complete. Matches: ${results.length}`);
    return results;
  },
};