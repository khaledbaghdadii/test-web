import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ShowMoreLessTextComponent } from "./show-more-less-text.component";
import { By } from "@angular/platform-browser";

describe("ShowMoreLessTextComponent", () => {
  let component: ShowMoreLessTextComponent;
  let fixture: ComponentFixture<ShowMoreLessTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMoreLessTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowMoreLessTextComponent);
    component = fixture.componentInstance;
  });

  it("should display the full text if text length is less than or equal to maxLength", () => {
    component.text = "Short text";
    component.maxLength = 20;
    fixture.detectChanges();

    const textContent =
      fixture.debugElement.nativeElement.querySelector("p").textContent;
    expect(textContent).toContain("Short text");
    expect(textContent).not.toContain("See More");
  });

  it('should truncate the text and show "See More" if text length exceeds maxLength', () => {
    component.text = "This is a long text that exceeds the max length.";
    component.maxLength = 20;
    fixture.detectChanges();

    const textContent =
      fixture.debugElement.nativeElement.querySelector("p").textContent;
    expect(textContent).toContain("This is a long text ...");
    expect(textContent).toContain("See More");
  });

  it('should expand the text when "See More" is clicked', () => {
    component.text = "This is a long text that exceeds the max length.";
    component.maxLength = 20;
    fixture.detectChanges();

    const seeMoreLink = fixture.debugElement.query(By.css("a"));
    seeMoreLink.triggerEventHandler("click", new Event("click"));
    fixture.detectChanges();

    const textContent =
      fixture.debugElement.nativeElement.querySelector("p").textContent;
    expect(textContent).toContain(
      "This is a long text that exceeds the max length."
    );
    expect(textContent).toContain("See Less");
  });

  it('should collapse the text when "See Less" is clicked', () => {
    component.text = "This is a long text that exceeds the max length.";
    component.maxLength = 20;
    component.isExpanded = true;
    fixture.detectChanges();

    const seeLessLink = fixture.debugElement.query(By.css("a"));
    seeLessLink.triggerEventHandler("click", new Event("click"));
    fixture.detectChanges();

    const textContent =
      fixture.debugElement.nativeElement.querySelector("p").textContent;
    expect(textContent).toContain("This is a long text ...");
    expect(textContent).toContain("See More");
  });
});
