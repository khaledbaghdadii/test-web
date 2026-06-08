import { Injectable, signal, Signal } from "@angular/core";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  map,
  Subject,
  switchMap,
} from "rxjs";
import { DatabaseServersService } from "../../database-servers.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { DatabaseServerType } from "../../model/database-server-type";

@Injectable()
export class DatabaseServerVersionDropdownStateService {
  readonly databaseServerVersionOptions: Signal<string[]>;
  private readonly projectIdSubject = new BehaviorSubject<string>("");
  private readonly serverTypeSubject = new Subject<DatabaseServerType>();

  readonly errorMessageSignal = signal<string>("");

  constructor(private databaseServersService: DatabaseServersService) {
    this.databaseServerVersionOptions = toSignal(
      combineLatest([this.projectIdSubject, this.serverTypeSubject]).pipe(
        switchMap(([projectId, serverType]) => {
          return this.databaseServersService
            .getDatabaseServerVersions(projectId, serverType)
            .pipe(
              map((response) =>
                (response?.databaseServerVersions || []).map(
                  (server) => server.version
                )
              ),
              catchError((error) => {
                this.setErrorMessageSignal(error.message);
                return EMPTY;
              })
            );
        }),
        takeUntilDestroyed()
      ),
      { initialValue: [] }
    );
  }

  private setErrorMessageSignal(message: string): void {
    this.errorMessageSignal.set(message);
  }

  setProjectIdSubject(projectId: string): void {
    this.projectIdSubject.next(projectId);
  }

  setServerTypeSubject(serverType: DatabaseServerType): void {
    this.serverTypeSubject.next(serverType);
  }
}
