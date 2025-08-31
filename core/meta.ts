// denogenesis-framework/core/meta.ts
export interface FrameworkMetadata {
  version: string;
  buildDate: string;
  gitHash?: string;
  centralizedAt: string;
  sites: SiteMetadata[];
}

export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const versionPath = "/home/admin/deno-genesis/VERSION";
  const versionContent = await Deno.readTextFile(versionPath);
  const lines = versionContent.split('\\n');

  const version = lines[0] || 'unknown';
  const buildDate = lines.find(line => line.startsWith('Build Date:'))?.replace('Build Date: ', '') || 'unknown';
  const centralizedAt = lines.find(line => line.startsWith('Centralized:'))?.replace('Centralized: ', '') || 'unknown';

  const sites = await getConnectedSites();

  return {
    version,
    buildDate,
    centralizedAt,
    sites
  };
}

export async function getConnectedSites(): Promise<SiteMetadata[]> {
  const sites: SiteMetadata[] = [];
  const sitesPath = "/home/admin/deno-genesis/sites";

  for await (const dirEntry of Deno.readDir(sitesPath)) {
    if (dirEntry.isDirectory) {
      const sitePath = `${sitesPath}/${dirEntry.name}`;
      const versionFile = `${sitePath}/FRAMEWORK_VERSION`;

      try {
        await Deno.stat(versionFile);
        const siteConfig = await readSiteConfig(`${sitePath}/site-config.ts`);

        sites.push({
          name: siteConfig.name || dirEntry.name,
          port: siteConfig.port || 3000,
          siteKey: siteConfig.siteKey || dirEntry.name,
          domain: siteConfig.domain || 'localhost',
          status: await checkSiteRunning(siteConfig.port) ? 'active' : 'inactive',
          frameworkVersion: await getSiteFrameworkVersion(versionFile)
        });
      } catch {
        // Not a framework site
      }
    }
  }

  return sites;
}

export async function getFrameworkVersion(versionFile: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(versionFile);
    return content.split('\\n')[0];
  } catch {
    return 'unknown';
  }
}

async function checkSiteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
