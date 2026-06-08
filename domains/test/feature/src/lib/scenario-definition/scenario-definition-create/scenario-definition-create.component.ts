import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { Subject, takeUntil } from "rxjs";
import {
  BusinessProcessChain,
  Heaviness,
  ScenarioDefinitionCreateRequest,
  Test,
  TestSelection,
} from "@mxevolve/domains/test/model";
import { OrdinalNumberPipe } from "@mxevolve/shared/pipe";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { MandatoryModule } from "@mxflow/directive";
import {
  BusinessProcessChainSelectInputModule,
  StreamsTagDisplayModule,
} from "@mxflow/features/streams";
import { EnvironmentSelectInputModule } from "@mxflow/features/environment";
import { ScenarioAddTestComponent } from "../scenario-add-test/scenario-add-test.component";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { InputTextModule } from "primeng/inputtext";
import { RadioButtonModule } from "primeng/radiobutton";
import { RippleModule } from "primeng/ripple";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { CreateScenarioDefinitionForm } from "../scenario-definition-form.model";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-definition-create",
  templateUrl: "./scenario-definition-create.component.html",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderTitleModule,
    CardContainerModule,
    MandatoryFieldModule,
    MandatoryModule,
    ConfirmPopupModule,
    SkeletonModule,
    InputTextModule,
    SelectModule,
    RadioButtonModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    TableModule,
    TagModule,
    OrdinalNumberPipe,
    ScenarioAddTestComponent,
    TableEmptyMessageComponent,
    EnvironmentSelectInputModule,
    BusinessProcessChainSelectInputModule,
    StreamsTagDisplayModule,
  ],
})
export class ScenarioDefinitionCreateComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioDefinitionApiService = inject(
    ScenarioDefinitionService
  );
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();
  experimentalFlag?: boolean;

  projectId = "";
  isLoading = false;
  tests: Test[] = [];
  testSelections: TestSelection[] = [];
  bpcIds: string[] = [];
  heaviness = Heaviness;
  isAddTestModalOpen = false;

  readonly heavinessOptions = [
    { label: "Heavy", value: "HEAVY" },
    { label: "Light", value: "LIGHT" },
  ];

  readonly qualityLevelOptions = [
    { label: "CQG", value: "CQG" },
    { label: "MQG", value: "MQG" },
    { label: "DQG", value: "DQG" },
    { label: "OTHER", value: "OTHER" },
  ];

  scenarioDefinitionCreationForm: FormGroup<CreateScenarioDefinitionForm> =
    new FormGroup<CreateScenarioDefinitionForm>({
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      environmentDefinitionId: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      bpcs: new FormControl<BusinessProcessChain[] | null>(
        [],
        [Validators.required]
      ),
      heaviness: new FormControl<Heaviness>(Heaviness.LIGHT),
      idempotent: new FormControl<boolean>(false),
      nonFunctionalTest: new FormControl<boolean>(false),
      qualityLevel: new FormControl<string | null>(null, [Validators.required]),
    });

  ngOnInit(): void {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((projectId) => {
        this.projectId = projectId;
      });
  }

  onDeleteTest($event: MouseEvent, index: number): void {
    this.confirmationService.confirm({
      target: $event.target as EventTarget,
      message: "Are you sure you want to delete this test?",
      icon: "pi pi-info-circle",
      acceptButtonStyleClass: "p-button-sm ml-2",
      accept: () => {
        this.deleteTest(index);
      },
    });
  }

  deleteTest(index: number): void {
    this.tests.splice(index, 1);
  }

  confirmScenarioDefinitionCreation($event: MouseEvent): void {
    if (this.tests.length === 0) {
      this.confirmationService.confirm({
        target: $event.target as EventTarget,
        message:
          "Are you sure you want to create a Scenario\nDefinition without Test Packages?",
        icon: "pi pi-info-circle",
        acceptButtonStyleClass: "p-button-sm ml-2",
        accept: () => {
          this.createScenarioDefinition();
        },
      });
    } else {
      this.createScenarioDefinition();
    }
  }

  createScenarioDefinition(): void {
    if (this.scenarioDefinitionCreationForm.valid) {
      this.isLoading = true;
      this.scenarioDefinitionApiService
        .createScenarioDefinition(
          this.projectId,
          this.buildTestScenarioCreateRequest()
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (scenarioDefinitionId: string) => {
            this.isLoading = false;
            this.showSuccessMessage(
              "Scenario Definition Successfully Created!"
            );
            this.router.navigate([`../details/${scenarioDefinitionId}`], {
              relativeTo: this.route,
            });
          },
          error: (errorMessage) => {
            this.isLoading = false;
            this.showErrorMessage(errorMessage);
          },
        });
    }
  }

  onCancelCreateTestScenario(): void {
    this.router.navigate(["../"], { relativeTo: this.route });
  }

  private buildTestScenarioCreateRequest(): ScenarioDefinitionCreateRequest {
    const formValue = this.scenarioDefinitionCreationForm.value;
    return {
      name: formValue.name as string,
      bpcs: (formValue.bpcs as unknown as BusinessProcessChain[]).map(
        (bpc) => bpc.id
      ),
      heaviness: formValue.heaviness as string,
      idempotent: formValue.idempotent as boolean,
      nonFunctionalTest: formValue.nonFunctionalTest as boolean,
      environmentDefinitionId: formValue.environmentDefinitionId as string,
      qualityLevel: formValue.qualityLevel as string,
      tests: this.tests.map((test) => ({
        full: test.full,
        testDefinitionId: test.testDefinition.id,
        testSelectionIds: test.testSelections.map(
          (testSelection) => testSelection.id
        ),
      })),
    };
  }

  onBpcSelect(bpcIds: string[]): void {
    this.bpcIds = bpcIds;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  onOpenAddTestModal(): void {
    this.isAddTestModalOpen = true;
  }

  onAddTestCandidate(testCandidate: Test): void {
    this.tests = [...this.tests, testCandidate];
  }

  onCloseAddTestModal(): void {
    this.isAddTestModalOpen = false;
  }

  private showErrorMessage(errorMessage: string): void {
    this.toastMessageService.showError(errorMessage);
  }

  private showSuccessMessage(successMessage: string): void {
    this.toastMessageService.showSuccess(successMessage);
  }
}
