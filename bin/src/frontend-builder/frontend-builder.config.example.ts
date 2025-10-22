// frontend-builder Configuration Example
// Copy this file to frontend-builder.config.ts and customize

export interface Config {
  // Add your configuration options here
  debug: boolean;
  outputFormat: "text" | "json" | "yaml";
}

export const config: Config = {
  debug: false,
  outputFormat: "text"
};

export default config;
