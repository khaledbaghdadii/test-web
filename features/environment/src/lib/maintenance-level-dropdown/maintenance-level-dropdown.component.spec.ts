import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MaintenanceLevelDropdownComponent } from "./maintenance-level-dropdown.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MaintenanceConfiguration } from "@mxflow/features/environment";

const PROJECT_ID = "project123";

describe("MaintenanceLevelDropdownComponent", () => {
  let component: MaintenanceLevelDropdownComponent;
  let fixture: ComponentFixture<MaintenanceLevelDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceLevelDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceLevelDropdownComponent);
    component = fixture.componentInstance;

    component.projectId = PROJECT_ID;
    component.form = new FormGroup({
      maintenanceConfiguration: new FormControl<string | null>(null, [
        Validators.required,
      ]),
    });

    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should emit the selected maintenance level when the form value changes", () => {
    const emitSpy = jest.spyOn(component.maintenanceLevelSelected, "emit");
    const fullMaintenance = getFullMaintenance();
    component.ngOnInit();
    component.form.get("maintenanceConfiguration")?.setValue(fullMaintenance);

    expect(emitSpy).toHaveBeenCalledWith(fullMaintenance);

    const customMaintenance = getCustomMaintenance();
    component.form.get("maintenanceConfiguration")?.setValue(customMaintenance);

    expect(emitSpy).toHaveBeenCalledWith(customMaintenance);
  });

  it("should unsubscribe and stop emitting the event on destroy", () => {
    const emitSpy = jest.spyOn(component.maintenanceLevelSelected, "emit");

    component.form
      .get("maintenanceConfiguration")
      ?.setValue(getFullMaintenance());
    expect(emitSpy).toHaveBeenCalledTimes(1);

    component.ngOnDestroy();

    component.form
      .get("maintenanceConfiguration")
      ?.setValue(getCustomMaintenance());
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  function getFullMaintenance(): MaintenanceConfiguration {
    return {
      full: true,
    };
  }

  function getCustomMaintenance(): MaintenanceConfiguration {
    return {
      full: false,
    };
  }
});
