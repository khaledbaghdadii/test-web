import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from "@angular/core";
import { CUSTOM_ICONS_PATH } from "../custom-icons/custom-icon-urls.token";
import { resolveMaterialIconName } from "./names/mx-icon-names";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

@Component({
  selector: "mxevolve-icon",
  standalone: true,
  templateUrl: "./mxevolve-icon.component.html",
  styleUrl: "./mxevolve-icon.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.mxevolve-icon-filled]": "filled()",
    "[class.mxevolve-icon-spin]": "spin()",
    "[class]": "sizeClass()",
    "[style.color]": "color()",
  },
})
export class MxevolveIconComponent {
  private readonly basePath = inject(CUSTOM_ICONS_PATH, { optional: true });

  readonly name = input.required<string>();
  readonly size = input<IconSize>();
  readonly color = input<string>();
  readonly filled = input(false);
  readonly spin = input(false);
  readonly ariaLabel = input<string>();

  protected readonly sizeClass = computed(() => {
    const s = this.size();
    return s ? `mxevolve-icon-${s}` : "";
  });

  protected materialName = "";
  protected iconUrl?: string;
  protected iconNotFound = false;

  constructor() {
    effect(() => this.resolve(this.name()));
  }

  private resolve(name: string): void {
    this.iconNotFound = false;

    const materialName = resolveMaterialIconName(name);
    if (materialName) {
      this.iconUrl = undefined;
      this.materialName = materialName;
      return;
    }

    // Not a material icon — try custom icon via base path
    if (this.basePath) {
      this.materialName = "";
      this.iconUrl = `${this.basePath}/${name}.svg`;
      return;
    }

    this.iconUrl = undefined;
    this.materialName = "";
    this.iconNotFound = true;
    console.error(
      `[MxevolveIcon] Icon "${name}" not found. ` +
        `Add it to MX_ICON_NAMES or provide CUSTOM_ICONS_PATH.`
    );
  }
}
