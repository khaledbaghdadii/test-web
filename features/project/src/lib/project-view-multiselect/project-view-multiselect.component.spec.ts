import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectViewMultiselectComponent } from "./project-view-multiselect.component";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { ProjectService } from "../project.service";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";
import { Project } from "../project";

describe("ProjectViewMultiselectComponent", () => {
  let fixture: ComponentFixture<ProjectViewMultiselectComponent>;
  let component: ProjectViewMultiselectComponent;
  let mockProjectService: jest.Mocked<ProjectService>;

  const PROJECT: Project = {
    id: "1",
    name: "Project 1",
    description: "First project",
  };

  beforeEach(async () => {
    mockProjectService = {
      getViewProjects: jest.fn().mockReturnValue(of([PROJECT])),
    } as unknown as jest.Mocked<ProjectService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        ProjectViewMultiselectComponent,
        MxevolveMultiselectDropdownComponent,
      ],
    })
      .overrideComponent(ProjectViewMultiselectComponent, {
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

    fixture = TestBed.createComponent(ProjectViewMultiselectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseMultiselectDropdown", () => {
    expect(component instanceof BaseMultiselectDropdown).toBe(true);
  });

  it("should have state provider initialized", () => {
    expect(component["stateProvider"]).toBeDefined();
  });

  it("should have failureEvent output from base class", () => {
    expect(component.failureEvent).toBeDefined();
  });

  it("should have selectedProjectsChange output", () => {
    expect(component.selectedProjectsChange).toBeDefined();
  });

  it("should emit selectedProjectsChange on project selection", () => {
    const emitSpy = jest.fn();
    component.selectedProjectsChange.subscribe(emitSpy);

    component.onProjectSelectionChange([PROJECT]);

    expect(emitSpy).toHaveBeenCalledWith([PROJECT]);
  });

  it("should set selected items when initialSelectedIds match loaded items", () => {
    const setSelectedItemsSpy = jest.spyOn(
      component["stateProvider"],
      "setSelectedItems"
    );

    fixture.componentRef.setInput("initialSelectedIds", [PROJECT.id]);
    component["stateProvider"].setDataParams({} as Record<string, never>);
    fixture.detectChanges();

    expect(setSelectedItemsSpy).toHaveBeenCalledWith([PROJECT]);
  });

  it("should not set selected items when initialSelectedIds is empty", () => {
    const setSelectedItemsSpy = jest.spyOn(
      component["stateProvider"],
      "setSelectedItems"
    );

    fixture.componentRef.setInput("initialSelectedIds", []);
    component["stateProvider"].setDataParams({} as Record<string, never>);
    fixture.detectChanges();

    expect(setSelectedItemsSpy).not.toHaveBeenCalled();
  });

  it("should not set selected items when no ids match loaded items", () => {
    const setSelectedItemsSpy = jest.spyOn(
      component["stateProvider"],
      "setSelectedItems"
    );

    fixture.componentRef.setInput("initialSelectedIds", ["non-existent-id"]);
    component["stateProvider"].setDataParams({} as Record<string, never>);
    fixture.detectChanges();

    expect(setSelectedItemsSpy).not.toHaveBeenCalled();
  });
});
