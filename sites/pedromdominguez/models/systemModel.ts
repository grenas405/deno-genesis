// models/systemModel.ts

import { SystemInfo } from "../types/system.d.ts";

const startTime = Date.now();

export class SystemModel {
  static async getInfo(): Promise<SystemInfo> {
    let frameworkVersion = "unknown";
    try {
      const text = await Deno.readTextFile("./VERSION");
      frameworkVersion = text.trim();
    } catch (err) {
      console.error("❌ Could not read VERSION file:", err);
    }

    const mem = Deno.memoryUsage();

    // ✅ NEW: Kernel + Distro
    let kernelVersion = "unknown";
    let linuxDistro = "unknown";

    try {
      const kernelCmd = new Deno.Command("uname", { args: ["-r"], stdout: "piped" });
      const distroCmd = new Deno.Command("lsb_release", { args: ["-d"], stdout: "piped" });

      const kernelOutput = await kernelCmd.output();
      const distroOutput = await distroCmd.output();

      kernelVersion = new TextDecoder().decode(kernelOutput.stdout).trim();
      linuxDistro = new TextDecoder().decode(distroOutput.stdout).replace("Description:", "").trim();
    } catch (err) {
      console.error("❌ Could not read Linux kernel or distro info:", err);
    }

    return {
      framework: "DenoGenesis",
      frameworkVersion,
      denoVersion: Deno.version.deno,
      typescriptVersion: Deno.version.typescript,
      v8Version: Deno.version.v8,
      kernelVersion,
      linuxDistro,
      memoryUsage: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        rss: mem.rss,
        external: mem.external,
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  }
}
