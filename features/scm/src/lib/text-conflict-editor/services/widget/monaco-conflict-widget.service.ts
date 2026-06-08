import { Injectable } from "@angular/core";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { ContentWidgetPosition } from "@mxflow/ui/monaco-editor";
import {
  type ConflictBlock,
  type ConflictResolution,
} from "../../models/conflict.models";

type ConflictWidgetAction = {
  readonly label: string;
  readonly resolution: ConflictResolution;
  readonly cssClass: string;
};

const CONFLICT_WIDGET_ACTIONS: readonly ConflictWidgetAction[] = [
  {
    label: "Accept Current",
    resolution: "current",
    cssClass: "conflict-widget__action--current",
  },
  {
    label: "Accept Incoming",
    resolution: "incoming",
    cssClass: "conflict-widget__action--incoming",
  },
  {
    label: "Accept Both",
    resolution: "both",
    cssClass: "conflict-widget__action--both",
  },
];

@Injectable()
export class MonacoConflictWidgetService {
  private readonly widgets = new Map<string, monaco.editor.IContentWidget>();
  private readonly widgetZoneIds = new Map<string, string>();
  private abortController = new AbortController();

  createWidgets(
    editor: monaco.editor.IStandaloneCodeEditor,
    blocks: ConflictBlock[],
    onResolve: (block: ConflictBlock, resolution: ConflictResolution) => void
  ): void {
    this.clearWidgets(editor);
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.createWidgetZones(editor, blocks);
    for (const block of blocks) {
      const widget = this.buildWidget(block, onResolve, signal);
      this.widgets.set(block.id, widget);
      editor.addContentWidget(widget);
    }
  }

  clearWidgets(editor: monaco.editor.IStandaloneCodeEditor): void {
    this.abortController.abort();
    for (const widget of this.widgets.values()) {
      editor.removeContentWidget(widget);
    }
    this.widgets.clear();
    this.clearWidgetZones(editor);
  }

  private buildWidget(
    block: ConflictBlock,
    onResolve: (block: ConflictBlock, resolution: ConflictResolution) => void,
    signal: AbortSignal
  ): monaco.editor.IContentWidget {
    let domNode: HTMLElement | null = null;
    return {
      getId: () => `conflict-widget-${block.id}`,
      getDomNode: () =>
        (domNode ??= this.createWidgetDom(block, onResolve, signal)),
      getPosition: () => ({
        position: { lineNumber: block.start, column: 1 },
        preference: [ContentWidgetPosition.ABOVE],
      }),
    };
  }

  private createWidgetZones(
    editor: monaco.editor.IStandaloneCodeEditor,
    blocks: ConflictBlock[]
  ): void {
    editor.changeViewZones((accessor) => {
      for (const block of blocks) {
        const zoneDomNode = document.createElement("div");
        zoneDomNode.className = "conflict-widget-zone";
        const zoneId = accessor.addZone({
          afterLineNumber: Math.max(block.start - 1, 0),
          heightInPx: 26,
          domNode: zoneDomNode,
        });
        this.widgetZoneIds.set(block.id, zoneId);
      }
    });
  }

  private clearWidgetZones(editor: monaco.editor.IStandaloneCodeEditor): void {
    if (this.widgetZoneIds.size === 0) return;

    editor.changeViewZones((accessor) => {
      for (const zoneId of this.widgetZoneIds.values()) {
        accessor.removeZone(zoneId);
      }
    });

    this.widgetZoneIds.clear();
  }

  private createWidgetDom(
    block: ConflictBlock,
    onResolve: (block: ConflictBlock, resolution: ConflictResolution) => void,
    signal: AbortSignal
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "conflict-widget";
    CONFLICT_WIDGET_ACTIONS.forEach((action, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "conflict-widget__separator";
        sep.textContent = "|";
        container.appendChild(sep);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `conflict-widget__action ${action.cssClass}`;
      btn.textContent = action.label;
      btn.addEventListener("click", () => onResolve(block, action.resolution), {
        signal,
      });
      container.appendChild(btn);
    });
    return container;
  }
}
