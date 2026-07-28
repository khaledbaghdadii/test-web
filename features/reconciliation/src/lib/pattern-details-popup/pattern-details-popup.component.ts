import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { PatternDetailsComponent } from "../pattern-details/pattern-details.component";
import { PatternDetails } from "../pattern-details/pattern-details.model";
@Component({
  selector: "mxevolve-pattern-details-popup",
  templateUrl: "./pattern-details-popup.component.html",
  styleUrls: ["./pattern-details-popup.component.scss"],
  standalone: true,
  imports: [DialogModule, PatternDetailsComponent],
})
export class PatternDetailsPopupComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() patternInstanceId?: string;
  @Input() projectId?: string;
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() rootCauseClicked = new EventEmitter<number>();
  maximized = false;
  patternDetails: PatternDetails | null = null;
  open(): void {
    if (!this.visible) {
      this.onVisibleChange(true);
    }
  }
  close(): void {
    if (this.visible) {
      this.onVisibleChange(false);
    }
  }
  onVisibleChange(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (visible) {
      this.opened.emit();
    } else {
      this.closed.emit();
    }
  }
  toggleMaximized(): void {
    this.maximized = !this.maximized;
  }
  onDetailsLoaded(details: PatternDetails): void {
    this.patternDetails = details;
  }
}
