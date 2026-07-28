import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import { MXEvolveShowMoreLessComponent } from "./mxevolve-show-more-less.component";

describe("MXEvolveShowMoreLessComponent", () => {
  let component: MXEvolveShowMoreLessComponent;
  let fixture: ComponentFixture<MXEvolveShowMoreLessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [MXEvolveShowMoreLessComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MXEvolveShowMoreLessComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not render any item if list of items is empty", () => {
    fixture.componentRef.setInput("listOfItems", []);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(".mr-1");

    expect(items.length).toBe(0);
  });

  it("should render default number of items horizontally initially when isVertical is false", () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(".mr-1");

    expect(items.length).toBe(component.defaultNbOfItemsToShow());
  });

  it("should render default number of items vertically initially when isVertical is true", () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.componentRef.setInput("isVertical", true);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(".mb-1");

    expect(items.length).toBe(component.defaultNbOfItemsToShow());
  });

  it('should show all items when "Show More" is clicked', () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.detectChanges();

    const showMoreButton = fixture.nativeElement.querySelector(
      ".show-more-less-text"
    );
    showMoreButton.click();

    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll(".mr-1");
    expect(items.length).toBe(component.listOfItems().length);
    expect(component.nbOfItemsToShow()).toEqual(component.listOfItems().length);
  });

  it('should show less items when "Show Less" is clicked', () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.detectChanges();

    component.showAllItems({ stopPropagation: () => null });
    fixture.detectChanges();

    let items = fixture.nativeElement.querySelectorAll(".mr-1");
    expect(items.length).toBe(component.listOfItems().length);

    const showLessButton = fixture.nativeElement.querySelector(
      ".show-more-less-text"
    );
    showLessButton.click();
    fixture.detectChanges();

    items = fixture.nativeElement.querySelectorAll(".mr-1");
    expect(items.length).toBe(component.defaultNbOfItemsToShow());
    expect(component.nbOfItemsToShow()).toEqual(
      component.defaultNbOfItemsToShow()
    );
  });

  it("should display the correct number of hidden items on init", () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);

    fixture.detectChanges();

    const hiddenItemsSpan = fixture.nativeElement.querySelector(
      ".show-more-less-text:last-child"
    );
    const hiddenItemsCount =
      component.listOfItems().length - component.defaultNbOfItemsToShow();
    expect(hiddenItemsSpan.textContent.trim()).toContain(
      `(${hiddenItemsCount})`
    );
  });

  it("should display the correct number of hidden items on changes", () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.detectChanges();

    const hiddenItemsSpan = fixture.nativeElement.querySelector(
      ".show-more-less-text:last-child"
    );
    const hiddenItemsCount =
      component.listOfItems().length - component.defaultNbOfItemsToShow();
    expect(hiddenItemsSpan.textContent.trim()).toContain(
      `(${hiddenItemsCount})`
    );
  });

  it("should initialize nbOfItemsToShow with default value", () => {
    fixture.detectChanges();
    expect(component.nbOfItemsToShow()).toEqual(
      component.defaultNbOfItemsToShow()
    );
  });

  it("should reset to default number of items when listOfItems content changes", () => {
    fixture.componentRef.setInput("listOfItems", [
      "Item 1",
      "Item 2",
      "Item 3",
      "Item 4",
      "Item 5",
    ]);
    fixture.detectChanges();

    component.showAllItems({ stopPropagation: () => null });
    fixture.detectChanges();
    expect(component.nbOfItemsToShow()).toEqual(5);

    fixture.componentRef.setInput("listOfItems", [
      "Item A",
      "Item B",
      "Item C",
      "Item D",
      "Item E",
      "Item F",
    ]);
    fixture.detectChanges();

    expect(component.nbOfItemsToShow()).toEqual(
      component.defaultNbOfItemsToShow()
    );
  });

  describe("getItemRouterLink", () => {
    it("should render plain text (no anchor) when getItemRouterLink is not provided", () => {
      fixture.componentRef.setInput("listOfItems", ["Item 1", "Item 2"]);
      fixture.detectChanges();

      const anchors = fixture.nativeElement.querySelectorAll("a");
      expect(anchors.length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain("Item 1");
    });

    it("should render an anchor with routerLink for each item when getItemRouterLink is provided", () => {
      fixture.componentRef.setInput("listOfItems", ["env-1", "env-2"]);
      fixture.componentRef.setInput("getItemRouterLink", (item: string) => [
        "/app",
        "project-1",
        "environments",
        item,
      ]);
      fixture.detectChanges();

      const anchors = fixture.nativeElement.querySelectorAll("a");
      expect(anchors.length).toBe(2);
      expect(anchors[0].textContent.trim()).toBe("env-1");
      expect(anchors[1].textContent.trim()).toBe("env-2");
    });

    it("should render anchors vertically when isVertical and getItemRouterLink are provided", () => {
      fixture.componentRef.setInput("listOfItems", ["env-1", "env-2"]);
      fixture.componentRef.setInput("isVertical", true);
      fixture.componentRef.setInput("getItemRouterLink", (item: string) => [
        "/app",
        "project-1",
        "environments",
        item,
      ]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(".mb-1");
      const anchors = fixture.nativeElement.querySelectorAll("a");
      expect(items.length).toBe(2);
      expect(anchors.length).toBe(2);
    });
  });
});
