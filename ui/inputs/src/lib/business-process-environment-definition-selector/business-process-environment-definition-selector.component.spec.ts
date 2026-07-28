import { lastValueFrom, of } from "rxjs";
import { BusinessProcessEnvironmentDefinitionSelectorComponent } from "./business-process-environment-definition-selector.component";
import {
  EnvironmentDefinition,
  EnvironmentService,
} from "@mxflow/features/environment";
import { FormControl } from "@angular/forms";
import { fakeAsync, tick } from "@angular/core/testing";

const PROJECT_ID = "projectId";

describe("Business process environment definition selector", () => {
  let service: EnvironmentService;
  let component: BusinessProcessEnvironmentDefinitionSelectorComponent;

  beforeEach(() => {
    service = {
      getEnvironmentDefinitions: jest.fn(() =>
        of([
          {
            id: "environmentDef1",
            name: "firstEnvironmentDefinition",
          } as EnvironmentDefinition,
        ])
      ),
    } as unknown as EnvironmentService;

    component = new BusinessProcessEnvironmentDefinitionSelectorComponent(
      service
    );
    component.projectId = PROJECT_ID;
    component.environmentDefinitionFormControl = new FormControl();
  });

  it("should fetch the environment definitions with correct project id", async () => {
    component.ngOnInit();

    await lastValueFrom(component.options$);

    expect(service.getEnvironmentDefinitions).toHaveBeenCalledWith(PROJECT_ID);
  });

  it("should populate the environment definition options", async () => {
    component.ngOnInit();

    let options = await lastValueFrom(component.options$);

    expect(options.length).toEqual(1);
  });

  it("should populate environment definition names as option name", async () => {
    component.ngOnInit();

    let options = await lastValueFrom(component.options$);

    expect(options[0].name).toEqual("firstEnvironmentDefinition");
  });

  it("should populate environment definition ids as option value", async () => {
    component.ngOnInit();

    let options = await lastValueFrom(component.options$);

    expect(options[0].value).toEqual("environmentDef1");
  });

  it("should reset the form control value if preselected definition is now hidden", fakeAsync(() => {
    component.environmentDefinitionFormControl = new FormControl(
      "hiddenEnvDef"
    );
    component.invalidateHiddenEnvironmentDefinition = true;

    component.ngOnInit();
    component.options$.subscribe();
    tick();

    expect(component.environmentDefinitionFormControl.value).toBeNull();
  }));

  it("should not reset the form control value if preselected definition is now hidden upon user request", fakeAsync(() => {
    component.environmentDefinitionFormControl = new FormControl(
      "hiddenEnvDef"
    );

    component.invalidateHiddenEnvironmentDefinition = false;

    component.ngOnInit();
    component.options$.subscribe();
    tick();

    expect(component.environmentDefinitionFormControl.value).toEqual(
      "hiddenEnvDef"
    );
  }));
});
