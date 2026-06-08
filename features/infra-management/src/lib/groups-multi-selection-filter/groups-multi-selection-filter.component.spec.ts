import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GroupsMultiSelectionFilterComponent } from "./groups-multi-selection-filter.component";
import {
  BaseMultiselectDropdown,
  MxevolveMultiselectDropdownComponent,
} from "@mxflow/ui/mxevolve-dropdown";
import { InfraGroupsService } from "../infra-groups/infra-groups.service";
import { of } from "rxjs";
import { SelectedGroup } from "../infra-groups/model/selected-group";

describe("GroupsMultiSelectionFilterComponent", () => {
  let fixture: ComponentFixture<GroupsMultiSelectionFilterComponent>;
  let component: GroupsMultiSelectionFilterComponent;
  let mockGroupsService: jest.Mocked<InfraGroupsService>;

  const GROUP: SelectedGroup = {
    id: "ID",
    projectId: "PROJECT_ID",
    name: "NAME",
  };
  const PROJECT_ID = "PROJECT_ID";

  beforeEach(async () => {
    mockGroupsService = {
      searchGroups: jest
        .fn()
        .mockReturnValue(of({ content: [GROUP], last: false })),
    } as unknown as jest.Mocked<InfraGroupsService>;

    await TestBed.configureTestingModule({
      imports: [
        GroupsMultiSelectionFilterComponent,
        MxevolveMultiselectDropdownComponent,
      ],
    })
      .overrideComponent(GroupsMultiSelectionFilterComponent, {
        set: {
          providers: [
            {
              provide: InfraGroupsService,
              useValue: mockGroupsService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GroupsMultiSelectionFilterComponent);
    fixture.componentRef.setInput("projectId", PROJECT_ID);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should extend BaseMultiselectDropdown", () => {
    expect(component).toBeInstanceOf(BaseMultiselectDropdown);
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

  describe("selectFirstNGroups", () => {
    it("should support selectFirstNGroups input", () => {
      fixture.componentRef.setInput("selectFirstNGroups", 2);
      expect(component.selectFirstNGroups()).toBe(2);
    });
  });

  describe("selectedGroupsLimit", () => {
    it("should support selectedGroupsLimit input", () => {
      fixture.componentRef.setInput("selectedGroupsLimit", 5);
      expect(component.selectedGroupsLimit()).toBe(5);
    });

    it("should include selectionLimit in dropdown config when selectedGroupsLimit is set", () => {
      fixture.componentRef.setInput("selectedGroupsLimit", 6);
      fixture.detectChanges();

      const config = component.dropdownConfig();
      expect(config.selectionLimit).toBe(6);
    });

    it("should include undefined selectionLimit in dropdown config when selectedGroupsLimit is not set", () => {
      const config = component.dropdownConfig();
      expect(config.selectionLimit).toBeUndefined();
    });

    it("should set maxSelectedLabels to 4 in dropdown config", () => {
      const config = component.dropdownConfig();
      expect(config.maxSelectedLabels).toBe(4);
    });
  });

  describe("appendToBody", () => {
    it("should default appendToBody to true", () => {
      expect(component.appendToBody()).toBe(true);
    });

    it("should set appendTo to 'body' in dropdown config by default", () => {
      const config = component.dropdownConfig();
      expect(config.appendTo).toBe("body");
    });

    it("should support appendToBody input", () => {
      fixture.componentRef.setInput("appendToBody", false);
      fixture.detectChanges();
      expect(component.appendToBody()).toBe(false);
    });

    it("should set appendTo to null in dropdown config when appendToBody is false", () => {
      fixture.componentRef.setInput("appendToBody", false);
      fixture.detectChanges();
      const config = component.dropdownConfig();
      expect(config.appendTo).toBeNull();
    });
  });
});
