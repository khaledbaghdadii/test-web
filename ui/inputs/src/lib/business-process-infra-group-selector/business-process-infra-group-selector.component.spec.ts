import { BusinessProcessInfraGroupSelectorComponent } from "./business-process-infra-group-selector.component";
import { of, Subject, throwError } from "rxjs";
import { FormControl } from "@angular/forms";
import {
  Group,
  InfraGroupsService,
  SelectedGroup,
} from "@mxflow/features/infra-management";
import { DefaultGroup } from "../../../../../features/infra-management/src/lib/infra-groups/response/project-infra-registry-api-reponse";
import { TestBed } from "@angular/core/testing";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("Business process infra group selector", () => {
  let component: BusinessProcessInfraGroupSelectorComponent;

  let groupService: Partial<InfraGroupsService>;
  let toastService: Partial<ToastMessageService>;

  beforeEach(() => {
    groupService = {
      getGroup: jest.fn((projectId, groupId) =>
        of({
          projectId: projectId,
          id: groupId,
          name: "someGroupName",
        } as Group)
      ),
      getProjectInfraRegistryConfig: jest.fn((projectId) =>
        of({
          projectId: projectId,
          id: "defaultGroupId",
          name: "defaultGroupName",
        } as DefaultGroup)
      ),
    };

    toastService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BusinessProcessInfraGroupSelectorComponent],
      providers: [
        { provide: InfraGroupsService, useValue: groupService },
        { provide: ToastMessageService, useValue: toastService },
      ],
    }).overrideComponent(BusinessProcessInfraGroupSelectorComponent, {
      set: {
        providers: [],
      },
    });

    const fixture = TestBed.createComponent(
      BusinessProcessInfraGroupSelectorComponent
    );
    component = fixture.componentInstance;
    fixture.componentRef.setInput("projectId", "projectId");
  });

  it("should set the initial group of the temporary form control from the preselected group id", () => {
    component.infraGroupFormControl = new FormControl("someGroupId");

    component.ngOnInit();

    expect(component.selectedGroupFormControl?.value).toEqual({
      id: "someGroupId",
      name: "someGroupName",
      projectId: "projectId",
    });
  });

  it("should set up the temporary form control with the value of the default infra group when no group is preselected", () => {
    jest
      .spyOn(groupService, "getProjectInfraRegistryConfig")
      .mockImplementation(
        jest.fn((projectId) =>
          of({
            projectId: projectId,
            id: "defaultGroupId",
            name: "defaultGroupName",
          })
        )
      );

    component.infraGroupFormControl = new FormControl();
    component.ngOnInit();

    expect(component.selectedGroupFormControl?.value).toEqual({
      id: "defaultGroupId",
      name: "defaultGroupName",
      projectId: "projectId",
    });
  });

  it("should render an empty infra group selection when no project default infra group exist", () => {
    jest
      .spyOn(groupService, "getGroup")
      .mockImplementation(jest.fn(() => throwError(() => "error")));

    component.infraGroupFormControl = new FormControl("someGroupId");
    component.ngOnInit();

    expect(component.selectedGroupFormControl.value).toEqual(null);
    expect(toastService.showError).toHaveBeenCalledWith("error");
  });

  it("should set up the temporary form control with no value if input form control does not have a value and no default group exists", async () => {
    jest
      .spyOn(groupService, "getProjectInfraRegistryConfig")
      .mockImplementation(jest.fn(() => throwError(() => "error")));

    component.infraGroupFormControl = new FormControl();
    component.ngOnInit();

    expect(component.selectedGroupFormControl.value).toEqual(null);
    expect(toastService.showError).toHaveBeenCalledWith("error");
  });

  it("should update the value of the form control when a value is set in the temporary form control with a previous value set", () => {
    component.infraGroupFormControl = new FormControl("someGroupId");
    component.ngOnInit();

    component.selectedGroupFormControl.setValue({
      id: "someOtherGroupId",
      name: "someOtherName",
      projectId: "projectId",
    } as SelectedGroup);

    expect(component.infraGroupFormControl.value).toEqual("someOtherGroupId");
    expect(component.infraGroupFormControl.dirty).toStrictEqual(true);
  });

  it("should update the value of the form control when a value is set in the temporary form control when no previous value was set", () => {
    component.infraGroupFormControl = new FormControl();
    component.ngOnInit();

    component.selectedGroupFormControl.setValue({
      id: "someOtherGroupId",
      name: "someOtherName",
      projectId: "projectId",
    } as SelectedGroup);

    expect(component.infraGroupFormControl.value).toEqual("someOtherGroupId");
    expect(component.infraGroupFormControl.dirty).toStrictEqual(true);
  });

  it("should update the value of the form control the default group id", () => {
    component.infraGroupFormControl = new FormControl();
    component.ngOnInit();

    expect(component.infraGroupFormControl.value).toEqual("defaultGroupId");
    expect(component.infraGroupFormControl.dirty).toStrictEqual(false);
  });

  it("should set the value empty the value of the form control when the temporary form is reset", () => {
    component.infraGroupFormControl = new FormControl("someGroupId");
    component.ngOnInit();

    component.selectedGroupFormControl.setValue(
      undefined as unknown as SelectedGroup
    );

    expect(component.infraGroupFormControl.value).toEqual(undefined);
    expect(component.infraGroupFormControl.dirty).toStrictEqual(true);
  });

  it("should show a loading state while fetching the initial group", () => {
    const subject = new Subject<Group>();
    jest
      .spyOn(groupService, "getGroup")
      .mockImplementation(jest.fn(() => subject.asObservable()));

    component.infraGroupFormControl = new FormControl("someGroupId");
    component.ngOnInit();

    expect(component.isLoading).toBe(true);

    subject.next({
      projectId: "projectId",
      id: "someGroupId",
      name: "someGroupName",
    } as Group);
    subject.complete();

    expect(component.isLoading).toBe(false);
  });

  it("should show a loading state while fetching the default group", () => {
    const subject = new Subject<DefaultGroup>();
    jest
      .spyOn(groupService, "getProjectInfraRegistryConfig")
      .mockImplementation(jest.fn(() => subject.asObservable()));

    component.infraGroupFormControl = new FormControl();
    component.ngOnInit();

    expect(component.isLoading).toBe(true);

    subject.next({
      projectId: "projectId",
      id: "defaultGroupId",
      name: "defaultGroupName",
    } as DefaultGroup);
    subject.complete();

    expect(component.isLoading).toBe(false);
  });
});
