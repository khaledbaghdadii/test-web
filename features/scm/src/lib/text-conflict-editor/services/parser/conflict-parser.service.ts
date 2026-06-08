import { Injectable } from "@angular/core";
import {
  CONFLICT_REGEX,
  type ConflictBlock,
  type ConflictMarkers,
  type ConflictResolution,
  type RawConflictMatch,
} from "../../models/conflict.models";

@Injectable()
export class ConflictParserService {
  parse(text: string): RawConflictMatch[] {
    const regex = new RegExp(CONFLICT_REGEX.source, CONFLICT_REGEX.flags);
    return [...text.matchAll(regex)].map((match) => {
      const startOffset = match.index ?? 0;
      return {
        startOffset,
        endOffset: startOffset + match[0].length,
        current: match[1],
        incoming: match[2],
        raw: match[0],
      };
    });
  }

  getConflictMarkers(block: ConflictBlock): ConflictMarkers {
    const lines = block.raw.split("\n");
    const separatorIndex = lines.findIndex((line) => line.trim() === "=======");
    const resolvedSeparatorIndex = separatorIndex >= 0 ? separatorIndex : 0;
    return {
      start: block.start,
      separator: block.start + resolvedSeparatorIndex,
      end: block.end - (block.raw.endsWith("\n") ? 1 : 0),
    };
  }

  getReplacementText(
    block: ConflictBlock,
    resolution: ConflictResolution
  ): string {
    const trailingNewline = block.raw.endsWith("\n") ? "\n" : "";
    switch (resolution) {
      case "current":
        return block.current + trailingNewline;
      case "incoming":
        return block.incoming + trailingNewline;
      case "both":
        return `${block.current}\n${block.incoming}${trailingNewline}`;
      default:
        return block.raw;
    }
  }
}
