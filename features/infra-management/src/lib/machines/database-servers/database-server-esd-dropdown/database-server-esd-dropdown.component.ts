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
import { DatabaseServerType } from "../model/database-server-type";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { DatabaseServerESDDropdownStateService } from "./state-service/database-server-esd-dropdown-state.service";

@Component({
  selector: "mxevolve-database-server-esd-dropdown",
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    Select,
    FormatDatePipeModule,
    ReactiveFormsModule,
  ],
  providers: [DatabaseServerESDDropdownStateService, ToastMessageService],
  standalone: true,
  templateUrl: "./database-server-esd-dropdown.component.html",
})
export class DatabaseServerESDDropdownComponent {
  readonly databaseServerESDStateService: DatabaseServerESDDropdownStateService =
    inject(DatabaseServerESDDropdownStateService);
  databaseServerESDs =
    this.databaseServerESDStateService.databaseServerESDOptions;
  readonly errorMessageSignal =
    this.databaseServerESDStateService.errorMessageSignal;

  @Input({ required: true }) form: FormGroup;
  @Input() set projectId(value: string) {
    if (value) {
      this.databaseServerESDStateService.setProjectIdSubject(value);
    }
  }
  @Input() set serverType(value: DatabaseServerType) {
    if (value) {
      this.databaseServerESDStateService.setServerTypeSubject(value);
    }
  }
  @Input() set databaseServerVersion(value: string) {
    if (value) {
      this.databaseServerESDStateService.setDatabaseServerVersion(value);
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
