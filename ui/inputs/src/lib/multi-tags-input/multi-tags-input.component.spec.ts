import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MultiTagsInputComponent } from "./multi-tags-input.component";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AutoCompleteModule, AutoComplete } from "primeng/autocomplete";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("MultiTagsInputComponent", () => {
  let component: MultiTagsInputComponent;
  let fixture: ComponentFixture<MultiTagsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        AutoCompleteModule,
        NoopAnimationsModule,
        MultiTagsInputComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiTagsInputComponent);
    component = fixture.componentInstance;
  });

  describe("Component Initialization", () => {
    it("should create component", () => {
      expect(component).toBeTruthy();
    });

    it("should initialize with empty tags array", () => {
      expect(component.tags).toEqual([]);
    });

    it("should initialize with empty placeholder", () => {
      expect(component.placeholder).toBe("");
    });

    it("should initialize as enabled", () => {
      expect(component.disabled).toBe(false);
    });
  });

  describe("Input Properties", () => {
    it("should accept tags input", () => {
      const testTags = ["tag1", "tag2", "tag3"];
      component.tags = testTags;

      expect(component.tags).toEqual(testTags);
    });

    it("should accept placeholder input", () => {
      const testPlaceholder = "Enter your tags...";
      component.placeholder = testPlaceholder;

      expect(component.placeholder).toBe(testPlaceholder);
    });

    it("should accept disabled input", () => {
      component.disabled = true;

      expect(component.disabled).toBe(true);
    });
  });

  describe("Template Rendering", () => {
    it("should render p-autoComplete component", () => {
      fixture.detectChanges();

      const autoCompleteElement = fixture.debugElement.query(
        By.css("p-autocomplete")
      );

      expect(autoCompleteElement).toBeTruthy();
    });

    it("should pass placeholder to autoComplete", () => {
      component.placeholder = "Test placeholder";
      fixture.detectChanges();

      const inputElement = fixture.debugElement.query(
        By.css("input.p-autocomplete-input")
      );
      expect(inputElement.nativeElement.getAttribute("placeholder")).toBe(
        "Test placeholder"
      );
    });

    it("should pass disabled state to autoComplete", () => {
      component.disabled = true;
      fixture.detectChanges();

      const inputElement = fixture.debugElement.query(
        By.css("input.p-autocomplete-input")
      );

      expect(inputElement.nativeElement.disabled).toBe(true);
    });

    it("should have custom clear button when tags exist", () => {
      component.tags = ["tag1", "tag2"];
      fixture.detectChanges();

      const clearButton = fixture.debugElement.query(By.css(".clear-tags-btn"));
      expect(clearButton).toBeTruthy();
    });

    it("should not show clear button when disabled", () => {
      component.tags = ["tag1", "tag2"];
      component.disabled = true;
      fixture.detectChanges();

      const clearButton = fixture.debugElement.query(By.css(".clear-tags-btn"));
      expect(clearButton).toBeFalsy();
    });

    it("should have multiple mode enabled", () => {
      fixture.detectChanges();

      const multipleContainer = fixture.debugElement.query(
        By.css("ul.p-autocomplete-input-multiple")
      );
      expect(multipleContainer).toBeTruthy();
    });

    it("should have addOnBlur enabled", () => {
      fixture.detectChanges();

      const autoCompleteElement = fixture.debugElement.query(
        By.css("p-autocomplete")
      );
      expect(autoCompleteElement.attributes["addOnBlur"]).toBe("true");
    });
  });

  describe("onTagsChange Method", () => {
    it("should update internal tags when called with new values", () => {
      const newTags = ["new1", "new2"];

      component.onTagsChange(newTags);

      expect(component.tags).toEqual(newTags);
    });

    it("should emit tagsChange event when called", () => {
      const newTags = ["emit1", "emit2"];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.onTagsChange(newTags);

      expect(emitSpy).toHaveBeenCalledWith(newTags);
    });

    it("should handle null values by converting to empty array", () => {
      component.onTagsChange(null!);

      expect(component.tags).toEqual([]);
    });

    it("should handle undefined values by converting to empty array", () => {
      component.onTagsChange(undefined!);

      expect(component.tags).toEqual([]);
    });

    it("should filter out empty string tags", () => {
      const newTags = ["tag1", "", "tag2"];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.onTagsChange(newTags);

      expect(component.tags).toEqual(["tag1", "tag2"]);
      expect(emitSpy).toHaveBeenCalledWith(["tag1", "tag2"]);
    });

    it("should emit when filtered tags are different from current tags", () => {
      component.tags = ["tag1", "tag2"];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.onTagsChange(["tag1", "tag2", "", "tag3", "  "]);

      expect(component.tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(emitSpy).toHaveBeenCalledWith(["tag1", "tag2", "tag3"]);
    });

    it("should emit when tags are removed", () => {
      component.tags = ["tag1", "tag2", "tag3"];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.onTagsChange(["tag1", "tag3"]);

      expect(component.tags).toEqual(["tag1", "tag3"]);
      expect(emitSpy).toHaveBeenCalledWith(["tag1", "tag3"]);
    });

    it("should not emit when current tags are empty and new tags become empty after filtering", () => {
      component.tags = [];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.onTagsChange(["", "   ", null] as string[]);

      expect(component.tags).toEqual([]);
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe("Lifecycle Hooks", () => {
    let mockAutoCompleteContainer: HTMLElement;

    beforeEach(() => {
      mockAutoCompleteContainer = document.createElement("div");
      mockAutoCompleteContainer.className = "p-autocomplete-input-multiple";

      component.autoComp = {
        el: {
          nativeElement: {
            querySelector: jest.fn().mockReturnValue(mockAutoCompleteContainer),
          },
        },
      } as AutoComplete;
    });

    it("should initialize padding and scroll on ngAfterViewInit", async () => {
      component.tags = ["tag1", "tag2"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });

      component.ngAfterViewInit();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.style.paddingTop).toBe("0px");
      expect(mockAutoCompleteContainer.style.paddingBottom).toBe("0px");
    });

    it("should reset scroll position when tags change to 1 tag via ngOnChanges", async () => {
      component.tags = ["single-tag"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });
      mockAutoCompleteContainer.scrollLeft = 50;

      component.ngOnChanges({
        tags: {
          currentValue: ["single-tag"],
          previousValue: ["tag1", "tag2"],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(0);
    });

    it("should not update when tags length > 1 via ngOnChanges", async () => {
      component.tags = ["tag1", "tag2"];
      mockAutoCompleteContainer.scrollLeft = 50;
      const initialScrollLeft = mockAutoCompleteContainer.scrollLeft;

      component.ngOnChanges({
        tags: {
          currentValue: ["tag1", "tag2"],
          previousValue: ["tag1"],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(initialScrollLeft);
    });

    it("should not update when no tags change in ngOnChanges", async () => {
      component.tags = ["tag1", "tag2"];
      mockAutoCompleteContainer.scrollLeft = 50;
      const initialScrollLeft = mockAutoCompleteContainer.scrollLeft;

      component.ngOnChanges({
        placeholder: {
          currentValue: "New placeholder",
          previousValue: "Old placeholder",
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(initialScrollLeft);
    });

    it("should show overflow and adjust padding when adding multiple tags", async () => {
      component.tags = ["tag1", "tag2"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });

      component.onTagsChange(["tag1", "tag2"]);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(mockAutoCompleteContainer.style.paddingTop).toBe("0px");
      expect(mockAutoCompleteContainer.style.paddingBottom).toBe("0px");
    });

    it("should maintain normal padding when no scroll is needed", async () => {
      component.tags = ["tag1", "tag2"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });

      component.onTagsChange(["tag1", "tag2"]);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.style.paddingBottom).toBe("");
      expect(mockAutoCompleteContainer.style.paddingTop).toBe("");
    });

    it("should reset scroll position after clearing all tags", async () => {
      component.tags = ["tag1", "tag2"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });
      mockAutoCompleteContainer.scrollLeft = 50;

      component.clearAll();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(0);
    });

    it("should auto-scroll when adding tags while not disabled", async () => {
      component.tags = [];
      component.disabled = false;
      const mockInputElement = document.createElement("input");
      mockAutoCompleteContainer.appendChild(mockInputElement);

      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(mockInputElement, "offsetLeft", { value: 150 });
      Object.defineProperty(mockInputElement, "offsetWidth", { value: 50 });

      mockInputElement.getBoundingClientRect = jest
        .fn()
        .mockReturnValue({ right: 200, left: 150 });
      mockAutoCompleteContainer.getBoundingClientRect = jest
        .fn()
        .mockReturnValue({ right: 100, left: 0 });
      mockAutoCompleteContainer.querySelector = jest
        .fn()
        .mockReturnValue(mockInputElement);

      component.onTagsChange(["tag1", "tag2"]);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBeGreaterThanOrEqual(0);
    });

    it("should not auto-scroll when disabled", async () => {
      component.tags = ["tag1"];
      component.disabled = true;
      const mockInputElement = document.createElement("input");

      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });
      mockAutoCompleteContainer.scrollLeft = 0;
      mockAutoCompleteContainer.querySelector = jest
        .fn()
        .mockReturnValue(mockInputElement);

      component.onTagsChange(["tag1", "tag2"]);

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(0);
    });
  });

  describe("clearAll Method", () => {
    let mockAutoCompleteContainer: HTMLElement;

    beforeEach(() => {
      mockAutoCompleteContainer = document.createElement("div");
      mockAutoCompleteContainer.className = "p-autocomplete-input-multiple";

      component.autoComp = {
        el: {
          nativeElement: {
            querySelector: jest.fn().mockReturnValue(mockAutoCompleteContainer),
          },
        },
      } as AutoComplete;
    });

    it("should clear all tags", () => {
      component.tags = ["tag1", "tag2", "tag3"];

      component.clearAll();

      expect(component.tags).toEqual([]);
    });

    it("should emit empty array when clearing", () => {
      component.tags = ["tag1", "tag2"];
      const emitSpy = jest.spyOn(component.tagsChange, "emit");

      component.clearAll();

      expect(emitSpy).toHaveBeenCalledWith([]);
    });

    it("should reset scroll position when clearing", async () => {
      component.tags = ["tag1", "tag2"];
      Object.defineProperty(mockAutoCompleteContainer, "scrollWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(mockAutoCompleteContainer, "clientWidth", {
        value: 100,
        configurable: true,
      });
      mockAutoCompleteContainer.scrollLeft = 50;

      component.clearAll();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(mockAutoCompleteContainer.scrollLeft).toBe(0);
    });
  });

  describe("Event Handling", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should call onTagsChange when ngModelChange is triggered", () => {
      const onTagsChangeSpy = jest.spyOn(component, "onTagsChange");
      const testTags = ["event1", "event2"];

      const autoCompleteElement = fixture.debugElement.query(
        By.css("p-autocomplete")
      );
      autoCompleteElement.triggerEventHandler("ngModelChange", testTags);

      expect(onTagsChangeSpy).toHaveBeenCalledWith(testTags);
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it("should emit changes when tags are modified through the AutoComplete", () => {
      const emitSpy = jest.spyOn(component.tagsChange, "emit");
      const newTags = ["integration1", "integration2"];

      const autoCompleteElement = fixture.debugElement.query(
        By.css("p-autocomplete")
      );
      autoCompleteElement.triggerEventHandler("ngModelChange", newTags);

      expect(component.tags).toEqual(newTags);
      expect(emitSpy).toHaveBeenCalledWith(newTags);
    });

    it("should maintain binding between component tags and AutoComplete ngModel", () => {
      const testTags = ["binding1", "binding2"];
      component.tags = testTags;
      fixture.detectChanges();
      expect(component.tags).toEqual(testTags);

      const autoCompleteElement = fixture.debugElement.query(
        By.css("p-autocomplete")
      );
      const multipleContainer = fixture.debugElement.query(
        By.css("ul.p-autocomplete-input-multiple")
      );

      expect(autoCompleteElement).toBeTruthy();
      expect(multipleContainer).toBeTruthy();
    });
  });
});
