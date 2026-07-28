import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ValueCardComponent } from "./value-card.component";
import { Card } from "primeng/card";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { ErrorAlertComponent } from "@mxflow/ui/alert";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ValueCardComponent", () => {
  let component: ValueCardComponent;
  let fixture: ComponentFixture<ValueCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ValueCardComponent,
        Card,
        Tooltip,
        Skeleton,
        FaIconComponent,
        ErrorAlertComponent,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ValueCardComponent);
    component = fixture.componentInstance;
  });

  it("should display value and tooltip when not loading or error", () => {
    component.value = "Test Value";
    component.tooltip = "Test Tooltip";
    component.loading = false;
    component.error = "";
    fixture.detectChanges();

    const valueEl = fixture.debugElement.query(By.css("h3"));
    expect(valueEl.nativeElement.textContent).toContain("Test Value");

    const tooltipEl = fixture.debugElement.query(By.css("fa-icon"));
    expect(tooltipEl).toBeTruthy();
  });

  it("should display skeletons when loading", () => {
    component.loading = true;
    fixture.detectChanges();

    const skeletons = fixture.debugElement.queryAll(By.css("p-skeleton"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display error alert when error is present", () => {
    component.loading = false;
    component.error = "Some error";
    component.description = "desc";
    fixture.detectChanges();

    const errorAlert = fixture.debugElement.query(By.css("mxflow-error-alert"));
    expect(errorAlert).toBeTruthy();
  });

  it("should display description if present", () => {
    component.loading = false;
    component.description = "Description here";
    fixture.detectChanges();

    const descEl = fixture.debugElement.query(By.css("p.font-medium"));
    expect(descEl.nativeElement.textContent).toContain("Description here");
  });

  it("given that card component is loaded and is clickable, when the user clicks on the card, then we should announce that the card has been clicked", () => {
    component.isClickable = true;
    component.loading = false;
    component.clicked.emit = jest.fn();
    component.onClick();
    expect(component.clicked.emit).toHaveBeenCalledTimes(1);
  });
});
