import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScenarioExecutionMxVersionComponent } from "./scenario-execution-mx-version.component";
import { By } from "@angular/platform-browser";

const MX_VERSION = "1.2.3";

describe("scenario execution mx version component", () => {
  let component: ScenarioExecutionMxVersionComponent;
  let fixture: ComponentFixture<ScenarioExecutionMxVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionMxVersionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionMxVersionComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should display the mx version if provided", () => {
    component.mxVersion = MX_VERSION;
    fixture.detectChanges();

    expect(getMxVersionElement().textContent.trim()).toBe(MX_VERSION);
  });

  it("should display empty if mx version not provided", () => {
    component.mxVersion = undefined;
    fixture.detectChanges();

    expect(getMxVersionElement().textContent.trim()).toBe("-");
  });

  function getMxVersionElement() {
    return fixture.debugElement.query(By.css("span")).nativeElement;
  }
});
