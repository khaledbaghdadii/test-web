import { Component } from "@angular/core";
import { PrimeNG } from "primeng/config";
import { MXEvolveCustomTheme } from "@mxflow/ui/utils";

@Component({
  selector: "ci-process",
  templateUrl: `ci-process.component.html`,
  standalone: false,
})
export class CiProcessComponent {
  constructor(private primeng: PrimeNG) {
    this.primeng.theme.set({
      preset: MXEvolveCustomTheme,
      options: {
        darkModeSelector: ".app-dark",
        cssLayer: {
          name: "primeng",
          order: "tailwind-base, primeng, tailwind-utilities",
        },
      },
    });
  }
}
