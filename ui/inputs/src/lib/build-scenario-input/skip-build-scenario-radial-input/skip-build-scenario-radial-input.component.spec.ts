import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SkipBuildScenarioRadialInputComponent } from "@mxflow/ui/inputs";
import { By } from "@angular/platform-browser";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";

describe("SkipBuildScenarioRadialInput", () => {
  let component: SkipBuildScenarioRadialInputComponent;
  let fixture: ComponentFixture<SkipBuildScenarioRadialInputComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CheckboxModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SkipBuildScenarioRadialInputComponent);
    component = fixture.componentInstance;
  });
  it("should create successfully", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
  it("given the user checks the skip environment deployment checkbox it should update the form control value", () => {
    component.formControl = new FormControl(false);
    fixture.detectChanges();
    const checkbox = fixture.debugElement.query(
      By.css("#skip-prepare-build-environment-checkbox input")
    );

    checkbox.nativeElement.click();
    fixture.detectChanges();

    expect(component.formControl.value).toEqual(true);
  });
  it("given the user unchecks the skip environment deployment checkbox it should update the form control value", () => {
    component.formControl = new FormControl(true);
    fixture.detectChanges();
    const checkbox = fixture.debugElement.query(
      By.css("#skip-prepare-build-environment-checkbox input")
    );

    checkbox.nativeElement.click();
    fixture.detectChanges();

    expect(component.formControl.value).toEqual(false);
  });
});
