import { Component, forwardRef, input, model, signal } from "@angular/core";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { TestSelectionBrowserDialogComponent } from "../test-selection-browser-dialog/test-selection-browser-dialog.component";
import { InputIcon } from "primeng/inputicon";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

@Component({
  selector: "mxevolve-test-selection-browser-form-input",
  templateUrl: "./test-selection-browser-form-input.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TestSelectionBrowserFormInputComponent),
    },
  ],
  imports: [
    InputTextModule,
    IconField,
    TestSelectionBrowserDialogComponent,
    FormsModule,
    InputIcon,
    MxevolveIconComponent,
  ],
})
export class TestSelectionBrowserFormInputComponent
  implements ControlValueAccessor
{
  readonly projectId = input.required<string>();
  readonly testSequenceName = input.required<string>();
  readonly repositoryId = input.required<string>();

  readonly selectedPath = signal<string | null>(null);
  readonly dialogVisible = model(false);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  openDialog(): void {
    this.dialogVisible.set(true);
  }

  onPathSubmitted(path: string): void {
    this.selectedPath.set(path);
    this.onChange(path);
    this.onTouched();
    this.dialogVisible.set(false);
  }

  writeValue(value: string | null): void {
    this.selectedPath.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
