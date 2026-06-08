import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ScenarioExecutionMxBuildIdComponent } from "./scenario-execution-mx-build-id.component";

const MX_BUILD_ID = "1.2.3";

describe("scenario execution mx build id component", () => {
  let component: ScenarioExecutionMxBuildIdComponent;
  let fixture: ComponentFixture<ScenarioExecutionMxBuildIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionMxBuildIdComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionMxBuildIdComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should display the mx build id if provided", () => {
    component.mxBuildId = MX_BUILD_ID;
    fixture.detectChanges();

    expect(getMxBuildIdElement().textContent.trim()).toBe(MX_BUILD_ID);
  });

  it("should display empty if mx build id not provided", () => {
    component.mxBuildId = undefined;
    fixture.detectChanges();

    expect(getMxBuildIdElement().textContent.trim()).toBe("-");
  });

  function getMxBuildIdElement() {
    return fixture.debugElement.query(By.css("span")).nativeElement;
  }
});
