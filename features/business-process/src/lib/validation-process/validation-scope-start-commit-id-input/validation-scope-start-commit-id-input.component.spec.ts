import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ValidationScopeStartCommitIdInputComponent } from "./validation-scope-start-commit-id-input.component";
import { ValidationProcessExecutionFetcherService } from "../validation-process-execution-fetcher/validation-process-execution-fetcher.service";
import { of } from "rxjs";
import { ValidationScopeStartCommitIdInputSelectionMode } from "./validation-scope-start-commit-id-input-selection-mode";

describe("ValidationScopeStartCommitIdInputComponent", () => {
  let component: ValidationScopeStartCommitIdInputComponent;
  let fixture: ComponentFixture<ValidationScopeStartCommitIdInputComponent>;

  beforeEach(async () => {
    const mockFetcherService = {
      getValidationProcessExecutions: jest
        .fn()
        .mockReturnValue(of({ executions: [], total: 0 })),
    };

    await TestBed.configureTestingModule({
      imports: [
        ValidationScopeStartCommitIdInputComponent,
        ReactiveFormsModule,
      ],
      providers: [
        {
          provide: ValidationProcessExecutionFetcherService,
          useValue: mockFetcherService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      ValidationScopeStartCommitIdInputComponent
    );
    component = fixture.componentInstance;

    component.projectId = "projectId";
    component.parentBranch = "parentBranch";
    component.startCommitIdFormControl = new FormControl();

    fixture.detectChanges();
  });

  it("should default to suggested list mode", () => {
    expect(component.selectionModeControl.value).toBe(
      ValidationScopeStartCommitIdInputSelectionMode.SUGGESTED_LIST
    );
  });

  it("should initialize the commit ID state provider", () => {
    expect(component.commitIdStateProvider).toBeDefined();
  });

  it("should clear validation scope start commit Id when selection mode changes", () => {
    component.startCommitIdFormControl.setValue("commit-1");
    component.selectionModeControl.setValue(
      ValidationScopeStartCommitIdInputSelectionMode.CUSTOMIZED
    );
    expect(component.startCommitIdFormControl.value).toBeNull();
  });

  it("should set validation scope start commit Id from custom input in customized mode", () => {
    component.selectionModeControl.setValue(
      ValidationScopeStartCommitIdInputSelectionMode.CUSTOMIZED
    );
    component.customCommitIdControl.setValue("custom-commit-abc");
    expect(component.startCommitIdFormControl.value).toBe("custom-commit-abc");
  });

  it("should not update validation scope start commit Id from custom input in suggested list mode", () => {
    component.customCommitIdControl.setValue("custom-commit-abc");
    expect(component.startCommitIdFormControl.value).toBeNull();
  });

  it("should set validation scope start commit Id when a commit is selected from dropdown", () => {
    component.onCommitIdSelected("commit-1");
    expect(component.startCommitIdFormControl.value).toBe("commit-1");
  });

  it("should clear validation scope start commit Id when dropdown selection is cleared", () => {
    component.startCommitIdFormControl.setValue("commit-1");
    component.onCommitIdSelected(null);
    expect(component.startCommitIdFormControl.value).toBeNull();
  });
});
