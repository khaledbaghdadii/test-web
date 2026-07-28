import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Card } from "primeng/card";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "mxevolve-value-card",
  templateUrl: "./value-card.component.html",
  imports: [Card, Tooltip, Skeleton, ErrorAlertComponent, FaIconComponent],
})
export class ValueCardComponent {
  @Input() value: string;
  @Input() description: string;
  @Input() tooltip: string;
  @Input() loading: boolean;
  @Input() error: string;
  @Input() isClickable = false;
  @Input() selected = false;

  @Output() clicked = new EventEmitter<void>();

  infoIcon = faInfoCircle;

  onClick(): void {
    if (!this.isClickable || this.loading) return;
    this.clicked.emit();
  }
}
