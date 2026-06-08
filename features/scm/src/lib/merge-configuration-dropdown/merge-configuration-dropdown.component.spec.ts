import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MergeConfigurationDropdownComponent } from "./merge-configuration-dropdown.component";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import {
  MergeConfiguration,
  MergeConfigurationService,
} from "@mxflow/features/scm-management";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";

describe("MergeConfigurationDropdownComponent", () => {
  let fixture: ComponentFixture<MergeConfigurationDropdownComponent>;
  let component: MergeConfigurationDropdownComponent;
  let mockMergeConfigurationService: jest.Mocked<MergeConfigurationService>;

  const PROJECT_ID = "project-1";
  const REPOSITORY_ID = "repo-1";
  const MOCK_MERGE_CONFIG: MergeConfiguration = {
    id: "mc-1",
    projectId: PROJECT_ID,
    branchName: "main",
    mergeConfigurationDefinition: {
      id: "mcd-1",
      repositoryId: REPOSITORY_ID,
    },
  };

  const MOCK_MERGE_CONFIGURATIONS_RESPONSE = {
    content: [MOCK_MERGE_CONFIG],
    totalPages: 1,
    totalElements: 1,
    size: 10,
    number: 0,
    last: true,
  };

  beforeEach(async () => {
    mockMergeConfigurationService = {
      getFilteredMergeConfigurations: jest
        .fn()
        .mockReturnValue(of(MOCK_MERGE_CONFIGURATIONS_RESPONSE)),
    } as unknown as jest.Mocked<MergeConfigurationService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        MergeConfigurationDropdownComponent,
        MxevolveSingleSelectDropdownComponent,
      ],
    })
      .overrideComponent(MergeConfigurationDropdownComponent, {
        set: {
          providers: [
            {
              provide: MergeConfigurationService,
              useValue: mockMergeConfigurationService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MergeConfigurationDropdownComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    fixture.componentRef.setInput("repositoryId", REPOSITORY_ID);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseSingleSelectDropdown", () => {
    expect(component instanceof BaseSingleSelectDropdown).toBe(true);
  });

  it("should have projectId input", () => {
    expect(component.projectId()).toBe(PROJECT_ID);
  });

  it("should have repositoryId input", () => {
    expect(component.repositoryId()).toBe(REPOSITORY_ID);
  });

  it("should have state provider initialized", () => {
    expect(component["stateProvider"]).toBeDefined();
  });

  it("should have failureEvent output from base class", () => {
    expect(component.failureEvent).toBeDefined();
  });

  describe("ControlValueAccessor", () => {
    it("should implement ControlValueAccessor methods", () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it("should register onChange callback", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange(MOCK_MERGE_CONFIG);

      expect(onChangeFn).toHaveBeenCalledWith(MOCK_MERGE_CONFIG);
    });

    it("should register onChange callback and handle null", () => {
      const onChangeFn = jest.fn();
      component.registerOnChange(onChangeFn);

      component.onSelectionChange(null);

      expect(onChangeFn).toHaveBeenCalledWith(null);
    });

    it("should register onTouched callback", () => {
      const onTouchedFn = jest.fn();
      component.registerOnTouched(onTouchedFn);

      component.onSelectionChange(null);

      expect(onTouchedFn).toHaveBeenCalled();
    });
  });

  describe("onError", () => {
    it("should emit error through failureEvent", () => {
      const errorSpy = jest.fn();
      component.failureEvent.subscribe(errorSpy);

      component.onError("Test error message");

      expect(errorSpy).toHaveBeenCalledWith("Test error message");
    });
  });

  describe("hideDropdown", () => {
    it("should call hide on selectRef when dropdownComponent is available", () => {
      const mockSelectRef = { hide: jest.fn() };
      const mockDropdown = {
        selectRef: mockSelectRef,
      } as unknown as MxevolveSingleSelectDropdownComponent<
        MergeConfiguration,
        { projectId: string; repositoryId: string }
      >;
      component.dropdownComponent = mockDropdown;

      component.hideDropdown();

      expect(mockSelectRef.hide).toHaveBeenCalled();
    });

    it("should not throw when dropdownComponent is undefined", () => {
      component.dropdownComponent = undefined;

      expect(() => component.hideDropdown()).not.toThrow();
    });
  });
});
