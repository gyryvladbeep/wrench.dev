"use client";
import { CommandBuilder } from "./mobile/CommandBuilder";
import { simctlCommands, simctlGlobalFields } from "@/lib/mobile/simctl-commands";
import { Dictionary } from "@/lib/i18n/dictionary-types";

export function SimctlCommandBuilderTool({ dict }: { dict: Dictionary }) {
  return <CommandBuilder isRu={dict.isRu} commands={simctlCommands} globalFields={simctlGlobalFields} idPrefix="simctl" />;
}
