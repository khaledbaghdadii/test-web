import {
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
} from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from "@angular/forms";
import { DeleteDevelopmentCheckboxComponent } from "@mxevolve/domains/business-process/widget";
import type { DeleteDevelopmentValue } from "@mxevolve/domains/business-process/widget";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import { InputText } from "primeng/inputtext";
import { Message } from "primeng/message";
import {
  MergeConfigurationDropdownComponent,
  ReviewersAutoCompleteComponent,
} from "@mxevolve/domains/scm/widget";
import {
  CommitsService,
  DevelopmentService,
  MergeConfigurationService,
  MergeConfiguration,
  Reviewer,
} from "@mxevolve/domains/scm/data-access";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";

export interface MergeRequestDetailsValue {
  mergeRequestTitle: string;
  destinationBranch: MergeConfiguration | null;
  reviewers: Reviewer[];
  deleteBranch: DeleteDevelopmentValue | null;
}

@Component({
  selector: "mxevolve-merge-request-details-form",
  templateUrl: "./merge-request-details-form.component.html",
  imports: [
    InputText,
    Message,
    ReactiveFormsModule,
    DeleteDevelopmentCheckboxComponent,
    MergeConfigurationDropdownComponent,
    ReviewersAutoCompleteComponent,
    MxevolveIconComponent,
  ],
  providers: [
    CommitsService,
    DevelopmentService,
    MergeConfigurationService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MergeRequestDetailsFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MergeRequestDetailsFormComponent),
      multi: true,
    },
  ],
  host: {
    style: "display: contents;",
  },
})
export class MergeRequestDetailsFormComponent
  implements ControlValueAccessor, Validator
{
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly developmentId = input.required<string>();
  readonly supportsResourceManagement = input.required<boolean>();
  readonly parentBranchName = input.required<string>();

  readonly ExecutionFamily = ExecutionFamily;

  private readonly commitsService = inject(CommitsService);
  private readonly developmentService = inject(DevelopmentService);
  private readonly mergeConfigurationService = inject(
    MergeConfigurationService
  );

  readonly development = rxResource({
    params: () => ({
      projectId: this.projectId(),
      developmentId: this.developmentId(),
    }),
    stream: ({ params }) =>
      this.developmentService.getDevelopment(
        params.projectId,
        params.developmentId
      ),
  });

  readonly repositoryId = computed(() =>
    this.development.hasValue() ? this.development.value().repository.id : ""
  );

  readonly developmentName = computed(() =>
    this.development.hasValue() ? this.development.value().name : ""
  );

  readonly defaultDestinationBranch = rxResource({
    params: () => {
      const projectId = this.projectId();
      const repositoryId = this.repositoryId();
      const parentBranchName = this.parentBranchName();
      if (!projectId || !repositoryId || !parentBranchName) return undefined;
      return { projectId, repositoryId, parentBranchName };
    },
    stream: ({ params }) =>
      this.mergeConfigurationService.getFilteredMergeConfigurations(
        params.projectId,
        params.repositoryId,
        params.parentBranchName,
        0,
        100
      ),
  });

  readonly matchedMergeConfiguration = computed(() => {
    if (!this.defaultDestinationBranch.hasValue()) return null;
    const page = this.defaultDestinationBranch.value();
    return (
      page.content.find((mc) => mc.branchName === this.parentBranchName()) ??
      null
    );
  });

  readonly form = new FormGroup({
    mergeRequestTitle: new FormControl<string>("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    destinationBranch: new FormControl<MergeConfiguration | null>(
      null,
      Validators.required
    ),
    reviewers: new FormControl<Reviewer[]>([], { nonNullable: true }),
    deleteBranch: new FormControl<DeleteDevelopmentValue | null>(null),
  });

  private onChange: (value: MergeRequestDetailsValue | null) => void = () => {};
  onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  readonly destinationBranchValue = toSignal(
    this.form.controls.destinationBranch.valueChanges,
    { initialValue: null }
  );

  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly value = computed<MergeRequestDetailsValue>(() => {
    const fv = this.formValue();
    return {
      mergeRequestTitle: fv.mergeRequestTitle ?? "",
      destinationBranch: fv.destinationBranch ?? null,
      reviewers: fv.reviewers ?? [],
      deleteBranch: fv.deleteBranch ?? null,
    };
  });

  readonly commitsBehind = rxResource({
    params: () => {
      const destBranch = this.destinationBranchValue();
      const repoId = this.repositoryId();
      const devName = this.developmentName();
      if (!repoId || !devName || !destBranch) return undefined;
      return {
        projectId: this.projectId(),
        repositoryId: repoId,
        sourceBranch: destBranch.branchName,
        destinationBranch: devName,
      };
    },
    stream: ({ params }) => this.commitsService.getCommitDifferences(params),
  });

  constructor() {
    effect(() => {
      this.onChange(this.value());
    });

    effect(() => {
      const destinationBranch = this.destinationBranchValue();
      if (!destinationBranch) {
        this.form.controls.reviewers.setValue([]);
      }
    });

    effect(() => {
      const matched = this.matchedMergeConfiguration();
      if (matched && !this.form.controls.destinationBranch.value) {
        this.form.controls.destinationBranch.setValue(matched);
      }
    });

    effect(() => {
      this.formStatus();
      this.onValidatorChange();
    });
  }

  writeValue(value: MergeRequestDetailsValue | null): void {
    if (value) {
      this.form.setValue(value);
    } else {
      this.form.reset();
    }
  }

  registerOnChange(fn: (value: MergeRequestDetailsValue | null) => void): void {
    this.onChange = fn;
    fn(this.value());
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  validate(): ValidationErrors | null {
    return this.form.valid ? null : { invalid: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }
}
