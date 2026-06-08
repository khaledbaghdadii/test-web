import {
  Component,
  EventEmitter,
  Input,
  input,
  Output,
  signal,
} from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { Incident } from "../../model/incident.model";
import { SingleSelectIncidentTableComponent } from "../../single-select-incident/single-select-incident-table.component";
import { Subject } from "rxjs";

@Component({
  selector: "mxevolve-incident-input-selector-modal",
  templateUrl: "./incident-input-selector-modal.component.html",
  imports: [DialogModule, SingleSelectIncidentTableComponent, ButtonModule],
})
export class IncidentInputSelectorModalComponent {
  private _isVisible = false;

  triggerRefresh$ = new Subject<void>();
  initialSelection = input<Incident>();
  selection = signal<Incident | undefined>(undefined);

  @Input()
  set isVisible(value: boolean) {
    this._isVisible = value;
    if (value) {
      this.selection.set(this.initialSelection() ?? undefined);
      this.triggerRefresh$.next();
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() selectedIncidentChange = new EventEmitter<Incident | undefined>();

  submit() {
    this.selectedIncidentChange.emit(this.selection());
    this.hideModal();
  }

  handleCancel() {
    this.hideModal();
  }

  private hideModal() {
    this._isVisible = false;
    this.isVisibleChange.emit(false);
  }
}
