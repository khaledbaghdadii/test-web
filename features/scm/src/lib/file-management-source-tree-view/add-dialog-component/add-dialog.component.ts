import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";

export interface SourceTreeAddRequest {
  type: "file" | "directory";
  name: string;
}

@Component({
  selector: "mxevolve-file-management-source-tree-add-dialog",
  standalone: true,
  imports: [Dialog, FormsModule, RadioButton, InputText, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./add-dialog.component.html",
})
export class FileManagementSourceTreeAddDialogComponent {
  readonly visible = input<boolean>(false);
  readonly parentPath = input<string | null>(null);

  readonly addRequested = output<SourceTreeAddRequest>();
  readonly cancelled = output<void>();

  readonly selectedType = signal<"file" | "directory">("file");
  readonly name = signal<string>("");

  protected readonly dialogHeader = computed(() => {
    const type = this.selectedType();
    const parent = this.parentPath();
    const location = parent ? `inside ${parent}` : "at root";
    return `Create new ${type} ${location}`;
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.reset();
      }
    });
  }

  onCreate(): void {
    const trimmedName = this.name().trim();
    if (!trimmedName) {
      return;
    }
    this.addRequested.emit({ type: this.selectedType(), name: trimmedName });
    this.reset();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.cancelled.emit();
      this.reset();
    }
  }

  private reset(): void {
    this.selectedType.set("file");
    this.name.set("");
  }
}
