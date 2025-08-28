import { SystemModel } from "../models/systemModel.ts";
import { SystemInfo } from "../types/system.d.ts";

export async function getSystemInfo(): Promise<SystemInfo> {
  return await SystemModel.getInfo();
}