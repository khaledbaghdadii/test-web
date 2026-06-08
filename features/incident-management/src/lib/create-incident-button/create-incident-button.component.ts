import { Store } from "@ngrx/store";
import { ButtonModule } from "primeng/button";
import { HttpParams } from "@angular/common/http";
import {
  catchError,
  concatMap,
  filter,
  first,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  toArray,
} from "rxjs";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Component, inject, Input, OnDestroy } from "@angular/core";
import {
  Environment,
  EnvironmentService,
  EnvironmentStatus,
} from "@mxflow/features/environment";
import { JumpType } from "../model/jump-type.model";
import { IncidentService } from "../incident.service";
import {
  BusinessProcessExecutionService,
  BusinessProcessResource,
  BusinessProcessResourcesService,
} from "@mxflow/features/business-process";
import { QualityLevel } from "../model/quality-level";

@Component({
  imports: [ButtonModule],
  providers: [
    IncidentService,
    EnvironmentService,
    BusinessProcessExecutionService,
    BusinessProcessResourcesService,
  ],
  selector: "mxevolve-create-incident-button",
  template: `
    <p-button
      label="{{ buttonLabel }}"
      severity="secondary"
      [loading]="isButtonLoading"
      (click)="onNavigate()"
    ></p-button>
  `,
})
export class CreateIncidentButtonComponent implements OnDestroy {
  private readonly jiraConfig = inject<JiraConfig>(JIRA_CONFIG);
  private readonly store = inject(Store);
  private readonly environmentService = inject(EnvironmentService);

  private readonly businessProcessExecutionService = inject(
    BusinessProcessExecutionService
  );

  private readonly businessProcessResourcesService = inject(
    BusinessProcessResourcesService
  );

  private readonly destroy$ = new Subject();
  private projectName: string;
  private environmentInfo: string;
  private referenceEnvironmentInfo: string;
  private contextName: string;
  private readonly config: JiraConfig["incident"];
  private url: string;
  private readonly safe = (value: string | undefined) => value ?? "-";
  private correlationId: string | undefined;

  isButtonLoading = false;

  @Input() buttonLabel = "Create";
  @Input() mxVersion: string | undefined;
  @Input() projectId: string;
  @Input() scenarioName: string | undefined;
  @Input() scenarioExecutionId: string | undefined;
  @Input() businessProcessExecutionId: string | undefined;
  @Input() environmentId: string | undefined;
  @Input() jumpType: string | undefined;
  @Input() correlationId$: Observable<string | undefined> | undefined;
  @Input() qualityLevel: string | undefined;

  constructor() {
    this.config = this.jiraConfig.incident;
  }

  onNavigate() {
    this.isButtonLoading = true;

    forkJoin([
      this.getProjectName$(),
      this.getEnvironmentFields$(),
      this.getCorrelationId$(),
      this.getReferenceEnvironments$(),
      this.getBusinessProcessName$(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.handleNavigation());
  }

  private handleNavigation() {
    this.isButtonLoading = false;
    const params = this.constructQueryParams();
    this.url = `${this.config.createIncidentUrl}?${params.toString()}`;
    window.open(this.url, "_blank");
  }

  private getProjectName$() {
    return this.store.select(GlobalSelectors.getProjectName).pipe(
      first(),
      tap((projectName) => {
        this.projectName = projectName;
      }),
      catchError(() => of(undefined))
    );
  }

  private getEnvironmentFields$() {
    if (this.environmentId) {
      return this.environmentService
        .getEnvironmentExecutionById(this.projectId, this.environmentId)
        .pipe(
          tap((environment) => {
            this.environmentInfo = this.constructEnvironmentInfo(environment);
          }),
          catchError(() => of(undefined))
        );
    } else {
      return of(undefined);
    }
  }

  private getReferenceEnvironments$() {
    if (this.businessProcessExecutionId) {
      return this.businessProcessResourcesService
        .getBusinessProcessResources(
          this.projectId,
          this.businessProcessExecutionId,
          true
        )
        .pipe(
          switchMap((businessProcessResources) => {
            const referenceEnvironmentIds = this.getReferenceEnvironmentIds(
              of(businessProcessResources)
            );
            return this.getActiveReferenceEnvironmentsInfoFromIds$(
              referenceEnvironmentIds
            );
          }),

          catchError(() => of(undefined))
        );
    } else {
      return of(undefined);
    }
  }

  private getReferenceEnvironmentIds(
    businessProcessResources$: Observable<BusinessProcessResource[]>
  ) {
    return businessProcessResources$.pipe(
      mergeMap((resources) => resources),
      map((resource) => resource.resourceId),
      toArray()
    );
  }

  private getActiveReferenceEnvironmentsInfoFromIds$(
    referenceEnvironmentIds$: Observable<string[]>
  ) {
    return referenceEnvironmentIds$.pipe(
      mergeMap((linkedEnvironmentIds) => linkedEnvironmentIds),
      concatMap((linkedEnvironmentId) =>
        this.environmentService.getEnvironmentExecutionById(
          this.projectId,
          linkedEnvironmentId
        )
      ),
      filter(
        (referenceEnvironment) =>
          referenceEnvironment.status === EnvironmentStatus.READY
      ),
      map((referenceEnvironment) =>
        this.constructEnvironmentInfo(referenceEnvironment)
      ),
      toArray(),
      tap(
        (referenceEnvironments) =>
          (this.referenceEnvironmentInfo = referenceEnvironments.join("\n\n"))
      )
    );
  }

  private getBusinessProcessName$() {
    if (this.businessProcessExecutionId) {
      return this.businessProcessExecutionService
        .getBusinessProcessExecution(
          this.projectId,
          this.businessProcessExecutionId
        )
        .pipe(
          map((bpExecution) => bpExecution.name),
          tap((bpName) => {
            this.contextName = bpName;
          }),
          catchError(() => of(undefined))
        );
    } else {
      return of(undefined);
    }
  }

  private getCorrelationId$(): Observable<string | undefined> {
    if (this.correlationId$) {
      return this.correlationId$.pipe(
        tap((id) => (this.correlationId = id)),
        catchError(() => of(undefined))
      );
    } else {
      return of(undefined);
    }
  }

  private constructEnvironmentInfo(environment: Environment) {
    const environmentSegments = this.getEnvironmentInfoSegments(
      environment
    ).concat(this.getDatabasesInfoSegments(environment));
    return environmentSegments.join("\n");
  }

  private getEnvironmentInfoSegments(environment: Environment): string[] {
    const application = environment.primaryApplicative!;
    const directory = environment.clients?.pop();
    const bundle = environment.bundles?.[0];

    return [
      `Environment Id: ${this.safe(environment.id)}`,
      `MX Hostname: ${this.safe(application?.allocation?.machine?.name)}`,
      `MX Client Directory: ${this.safe(directory?.directory)}`,
      `Port Range: ${this.safe(
        application?.allocation?.ports?.start?.toString()
      )} to ${this.safe(application?.allocation?.ports?.end?.toString())}`,
      `Appdir: ${this.safe(application?.directory)}`,
      `MX version: ${this.safe(bundle?.branch)}`,
      `BuildId: ${this.safe(bundle?.version)}`,
      "Database(s):",
    ];
  }

  private getDatabasesInfoSegments(environment: Environment): string[] {
    let databaseInfoSegments: string[] = [];
    environment.databases?.forEach((database) => {
      databaseInfoSegments = [
        ...databaseInfoSegments,
        `DB Name: ${this.safe(database?.name)}`,
        `DB Host: ${this.safe(database?.allocation?.machine?.name)}`,
        `DB Port: ${this.safe(database?.allocation?.port)}`,
        "",
      ];
    });
    return databaseInfoSegments;
  }

  private constructQueryParams(): HttpParams {
    let params = new HttpParams()
      .set("pid", this.config.incidentProjectId)
      .set(this.config.projectIdJiraCustomField, this.projectId);

    if (this.scenarioName) {
      params = params.set(
        this.config.scenarioNameCustomField,
        this.scenarioName
      );
    }

    if (this.projectName) {
      params = params.set(this.config.clientNameCustomField, this.projectName);
    }
    if (this.mxVersion) {
      params = params.set(this.config.mxVersionCustomField, this.mxVersion);
    }
    if (this.environmentInfo) {
      params = params.set(
        this.config.environmentInfoCustomField,
        this.environmentInfo
      );
    }
    if (this.contextName) {
      params = params.set(this.config.contextNameCustomField, this.contextName);
    }
    if (this.referenceEnvironmentInfo) {
      params = params.set(
        this.config.referenceEnvironmentInfoCustomField,
        this.referenceEnvironmentInfo
      );
    }
    if (this.correlationId) {
      params = params.set(
        this.config.correlationIdJiraCustomField,
        this.correlationId
      );
    }
    if (this.qualityLevel) {
      params = params.set(
        this.config.detectionLevelQualityGateIdCustomField,
        this.getQualityLevelValue(this.qualityLevel)
      );
    }

    params = params.set("priority", this.getPriorityValue());
    params = params.set("issuetype", this.getIssueType());

    return params;
  }

  private getQualityLevelValue(qualityLevel: string): string {
    switch (qualityLevel) {
      case QualityLevel.CQG:
        return this.config.detectionLevelQualityGateCqgValue;
      case QualityLevel.MQG:
        return this.config.detectionLevelQualityGateMqgValue;
      case QualityLevel.DQG:
        return this.config.detectionLevelQualityGateDqgValue;
      default:
        return qualityLevel;
    }
  }

  private getPriorityValue(): string {
    return this.jumpType === JumpType.CONTINUOUS_GREENING &&
      this.qualityLevel === QualityLevel.MQG
      ? "2"
      : "3";
  }

  private getIssueType(): string {
    return this.jumpType === JumpType.MAINSTREAM_ACTIVATION
      ? this.config.mainstreamActivationIncidentIssueTypeValue
      : this.config.continuousGreeningIncidentIssueTypeValue;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
