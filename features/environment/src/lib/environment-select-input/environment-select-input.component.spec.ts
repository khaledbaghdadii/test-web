import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EnvironmentSelectInputComponent } from "./environment-select-input.component";
import { of } from "rxjs";
import { EnvironmentService } from "../service/environment.service";
import { EnvironmentDefinition } from "../environment-definition";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { EnvironmentDefinitionStatus } from "@mxflow/features/environment";

const PROJECT_ID = "project123";
const ENVIRONMENT_DEFINITION_ID_1 = "1";
const ENVIRONMENT_DEFINITION_ID_2 = "2";
const ENVIRONMENT_DEFINITION_NAME_1 = "Test Environment 1";
const ENVIRONMENT_DEFINITION_NAME_2 = "Test Environment 2";
const ENVIRONMENT_DEFINITION_ID_3 = "3";
const ENVIRONMENT_DEFINITIONS: EnvironmentDefinition[] = [
  {
    id: ENVIRONMENT_DEFINITION_ID_1,
    name: ENVIRONMENT_DEFINITION_NAME_1,
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
  {
    id: ENVIRONMENT_DEFINITION_ID_2,
    name: ENVIRONMENT_DEFINITION_NAME_2,
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
];
describe("EnvironmentSelectInputComponent", () => {
  let component: EnvironmentSelectInputComponent;
  let fixture: ComponentFixture<EnvironmentSelectInputComponent>;
  let environmentService: jest.Mocked<EnvironmentService>;

  beforeEach(async () => {
    environmentService = {
      getEnvironmentDefinitions: jest.fn(),
    } as unknown as jest.Mocked<EnvironmentService>;

    await TestBed.configureTestingModule({
      declarations: [EnvironmentSelectInputComponent],
      providers: [
        { provide: EnvironmentService, useValue: environmentService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvironmentSelectInputComponent);
    component = fixture.componentInstance;
    environmentService.getEnvironmentDefinitions.mockReturnValue(
      of(ENVIRONMENT_DEFINITIONS)
    );
    component.projectId = PROJECT_ID;
    component.form = new FormGroup({
      environmentDefinitionId: new FormControl<string | null>(null, [
        Validators.required,
      ]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch environment definitions on initialization", () => {
    component.ngOnInit();
    expect(environmentService.getEnvironmentDefinitions).toHaveBeenCalledWith(
      PROJECT_ID
    );
    expect(component.environmentDefinitions).toEqual(ENVIRONMENT_DEFINITIONS);
  });

  it("should set the default environment definition value in the form if active", () => {
    component.ngOnInit();
    component.defaultEnvironmentDefinitionId = ENVIRONMENT_DEFINITION_ID_2;
    expect(component.form.get("environmentDefinitionId")?.value).toEqual(
      ENVIRONMENT_DEFINITION_ID_2
    );
  });

  it("should not set the default environment definition value in the form if archived", () => {
    component.ngOnInit();
    component.defaultEnvironmentDefinitionId = ENVIRONMENT_DEFINITION_ID_3;
    expect(component.form.get("environmentDefinitionId")?.value).toBeNull();
  });

  it("should not set the default environment definition value in the form if not provided", () => {
    component.ngOnInit();
    expect(component.form.get("environmentDefinitionId")?.value).toBeNull();
  });

  it("should set the default environment definition value in the form correctly if the input was provided before the component was initialized", () => {
    component.defaultEnvironmentDefinitionId = ENVIRONMENT_DEFINITION_ID_2;
    component.ngOnInit();
    expect(component.form.get("environmentDefinitionId")?.value).toEqual(
      ENVIRONMENT_DEFINITION_ID_2
    );
  });
  it("should emit the selected environment definition when the form value changes", () => {
    const emitSpy = jest.spyOn(component.environmentDefinitionSelected, "emit");
    component.ngOnInit();
    component.form
      .get("environmentDefinitionId")
      ?.setValue(ENVIRONMENT_DEFINITION_ID_1);

    expect(emitSpy).toHaveBeenCalledWith(ENVIRONMENT_DEFINITIONS[0]);

    component.form
      .get("environmentDefinitionId")
      ?.setValue(ENVIRONMENT_DEFINITION_ID_2);

    expect(emitSpy).toHaveBeenCalledWith(ENVIRONMENT_DEFINITIONS[1]);
  });

  it("should filter environment definitions based on the search key", () => {
    component.ngOnInit();
    component.searchKey = "Test Environment 1";
    component.onSearch();
    expect(component.filteredEnvironmentDefinitions).toEqual([
      ENVIRONMENT_DEFINITIONS[0],
    ]);
  });

  it("should clear the search key and reset filtered environment definitions", () => {
    component.ngOnInit();
    component.searchKey = "Test Environment 1";
    component.onSearch();
    expect(component.filteredEnvironmentDefinitions).toEqual([
      ENVIRONMENT_DEFINITIONS[0],
    ]);

    component.clearSearchValue({ stopPropagation: jest.fn() });
    expect(component.searchKey).toBe("");
    expect(component.filteredEnvironmentDefinitions).toEqual(
      ENVIRONMENT_DEFINITIONS
    );
  });
});
