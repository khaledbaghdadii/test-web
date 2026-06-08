import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  Signal,
} from "@angular/core";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { Select, SelectModule } from "primeng/select";
import { FormatDatePipeModule } from "@mxflow/pipe";

import { ToastMessageService } from "@mxflow/ui/alert";
import { DatabaseServerVersionDropdownStateService } from "./state-service/database-server-version-dropdown-state.service";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { DatabaseServerType } from "../model/database-server-type";

@Component({
  selector: "mxevolve-database-server-version-dropdown",
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    Select,
    FormatDatePipeModule,
    ReactiveFormsModule,
  ],
  providers: [DatabaseServerVersionDropdownStateService, ToastMessageService],
  standalone: true,
  templateUrl: "./database-server-version-dropdown.component.html",
})
export class DatabaseServerVersionDropdownComponent {
  readonly databaseServerVersionStateService: DatabaseServerVersionDropdownStateService =
    inject(DatabaseServerVersionDropdownStateService);
  databaseServerVersionOptions =
    this.databaseServerVersionStateService.databaseServerVersionOptions;
  readonly errorMessageSignal =
    this.databaseServerVersionStateService.errorMessageSignal;

  @Input({ required: true }) form: FormGroup;
  @Input() set projectId(value: string) {
    if (value) {
      this.databaseServerVersionStateService.setProjectIdSubject(value);
    }
  }
  @Input() set serverType(value: DatabaseServerType) {
    if (value) {
      this.databaseServerVersionStateService.setServerTypeSubject(value);
    }
  }

  constructor() {
    this.subscribeToSignals();
  }

  @Output() errorEventEmitter = new EventEmitter<string>();

  private subscribeToSignals(): void {
    this.handleSignal(this.errorMessageSignal, (error: string) => {
      if (error) this.errorEventEmitter.emit(error);
    });
  }

  private handleSignal<T>(signal: Signal<T>, action: (value: T) => void): void {
    toObservable(signal).pipe(takeUntilDestroyed()).subscribe(action);
  }
}
