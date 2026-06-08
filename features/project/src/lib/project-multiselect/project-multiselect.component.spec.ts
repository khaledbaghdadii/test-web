import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { MultiSelectModule } from "primeng/multiselect";
import { of, firstValueFrom } from "rxjs";
import { ProjectService } from "../project.service";
import { Project } from "../project";
import { ProjectMultiselectComponent } from "./project-multiselect.component";

describe("ProjectMultiselectComponent", () => {
  let component: ProjectMultiselectComponent;
  let fixture: ComponentFixture<ProjectMultiselectComponent>;
  let mockProjectService: Partial<ProjectService>;

  const mockProjects: Project[] = [
    { id: "1", name: "Project 1", description: "First project" },
    { id: "2", name: "Project 2", description: "Second project" },
    { id: "3", name: "Project 3", description: "Third project" },
  ];

  beforeEach(async () => {
    mockProjectService = {
      getAllProjects: jest.fn().mockReturnValue(of(mockProjects)),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectMultiselectComponent, FormsModule, MultiSelectModule],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectMultiselectComponent);
    component = fixture.componentInstance;
  });

  it("should create and load projects", () => {
    expect(component).toBeTruthy();
    expect(mockProjectService.getAllProjects).toHaveBeenCalled();
  });

  it("should emit selected projects on selection change", fakeAsync(() => {
    const emitSpy = jest.spyOn(component.selectedProjectsChange, "emit");

    component.onSelectionChange(["1", "2"]);

    tick();
    expect(emitSpy).toHaveBeenCalledWith([mockProjects[0], mockProjects[1]]);
  }));

  it("should emit empty array on clear", () => {
    const emitSpy = jest.spyOn(component.selectedProjectsChange, "emit");

    component.onClear();

    expect(emitSpy).toHaveBeenCalledWith([]);
  });

  it("should sync internalSelectedIds with selectedProjects on init", () => {
    component.selectedProjects = [mockProjects[1]["id"]];

    component.ngOnChanges();

    expect(component.internalSelectedIds).toEqual(["2"]);
  });

  it("should emit empty array if getAllProjects throws (error handling)", fakeAsync(() => {
    mockProjectService.getAllProjects = jest.fn().mockReturnValue(of([]));
    fixture = TestBed.createComponent(ProjectMultiselectComponent);
    component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.selectedProjectsChange, "emit");

    component.onSelectionChange(["999"]);
    tick();
    expect(emitSpy).toHaveBeenCalledWith([]);
  }));

  it("should set loading$ to true while loading and false after", fakeAsync(() => {
    expect(component.loading$.value).toBe(true);

    component.projects$.subscribe();

    tick();
    expect(component.loading$.value).toBe(false);
  }));

  it("should emit correct project options structure", async () => {
    const options = await firstValueFrom(component.projectOptions$);
    expect(options).toEqual([
      { label: "Project 1", value: "1" },
      { label: "Project 2", value: "2" },
      { label: "Project 3", value: "3" },
    ]);
  });
});
