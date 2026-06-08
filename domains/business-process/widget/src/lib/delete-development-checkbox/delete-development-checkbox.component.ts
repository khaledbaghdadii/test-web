import {
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import { Checkbox } from "primeng/checkbox";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { DevelopmentService } from "@mxevolve/domains/scm/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  ExecutionResourcesService,
  ExecutionResourceType,
} from "@mxevolve/domains/business-process/data-access";
import { map } from "rxjs";

export interface DeleteDevelopmentValue {
  shouldDelete: boolean;
  developmentId: string | undefined;
}

@Component({
  selector: "mxevolve-delete-development-checkbox",
  imports: [Checkbox, FormsModule, MxevolveIconComponent],
  providers: [
    DevelopmentService,
    ExecutionResourcesService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DeleteDevelopmentCheckboxComponent),
      multi: true,
    },
  ],
  templateUrl: "./delete-development-checkbox.component.html",
})
export class DeleteDevelopmentCheckboxComponent
  implements ControlValueAccessor
{
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly actionLabel = input.required<string>();
  readonly familyId = input.required<ExecutionFamily>();

  protected readonly checked = linkedSignal(
    () => this.familyId() === ExecutionFamily.USER_STORY_BUILD_AND_TEST
  );

  private onChange: (value: DeleteDevelopmentValue) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly developmentService = inject(DevelopmentService);
  private readonly resourcesService = inject(ExecutionResourcesService);

  private readonly executionResources = rxResource({
    params: () => ({
      projectId: this.projectId(),
      processId: this.processId(),
    }),
    stream: ({ params }) =>
      this.resourcesService
        .getExecutionResources(params.projectId, params.processId)
        .pipe(
          map(
            (resources) =>
              resources.find(
                (r) =>
                  r.resourceType === ExecutionResourceType.DEVELOPMENT &&
                  r.usageTags.length === 0
              )?.resourceId
          )
        ),
  });

  protected readonly developmentId = computed(() =>
    this.executionResources.hasValue()
      ? this.executionResources.value()
      : undefined
  );

  readonly branchName = rxResource({
    params: () => {
      const developmentId = this.developmentId();
      if (!developmentId) return undefined;
      return { projectId: this.projectId(), developmentId };
    },
    stream: ({ params }) =>
      this.developmentService
        .getDevelopment(params.projectId, params.developmentId)
        .pipe(map((development) => development.name)),
  });

  private readonly deleteValue = computed<DeleteDevelopmentValue>(() => ({
    shouldDelete: this.checked(),
    developmentId: this.developmentId(),
  }));

  constructor() {
    effect(() => {
      this.onChange(this.deleteValue());
    });
  }

  writeValue(value: DeleteDevelopmentValue | null): void {
    this.checked.set(
      value?.shouldDelete ??
        this.familyId() === ExecutionFamily.USER_STORY_BUILD_AND_TEST
    );
  }

  registerOnChange(fn: (value: DeleteDevelopmentValue) => void): void {
    this.onChange = fn;
    fn(this.deleteValue());
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onCheckedChange(value: boolean): void {
    this.checked.set(value);
    this.onTouched();
  }
}
