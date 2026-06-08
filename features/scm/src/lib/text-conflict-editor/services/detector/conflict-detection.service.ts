import { inject, Injectable } from "@angular/core";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import {
  MonacoEditorService,
  OverviewRulerLane,
} from "@mxflow/ui/monaco-editor";
import {
  CONFLICT_CSS_CLASSES,
  CONFLICT_COLORS,
  type ConflictBlock,
} from "../../models/conflict.models";
import { ConflictParserService } from "../parser/conflict-parser.service";

@Injectable()
export class ConflictDetectionService {
  private readonly parser = inject(ConflictParserService);
  private readonly monacoService = inject(MonacoEditorService);
  private static readonly FIRST_COLUMN = 1;

  detectConflicts(
    text: string,
    model: monaco.editor.ITextModel
  ): ConflictBlock[] {
    const matches = this.parser.parse(text);

    return matches.map((match, index) => {
      const startPos = model.getPositionAt(match.startOffset);
      const endPos = model.getPositionAt(match.endOffset);

      return {
        ...match,
        id: `conflict-${index}-L${startPos.lineNumber}`,
        start: startPos.lineNumber,
        end: endPos.lineNumber,
      };
    });
  }

  createDecorations(
    blocks: ConflictBlock[]
  ): monaco.editor.IModelDeltaDecoration[] {
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    for (const block of blocks) {
      const markers = this.parser.getConflictMarkers(block);

      // Marker lines (<<<<<<, =======, >>>>>>>)
      decorations.push(
        this.createMarkerDecoration(markers.start, CONFLICT_CSS_CLASSES.head),
        this.createMarkerDecoration(
          markers.separator,
          CONFLICT_CSS_CLASSES.separator
        ),
        this.createMarkerDecoration(markers.end, CONFLICT_CSS_CLASSES.end)
      );

      // Current (ours) range background
      if (markers.start + 1 <= markers.separator - 1) {
        decorations.push(
          this.createRangeDecoration(
            markers.start + 1,
            markers.separator - 1,
            CONFLICT_CSS_CLASSES.currentRange,
            CONFLICT_COLORS.rulerCurrent,
            OverviewRulerLane.LEFT
          )
        );
      }

      // Incoming (theirs) range background
      if (markers.separator + 1 <= markers.end - 1) {
        decorations.push(
          this.createRangeDecoration(
            markers.separator + 1,
            markers.end - 1,
            CONFLICT_CSS_CLASSES.incomingRange,
            CONFLICT_COLORS.rulerIncoming,
            OverviewRulerLane.RIGHT
          )
        );
      }

      // Full conflict block overview ruler marker
      decorations.push({
        range: this.monacoService.createRange(
          markers.start,
          ConflictDetectionService.FIRST_COLUMN,
          markers.end,
          ConflictDetectionService.FIRST_COLUMN
        ),
        options: {
          overviewRuler: {
            color: CONFLICT_COLORS.rulerConflict,
            position: OverviewRulerLane.CENTER,
          },
        },
      });
    }

    return decorations;
  }

  private createMarkerDecoration(
    line: number,
    className: string
  ): monaco.editor.IModelDeltaDecoration {
    return {
      range: this.monacoService.createRange(
        line,
        ConflictDetectionService.FIRST_COLUMN,
        line,
        ConflictDetectionService.FIRST_COLUMN
      ),
      options: {
        isWholeLine: true,
        inlineClassName: className,
      },
    };
  }

  private createRangeDecoration(
    startLine: number,
    endLine: number,
    className: string,
    color: string,
    lane: monaco.editor.OverviewRulerLane
  ): monaco.editor.IModelDeltaDecoration {
    return {
      range: this.monacoService.createRange(
        startLine,
        ConflictDetectionService.FIRST_COLUMN,
        endLine,
        ConflictDetectionService.FIRST_COLUMN
      ),
      options: {
        isWholeLine: true,
        className,
        overviewRuler: {
          color,
          position: lane,
        },
      },
    };
  }
}
