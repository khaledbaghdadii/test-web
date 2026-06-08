import { Component, input, model, output, signal } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { Button } from "primeng/button";
import { TestSelectionBrowserComponent } from "../test-selection-browser/test-selection-browser.component";
import { PrimeTemplate } from "primeng/api";
import { toObservable } from "@angular/core/rxjs-interop";

@Component({
  selector: "mxevolve-test-selection-browser-dialog",
  imports: [Dialog, Button, TestSelectionBrowserComponent, PrimeTemplate],
  templateUrl: "./test-selection-browser-dialog.component.html",
})
export class TestSelectionBrowserDialogComponent {
  readonly visible = model(false);
  readonly projectId = input.required<string>();
  readonly testSequenceName = input.required<string>();
  readonly repositoryId = input.required<string>();

  readonly currentPath = signal<string | null>(null);
  readonly testSelectionPathSelected = output<string>();

  setSelectedPath(path: string): void {
    this.currentPath.set(path);
  }

  submit(): void {
    const path = this.currentPath();
    if (path) {
      this.testSelectionPathSelected.emit(path);
    }
    this.visible.set(false);
  }

  constructor() {
    toObservable(this.visible).subscribe((isVisible) => {
      if (!isVisible) {
        this.currentPath.set(null);
      }
    });
  }
}
