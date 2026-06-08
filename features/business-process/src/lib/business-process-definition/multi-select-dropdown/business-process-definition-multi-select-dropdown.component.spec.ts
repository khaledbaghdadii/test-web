import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { of, Subject, throwError } from "rxjs";
import { BusinessProcessDefinitionMultiSelectDropdownComponent } from "./business-process-definition-multi-select-dropdown.component";
import { BusinessProcessDefinitionService } from "../business-process-definition.service";
import { BusinessProcessDefinition } from "../business-process-definition";
import { ToastMessageService } from "@mxflow/ui/alert";

describe("BusinessProcessDefinitionMultiSelectDropdownComponent", () => {
  let component: BusinessProcessDefinitionMultiSelectDropdownComponent;
  let fixture: ComponentFixture<BusinessProcessDefinitionMultiSelectDropdownComponent>;
  let definitionService: Partial<BusinessProcessDefinitionService>;
  let messageService: Partial<ToastMessageService>;

  beforeEach(() => {
    definitionService = {
      getBusinessProcessDefinitions: jest
        .fn()
        .mockReturnValue(of(getBusinessProcessDefinitions())),
    };

    messageService = {
      showError: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [BusinessProcessDefinitionMultiSelectDropdownComponent],
      providers: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: definitionService,
        },
        {
          provide: ToastMessageService,
          useValue: messageService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BusinessProcessDefinitionMultiSelectDropdownComponent
    );
    component = fixture.componentInstance;

    component.projectId = "projectId";
    component.formControl = new FormControl<BusinessProcessDefinition[] | null>(
      []
    );
  });

  it("should fetch executable and non-extendable definitions on init", () => {
    component.ngOnInit();

    expect(
      definitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: "projectId",
      executable: true,
      extendable: false,
    });
    expect(component.definitions).toStrictEqual(
      getBusinessProcessDefinitions()
    );
  });

  it("should set loading to true until definition are fetched", () => {
    const subject = new Subject<BusinessProcessDefinition[]>();
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(subject.asObservable());

    expect(component.loading).toStrictEqual(true);
    component.ngOnInit();
    expect(component.loading).toStrictEqual(true);

    subject.next(getBusinessProcessDefinitions());
    expect(component.loading).toStrictEqual(false);
  });

  it("should not filter definitions when no source definition id is provided", () => {
    component.ngOnInit();

    expect(component.definitions).toStrictEqual(
      getBusinessProcessDefinitions()
    );
  });

  it("should filter definition when source definition id is provided", () => {
    component.sourceDefinitionId = "source-1";

    component.ngOnInit();

    expect(component.definitions).toStrictEqual([
      getBusinessProcessDefinitions()[0],
      getBusinessProcessDefinitions()[2],
    ]);
  });

  it("should show error message and keep loading when fetching definitions fails", () => {
    jest
      .spyOn(definitionService, "getBusinessProcessDefinitions")
      .mockReturnValue(throwError(() => new Error("errorMessage")));

    component.ngOnInit();

    expect(messageService.showError).toHaveBeenCalledWith("errorMessage");
    expect(component.loading).toStrictEqual(true);
  });

  function getBusinessProcessDefinitions(): BusinessProcessDefinition[] {
    return [
      {
        id: "def-1",
        name: "Definition 1",
        description: "First definition",
        family: {
          id: "family-1",
          name: "Family 1",
          inputs: [],
          process: { stages: [] },
        },
        processName: "process-1",
        providedInputs: [],
        executable: true,
        sourceDefinitionId: "source-1",
      },
      {
        id: "def-2",
        name: "Definition 2",
        description: "Second definition",
        family: {
          id: "family-2",
          name: "Family 2",
          inputs: [],
          process: { stages: [] },
        },
        processName: "process-2",
        providedInputs: [],
        executable: true,
        sourceDefinitionId: "source-2",
      },
      {
        id: "def-3",
        name: "Definition 3",
        description: "Third definition",
        family: {
          id: "family-3",
          name: "Family 3",
          inputs: [],
          process: { stages: [] },
        },
        processName: "process-3",
        providedInputs: [],
        executable: true,
        sourceDefinitionId: "source-1",
      },
    ];
  }
});
