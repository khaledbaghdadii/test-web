import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MergeRequestPrioritySelectorComponent } from "./merge-request-priority-selector.component";
import { MergeRequestPrioritySelectorStateService } from "./state-service/merge-request-priority-selector-state.service";
import { MergeRequestPriority } from "@mxflow/features/scm-management";
import { signal } from "@angular/core";

describe("MergeRequestPrioritySelectorComponent", () => {
  let component: MergeRequestPrioritySelectorComponent;
  let fixture: ComponentFixture<MergeRequestPrioritySelectorComponent>;

  const mockErrorSignal = signal("");
  const mockLoadingSignal = signal(false);
  const mockStateService = {
    setMergeRequestIdSubject: jest.fn(),
    setProjectIdSubject: jest.fn(),
    setMergeRequestPrioritySubject: jest.fn(),
    errorMessageSignal: mockErrorSignal,
    isLoadingDataSignal: mockLoadingSignal,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeRequestPrioritySelectorComponent, ReactiveFormsModule],
    })
      .overrideComponent(MergeRequestPrioritySelectorComponent, {
        set: {
          providers: [
            {
              provide: MergeRequestPrioritySelectorStateService,
              useValue: mockStateService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MergeRequestPrioritySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Input Handling", () => {
    it("should set project and merge request IDs on mergeRequest input change", () => {
      const mergeRequest = {
        id: "123",
        projectId: "456",
        mergeRequestPriority: MergeRequestPriority.HIGH,
      };

      component.mergeRequest = mergeRequest;

      expect(mockStateService.setMergeRequestIdSubject).toHaveBeenCalledWith(
        "123"
      );
      expect(mockStateService.setProjectIdSubject).toHaveBeenCalledWith("456");
      expect(component.priorityForm.value.priority).toBe(
        MergeRequestPriority.HIGH
      );
    });
  });

  describe("Signal Subscriptions", () => {
    it("should emit errorEventEmitter when errorMessageSignal changes", fakeAsync(() => {
      const emitSpy = jest.spyOn(component.errorEventEmitter, "emit");

      mockErrorSignal.set("Error occurred");
      tick();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith("Error occurred");
    }));
  });

  describe("savePriority", () => {
    it("should call setMergeRequestPrioritySubject with the selected priority and set initial value", () => {
      const selected = MergeRequestPriority.CRITICAL;
      component.priorityForm.setValue({ priority: selected });

      component.savePriority();

      expect(
        mockStateService.setMergeRequestPrioritySubject
      ).toHaveBeenCalledWith(selected, expect.any(Function));
    });
  });

  describe("DomTests", () => {
    it("should call savePriority when the save button is clicked", () => {
      const spy = jest.spyOn(component, "savePriority");
      component.priorityForm.setValue({ priority: MergeRequestPriority.LOW });
      fixture.detectChanges();
      const saveButton = fixture.debugElement.nativeElement.querySelector(
        '[data-testid="save-button"]'
      );

      saveButton.click();

      expect(spy).toHaveBeenCalled();
    });
  });
});
