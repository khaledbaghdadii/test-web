import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ErrorAlertComponent } from "./error-alert.component";
import { provideNoopAnimations } from "@angular/platform-browser/animations";

describe("ErrorAlertComponent", () => {
  let component: ErrorAlertComponent;
  let fixture: ComponentFixture<ErrorAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorAlertComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorAlertComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Basic functionality", () => {
    it("should display error message", () => {
      const testMessage = "Test error message";
      component.errorMessage = testMessage;
      fixture.detectChanges();

      const messageElement = fixture.debugElement.query(By.css(".font-medium"));
      expect(messageElement.nativeElement.textContent.trim()).toBe(testMessage);
    });

    it("should emit closeErrorAlert when close is triggered", () => {
      jest.spyOn(component.closeErrorAlert, "emit");

      component.afterClose();

      expect(component.closeErrorAlert.emit).toHaveBeenCalled();
    });

    it("should be closeable by default", () => {
      expect(component.closeable).toBe(true);
    });

    it("should respect closeable input property", () => {
      component.closeable = false;
      fixture.detectChanges();

      expect(component.closeable).toBe(false);
    });
  });

  describe("Error details functionality", () => {
    it("should not show details section when errorDetails is not provided", () => {
      component.errorMessage = "Test error";
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      expect(toggleButton).toBeNull();
    });

    it("should show details toggle button when errorDetails is provided", () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      expect(toggleButton).toBeTruthy();
    });

    it('should initially show "View failure details" with down arrow', () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      expect(toggleButton).toBeTruthy();

      expect(component.isExpanded).toBe(false);

      const buttonText = toggleButton.nativeElement.textContent;
      expect(buttonText).toContain("View failure details");
      expect(toggleButton.componentInstance.icon).toBe("pi pi-chevron-down");
    });

    it("should not show error details content initially", () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      fixture.detectChanges();

      const detailsContent = fixture.debugElement.query(
        By.css(".font-medium.whitespace-pre-wrap")
      );
      expect(detailsContent).toBeNull();
    });

    it("should expand details when toggle button is clicked", () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      toggleButton.triggerEventHandler("onClick", null);
      fixture.detectChanges();

      expect(component.isExpanded).toBe(true);

      const detailsContent = fixture.debugElement.query(
        By.css(".font-medium.whitespace-pre-wrap")
      );
      expect(detailsContent).toBeTruthy();
      expect(detailsContent.nativeElement.textContent.trim()).toBe(
        "Detailed error information"
      );
    });

    it('should show "Hide failure details" with up arrow when expanded', () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      component.isExpanded = true;
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      expect(toggleButton).toBeTruthy();

      expect(component.isExpanded).toBe(true);

      const buttonText = toggleButton.nativeElement.textContent;
      expect(buttonText).toContain("Hide failure details");
      expect(toggleButton.componentInstance.icon).toBe("pi pi-chevron-up");
    });

    it("should collapse details when toggle button is clicked again", () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      component.isExpanded = true;
      fixture.detectChanges();

      const toggleButton = fixture.debugElement.query(By.css("p-button"));
      toggleButton.triggerEventHandler("onClick", null);
      fixture.detectChanges();

      expect(component.isExpanded).toBe(false);

      const detailsContent = fixture.debugElement.query(
        By.css(".font-medium.whitespace-pre-wrap")
      );
      expect(detailsContent).toBeNull();
    });

    it("should toggle state correctly with multiple clicks", () => {
      component.errorMessage = "Test error";
      component.errorDetails = "Detailed error information";
      fixture.detectChanges();

      expect(component.isExpanded).toBe(false);

      // First click - expand
      component.toggleDetails();
      expect(component.isExpanded).toBe(true);

      // Second click - collapse
      component.toggleDetails();
      expect(component.isExpanded).toBe(false);

      // Third click - expand again
      component.toggleDetails();
      expect(component.isExpanded).toBe(true);
    });
  });
});
