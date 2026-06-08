import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InfraFamilySelectComponent } from "./infra-family-select.component";
import {
  MxevolveSingleSelectDropdownComponent,
  BaseSingleSelectDropdown,
} from "@mxflow/ui/mxevolve-dropdown";
import { InfraFamilyService } from "./infra-family.service";
import { DestroyRef } from "@angular/core";
import { of } from "rxjs";
import { InfraFamily } from "./model/infra-family.model";

describe("InfraFamilySelectComponent", () => {
  let fixture: ComponentFixture<InfraFamilySelectComponent>;
  let component: InfraFamilySelectComponent;
  let mockInfraFamilyService: jest.Mocked<InfraFamilyService>;

  const INFRA_FAMILY: InfraFamily = {
    id: "infraFamily1",
    name: "Family 1",
    projectId: "PROJECT_ID",
    description: "Description 1",
    createdOn: "2026-01-12T14:49:51.785Z",
    lastModifiedOn: "2026-01-12T14:49:51.785Z",
    createdBy: "user1",
    lastModifiedBy: "user1",
  };
  const PROJECT_ID = "PROJECT_ID";

  beforeEach(async () => {
    mockInfraFamilyService = {
      getInfraFamilies: jest.fn().mockReturnValue(of([INFRA_FAMILY])),
    } as unknown as jest.Mocked<InfraFamilyService>;

    const mockDestroyRef = {
      onDestroy: jest.fn(),
    } as unknown as DestroyRef;

    await TestBed.configureTestingModule({
      imports: [
        InfraFamilySelectComponent,
        MxevolveSingleSelectDropdownComponent,
      ],
    })
      .overrideComponent(InfraFamilySelectComponent, {
        set: {
          providers: [
            {
              provide: InfraFamilyService,
              useValue: mockInfraFamilyService,
            },
            {
              provide: DestroyRef,
              useValue: mockDestroyRef,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InfraFamilySelectComponent);
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
});
