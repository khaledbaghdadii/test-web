import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from "@angular/core";
import { ILLUSTRATIONS_PATH } from "./illustration-urls.token";

export type IllustrationSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

@Component({
  selector: "mxevolve-illustration",
  standalone: true,
  templateUrl: "./mxevolve-illustration.component.html",
  styleUrl: "./mxevolve-illustration.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class]": "sizeClass()",
  },
})
export class MxevolveIllustrationComponent {
  private readonly basePath = inject(ILLUSTRATIONS_PATH, { optional: true });

  readonly name = input.required<string>();
  readonly size = input<IllustrationSize>();
  readonly ariaLabel = input<string>();

  protected readonly sizeClass = computed(() => {
    const s = this.size();
    return s ? `mxevolve-illustration-${s}` : "";
  });

  protected illustrationUrl?: string;
  protected notFound = false;

  constructor() {
    effect(() => this.resolve(this.name()));
  }

  private resolve(name: string): void {
    this.notFound = false;

    if (this.basePath) {
      this.illustrationUrl = `${this.basePath}/${name}.svg`;
    } else {
      this.illustrationUrl = undefined;
      this.notFound = true;
      console.error(
        `[MxevolveIllustration] Illustration "${name}" not found. ` +
          `Provide ILLUSTRATIONS_PATH in your app config.`
      );
    }
  }
}
