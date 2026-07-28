import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CrmProjectSingleSelectComponent } from "./crm-project-single-select.component";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { ProjectService } from "../project.service";
import { CrmProject } from "../crm-project";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";

describe("CrmProjectSingleSelectComponent", () => {
  let fixture: ComponentFixture<CrmProjectSingleSelectComponent>;
  let component: CrmProjectSingleSelectComponent;
  let mockProjectService: jest.Mocked<ProjectService>;

  const PROJECT_ID = "project-1";
  const CRM_PROJECT: CrmProject = {
    id: "crm-1",
    projectId: PROJECT_ID,
    externalId: "EXT-1",
    name: "CRM Project 1",
  };

  beforeEach(async () => {
    mockProjectService = {
      getCrmProjects: jest.fn().mockReturnValue(of([CRM_PROJECT])),
    } as unknown as jest.Mocked<ProjectService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        CrmProjectSingleSelectComponent,
        MxevolveSingleSelectDropdownComponent,
      ],
    })
      .overrideComponent(CrmProjectSingleSelectComponent, {
        set: {
          providers: [
            {
              provide: ProjectService,
              useValue: mockProjectService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CrmProjectSingleSelectComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
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

      component.onSelectionChange(CRM_PROJECT);

      expect(onChangeFn).toHaveBeenCalledWith(CRM_PROJECT);
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
});
