"use client";
import { CommandBuilder } from "./mobile/CommandBuilder";
import { adbCommands, adbGlobalFields } from "@/lib/mobile/adb-commands";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function AdbCommandBuilderTool({ dict }: { dict: Dictionary }) {
  return <CommandBuilder isRu={dict.isRu} commands={adbCommands} globalFields={adbGlobalFields} idPrefix="adb" />;
}
