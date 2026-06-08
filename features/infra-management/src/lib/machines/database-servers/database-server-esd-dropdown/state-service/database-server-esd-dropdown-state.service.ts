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
import { DatabaseServerType } from "../../model/database-server-type";
import { DatabaseServersService } from "../../database-servers.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";

@Injectable()
export class DatabaseServerESDDropdownStateService {
  readonly databaseServerESDOptions: Signal<string[]>;
  private readonly projectIdSubject = new BehaviorSubject<string>("");
  private readonly serverTypeSubject = new Subject<DatabaseServerType>();
  private readonly databaseServerVersionSubject = new Subject<string>();

  readonly errorMessageSignal = signal<string>("");

  constructor(private databaseServersService: DatabaseServersService) {
    this.databaseServerESDOptions = toSignal(
      combineLatest([
        this.projectIdSubject,
        this.serverTypeSubject,
        this.databaseServerVersionSubject,
      ]).pipe(
        switchMap(([projectId, serverType, databaseServerVersion]) => {
          return this.databaseServersService
            .getDatabaseServerVersions(projectId, serverType)
            .pipe(
              map((response) => {
                const matchingVersion = (
                  response?.databaseServerVersions || []
                ).find((server) => server.version === databaseServerVersion);
                return matchingVersion?.engineSpecificDetails || [];
              }),
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

  setDatabaseServerVersion(databaseServerVersion: string): void {
    this.databaseServerVersionSubject.next(databaseServerVersion);
  }
}
