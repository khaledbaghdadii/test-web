import { CommonModule, Location } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { concatMap, forkJoin, map, of, Subject, takeUntil } from "rxjs";
import { WhitespaceValidators } from "@mxevolve/shared/ui/form";
import { OrdinalNumberPipe } from "@mxevolve/shared/pipe";
import { MandatoryModule } from "@mxflow/directive";
import {
  BusinessProcessChainSelectInputModule,
  StreamsService,
  StreamsTagDisplayModule,
} from "@mxflow/features/streams";
import {
  EnvironmentSelectInputModule,
  EnvironmentService,
} from "@mxflow/features/environment";
import {
  BusinessProcessChain,
  Heaviness,
  ScenarioDefinition,
  ScenarioDefinitionUpdateRequest,
  Test,
  TestSelection,
} from "@mxevolve/domains/test/model";
import { ScenarioAddTestComponent } from "../scenario-add-test/scenario-add-test.component";
import { ScenarioEditTestComponent } from "../scenario-edit-test/scenario-edit-test.component";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ConfirmationService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { InputTextModule } from "primeng/inputtext";
import { RadioButtonModule } from "primeng/radiobutton";
import { RippleModule } from "primeng/ripple";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TableEmptyMessageComponent } from "@mxflow/ui/utils";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { EditScenarioDefinitionForm } from "../scenario-definition-form.model";
import {
  ScenarioDefinitionMapper,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-definition-edit",
  templateUrl: "./scenario-definition-edit.component.html",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardContainerModule,
    HeaderTitleModule,
    MandatoryFieldModule,
    ConfirmPopupModule,
    MandatoryModule,
    SkeletonModule,
    SelectModule,
    InputTextModule,
    TooltipModule,
    RadioButtonModule,
    ButtonModule,
    RippleModule,
    TagModule,
    TableModule,
    OrdinalNumberPipe,
    ScenarioAddTestComponent,
    TableEmptyMessageComponent,
    EnvironmentSelectInputModule,
    ScenarioEditTestComponent,
    BusinessProcessChainSelectInputModule,
    StreamsTagDisplayModule,
  ],
})
export class ScenarioDefinitionEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly scenarioDefinitionApiService = inject(
    ScenarioDefinitionService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly environmentService = inject(EnvironmentService);
  private readonly streamsService = inject(StreamsService);
  private readonly destroy$ = new Subject();

  projectId = "";
  isLoading = false;
  heaviness = Heaviness;
  tests: Test[] = [];
  testSelections: TestSelection[] = [];
  bpcIds: string[] = [];
  scenarioDefinitionToEdit: ScenarioDefinition;
  isAddTestModalOpen = false;
  isEditTestModalOpen = false;
  selectedRowIndex = -1;
  selectedRowTest: Test;
  environmentDefinitionId: string;

  scenarioDefinitionEditForm: FormGroup<EditScenarioDefinitionForm> =
    new FormGroup<EditScenarioDefinitionForm>({
      environmentDefinitionId: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      bpcs: new FormControl<BusinessProcessChain[] | null>(
        [],
        [Validators.required]
      ),
      idempotent: new FormControl<boolean>(false),
      heaviness: new FormControl<Heaviness>(Heaviness.LIGHT),
      nonFunctionalTest: new FormControl<boolean>(false),
      qualityLevel: new FormControl<string | null>(null, [Validators.required]),
    });

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

  ngOnInit(): void {
    this.isLoading = true;

    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        takeUntil(this.destroy$),
        concatMap((projectId) => {
          this.projectId = projectId;
          return this.route.params;
        }),
        concatMap((params) => {
          return this.scenarioDefinitionApiService.getScenarioDefinitionById(
            params["scenarioDefinitionId"],
            this.projectId
          );
        }),
        concatMap((scenarioDefinitionApiResponse) => {
          const testDefinitionIds = scenarioDefinitionApiResponse.tests.map(
            (test) => test.testDefinitionId
          );
          return forkJoin([
            of(scenarioDefinitionApiResponse),
            this.scenarioDefinitionApiService.getTestDefinitions(
              this.projectId,
              testDefinitionIds
            ),
            this.streamsService.getListOfBpcsByProjectId(this.projectId),
            this.environmentService.getEnvironmentDefinitionById(
              this.projectId,
              scenarioDefinitionApiResponse.environmentDefinitionId
            ),
          ]);
        }),
        map(([response, testDefinitions, bpcs, environment]) =>
          ScenarioDefinitionMapper.toScenarioDefinition(
            response,
            testDefinitions,
            bpcs,
            [environment]
          )
        )
      )
      .subscribe({
        next: (scenarioDefinition) => {
          this.isLoading = false;
          this.scenarioDefinitionToEdit = scenarioDefinition;
          this.environmentDefinitionId =
            scenarioDefinition.environmentDefinition.id;
          this.tests = scenarioDefinition.tests;

          this.scenarioDefinitionEditForm.setValue({
            name: this.scenarioDefinitionToEdit.name,
            environmentDefinitionId: null,
            bpcs: this.scenarioDefinitionToEdit.bpcs,
            heaviness: this.scenarioDefinitionToEdit.heaviness,
            idempotent: this.scenarioDefinitionToEdit.idempotent,
            nonFunctionalTest: this.scenarioDefinitionToEdit.nonFunctionalTest,
            qualityLevel: this.scenarioDefinitionToEdit.qualityLevel ?? null,
          });

          this.bpcIds = this.scenarioDefinitionToEdit.bpcs.map((bpc) => bpc.id);
        },
        error: (errorMessage) => {
          this.isLoading = false;
          this.toastMessageService.showError(errorMessage);
        },
      });
  }

  onDeleteTest($event: Event, index: number): void {
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

  confirmEditScenarioDefinition($event: MouseEvent): void {
    if (this.tests.length === 0) {
      this.confirmationService.confirm({
        target: $event.target as EventTarget,
        message:
          "Are you sure you want to submit the edited\nScenario Definition without Test Packages?",
        icon: "pi pi-info-circle",
        acceptButtonStyleClass: "p-button-sm ml-2",
        accept: () => {
          this.editScenarioDefinition();
        },
      });
    } else {
      this.editScenarioDefinition();
    }
  }

  editScenarioDefinition(): void {
    if (this.scenarioDefinitionEditForm.valid) {
      this.isLoading = true;
      this.scenarioDefinitionApiService
        .editScenarioDefinition(
          this.projectId,
          this.buildTestScenarioUpdateRequest(),
          this.scenarioDefinitionToEdit.id
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (scenarioDefinitionId: string) => {
            this.isLoading = false;
            this.toastMessageService.showSuccess(
              "Scenario Definition Successfully Edited!"
            );
            this.router.navigate([`../../details/${scenarioDefinitionId}`], {
              relativeTo: this.route,
            });
          },
          error: (errorMessage) => {
            this.isLoading = false;
            this.toastMessageService.showError(errorMessage);
          },
        });
    }
  }

  private buildTestScenarioUpdateRequest(): ScenarioDefinitionUpdateRequest {
    const formValue = this.scenarioDefinitionEditForm.value;
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

  onCancelEditTestScenario(): void {
    this.location.back();
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

  openEditTestModal(selectedRowIndex: number, selectedRowTest: Test): void {
    this.selectedRowIndex = selectedRowIndex;
    this.selectedRowTest = selectedRowTest;
    this.isEditTestModalOpen = true;
  }

  updateTest(test: Test): void {
    this.tests[this.selectedRowIndex] = test;
  }

  closeEditTestModal(): void {
    this.isEditTestModalOpen = false;
  }
}
