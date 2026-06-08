import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectUsersMultiselectComponent } from "./project-users-multiselect.component";
import {
  MxevolveMultiselectDropdownComponent,
  BaseMultiselectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { ProjectUsersService } from "./service/project-users.service";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";
import { User } from "@mxflow/features/user";

describe("ProjectUsersMultiselectComponent", () => {
  let fixture: ComponentFixture<ProjectUsersMultiselectComponent>;
  let component: ProjectUsersMultiselectComponent;
  let mockProjectUsersService: jest.Mocked<ProjectUsersService>;

  const USER: User = { id: "ID", mail: "MAIL", displayName: "NAME" };
  const PROJECT_ID = "PROJECT_ID";

  beforeEach(async () => {
    mockProjectUsersService = {
      getProjectUsers: jest
        .fn()
        .mockReturnValue(of({ content: [USER], last: false })),
    } as unknown as jest.Mocked<ProjectUsersService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        ProjectUsersMultiselectComponent,
        MxevolveMultiselectDropdownComponent,
      ],
    })
      .overrideComponent(ProjectUsersMultiselectComponent, {
        set: {
          providers: [
            {
              provide: ProjectUsersService,
              useValue: mockProjectUsersService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectUsersMultiselectComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseMultiselectDropdown", () => {
    expect(component instanceof BaseMultiselectDropdown).toBe(true);
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
});
