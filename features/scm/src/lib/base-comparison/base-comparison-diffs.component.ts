import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MonacoDiffViewerComponent } from "@mxflow/ui/monaco-editor";
import { BaseComparisonDiffViewerOptions } from "./model/base-comparison-diffs.model";

export type { BaseComparisonDiffViewerOptions } from "./model/base-comparison-diffs.model";

@Component({
  selector: "mxevolve-base-comparison-diffs",
  standalone: true,
  imports: [MonacoDiffViewerComponent],
  template: `
    <div class="flex h-full gap-3">
      <mxevolve-monaco-diff-viewer
        class="flex-1 min-w-0"
        [title]="localDiffTitle()"
        [originalContent]="baseContent()"
        [modifiedContent]="localContent()"
        [language]="language()"
        [options]="viewerOptions()"
      />
      <mxevolve-monaco-diff-viewer
        class="flex-1 min-w-0"
        [title]="remoteDiffTitle()"
        [originalContent]="baseContent()"
        [modifiedContent]="remoteContent()"
        [language]="language()"
        [options]="viewerOptions()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComparisonDiffsComponent {
  readonly baseContent = input.required<string>();
  readonly localContent = input<string | null>(null);
  readonly remoteContent = input<string | null>(null);
  readonly language = input("plaintext");

  readonly baseLabel = input("Base");
  readonly localLabel = input("Local");
  readonly remoteLabel = input("Remote");

  readonly viewerOptions = input<BaseComparisonDiffViewerOptions>({
    readOnly: true,
    renderSideBySide: true,
  });

  readonly localDiffTitle = computed(() =>
    this.buildTitle(this.localLabel(), this.localContent())
  );

  readonly remoteDiffTitle = computed(() =>
    this.buildTitle(this.remoteLabel(), this.remoteContent())
  );

  private buildTitle(label: string, content: string | null): string {
    const deletedSuffix = content === null ? " (deleted)" : "";
    return `${label}${deletedSuffix} vs ${this.baseLabel()}`;
  }
}
