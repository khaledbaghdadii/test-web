import { Component, inject, model, signal } from "@angular/core";
import { Clipboard } from "@angular/cdk/clipboard";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "mxevolve-putty-configuration-dialog",
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: "./putty-configuration-dialog.component.html",
})
export class PuttyConfigurationDialogComponent {
  readonly visible = model<boolean>(false);
  private readonly clipboard = inject(Clipboard);

  readonly puttyClientConfiguration =
    '"%ProgramFiles%\\PuTTY\\putty.exe" -t -m "%TEMP%\\putty.txt" !`cmd /C echo cd "!/" ; /bin/bash --login > "%TEMP%\\putty.txt"`';

  readonly copied = signal(false);

  copyCommand(): void {
    this.clipboard.copy(this.puttyClientConfiguration);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
