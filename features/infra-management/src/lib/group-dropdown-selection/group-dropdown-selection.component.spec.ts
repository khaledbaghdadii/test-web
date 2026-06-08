import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GroupDropdownSelectionComponent } from "./group-dropdown-selection.component";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { InfraGroupsService } from "../infra-groups/infra-groups.service";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";
import { SelectedGroup } from "../infra-groups/model/selected-group";

describe("GroupDropdownSelectionComponent", () => {
  let fixture: ComponentFixture<GroupDropdownSelectionComponent>;
  let component: GroupDropdownSelectionComponent;
  let mockGroupService: jest.Mocked<InfraGroupsService>;

  const PROJECT_ID = "PROJECT_ID";
  const MOCK_GROUP: SelectedGroup = {
    id: "id1",
    name: "Group 1",
    projectId: "projectId",
  };

  const MOCK_GROUPS_RESPONSE = {
    content: [
      {
        id: "id1",
        projectId: "projectId",
        name: "Group 1",
        defaultSshCredentials: { uri: "", isInherited: false },
        defaultMssqlDbCredentials: { uri: "", isInherited: false },
        defaultOracleDbCredentials: { uri: "", isInherited: false },
        defaultPostgresDbCredentials: { uri: "", isInherited: false },
        defaultSybaseDbCredentials: { uri: "", isInherited: false },
      },
    ],
    totalPages: 1,
    totalElements: 1,
    size: 10,
    number: 0,
    last: true,
  };

  beforeEach(async () => {
    mockGroupService = {
      searchGroups: jest.fn().mockReturnValue(of(MOCK_GROUPS_RESPONSE)),
    } as unknown as jest.Mocked<InfraGroupsService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        GroupDropdownSelectionComponent,
        MxevolveSingleSelectDropdownComponent,
      ],
    })
      .overrideComponent(GroupDropdownSelectionComponent, {
        set: {
          providers: [
            {
              provide: InfraGroupsService,
              useValue: mockGroupService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GroupDropdownSelectionComponent);
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

      component.onSelectionChange(MOCK_GROUP);

      expect(onChangeFn).toHaveBeenCalledWith(MOCK_GROUP);
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
        SelectedGroup,
        { projectId: string }
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

  describe("loading signal", () => {
    it("should expose loading signal from state provider", () => {
      const loadingValue = component["stateProvider"].loading();
      expect(typeof component.loading()).toBe("boolean");
      expect(component.loading()).toBe(loadingValue);
    });

    it("should reflect loading state changes reactively", () => {
      component["stateProvider"].loading.set(true);
      expect(component.loading()).toBe(true);

      component["stateProvider"].loading.set(false);
      expect(component.loading()).toBe(false);
    });
  });

  describe("writeValue", () => {
    it("should set selected item on state provider", () => {
      const setSelectedItemSpy = jest.spyOn(
        component["stateProvider"],
        "setSelectedItem"
      );

      component.writeValue(MOCK_GROUP);

      expect(setSelectedItemSpy).toHaveBeenCalledWith(MOCK_GROUP);
    });

    it("should handle null value", () => {
      const setSelectedItemSpy = jest.spyOn(
        component["stateProvider"],
        "setSelectedItem"
      );

      component.writeValue(null);

      expect(setSelectedItemSpy).toHaveBeenCalledWith(null);
    });
  });
});
