"use client";

import { createContext, useContext } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale } from "@/lib/i18n/config";

interface DictContextValue {
  dict: Dictionary;
  locale: Locale;
}

const DictContext = createContext<DictContextValue | null>(null);

export function DictProvider({
  dict,
  locale,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  return <DictContext.Provider value={{ dict, locale }}>{children}</DictContext.Provider>;
}

export function useDict(): DictContextValue {
  const ctx = useContext(DictContext);
  if (!ctx) throw new Error("useDict must be used inside <DictProvider>");
  return ctx;
}
