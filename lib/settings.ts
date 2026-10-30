import { cache } from "react";
import { DEFAULT_SETTINGS, SettingKey } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type AppSettings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<AppSettings> => {
  const rows = await prisma.setting.findMany();
  const settings = { ...DEFAULT_SETTINGS } as AppSettings;
  for (const row of rows) {
    if (row.key in settings) {
      settings[row.key as SettingKey] = row.value;
    }
  }
  return settings;
});
