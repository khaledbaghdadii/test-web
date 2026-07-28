import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ToggleHistoryButtonComponent } from "./toggle-history-button.component";
import { ButtonModule } from "primeng/button";
import { By } from "@angular/platform-browser";

describe("ToggleHistoryButtonComponent", () => {
  let component: ToggleHistoryButtonComponent;
  let fixture: ComponentFixture<ToggleHistoryButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonModule, ToggleHistoryButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleHistoryButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create the component", () => {
    const isComponentCreated = !!component;

    expect(isComponentCreated).toBe(true);
  });

  it('should display "Show History" label and down arrow icon when showHistory is false', () => {
    component.showHistory = false;

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("p-button"));

    expect(button.componentInstance.label).toBe("Show History");
    expect(button.componentInstance.icon).toBe("pi pi-arrow-down");
  });

  it('should display "Hide History" label and up arrow icon when showHistory is true', () => {
    component.showHistory = true;

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css("p-button"));

    expect(button.componentInstance.label).toBe("Hide History");
    expect(button.componentInstance.icon).toBe("pi pi-arrow-up");
  });

  it("should toggle showHistory value when toggle() is called", () => {
    component.showHistory = false;

    component.toggle();

    expect(component.showHistory).toBe(true);

    component.toggle();

    expect(component.showHistory).toBe(false);
  });

  it("should emit showHistoryChange event with the updated value when toggle() is called", () => {
    const emitSpy = jest.spyOn(component.showHistoryChange, "emit");
    component.showHistory = false;

    component.toggle();

    expect(emitSpy).toHaveBeenCalledWith(true);

    component.toggle();

    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it("should call toggle() when the button is clicked", () => {
    const toggleSpy = jest.spyOn(component, "toggle");

    const button = fixture.debugElement.query(By.css("p-button"));
    button.triggerEventHandler("click", null);

    expect(toggleSpy).toHaveBeenCalled();
  });
});
