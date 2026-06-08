import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ExpiryDateTagComponent } from "./expiry-date-tag.component";
import { formatDate } from "@angular/common";
import { DaysCountPipe } from "@mxflow/pipe";

describe("ExpiryDateTagComponent", () => {
  let component: ExpiryDateTagComponent;
  let fixture: ComponentFixture<ExpiryDateTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiryDateTagComponent],
      providers: [DaysCountPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpiryDateTagComponent);
    component = fixture.componentInstance;
  });

  it("given the process has not reached its expiry date then a tag that says Expires on 'date' should be shown", () => {
    component.expiryDate = "2025-10-15T14:29:00.976Z";
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-01T14:29:00.976Z"));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tagElement = compiled.querySelector("p-tag");
    expect(tagElement).toBeTruthy();
    const expected = formatDate(component.expiryDate, "medium", "en-US");
    expect(tagElement?.textContent).toContain(`Expires on ${expected}`);
  });

  it("given the process has exceeded its expiry date then no tag should be shown", () => {
    component.expiryDate = "2025-10-15T14:29:00.976Z";
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-16T14:29:00.976Z"));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tagElement = compiled.querySelector("p-tag");
    expect(tagElement).toBeNull();
  });

  it.each([
    {
      daysUntilExpiry: 0,
      expectedText: "Expires Today",
      currentDate: "2025-10-15T10:00:00.000Z",
    },
    {
      daysUntilExpiry: 1,
      expectedText: "Expires in 1 Day",
      currentDate: "2025-10-14T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 2,
      expectedText: "Expires in 2 Days",
      currentDate: "2025-10-13T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 3,
      expectedText: "Expires in 3 Days",
      currentDate: "2025-10-12T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 4,
      expectedText: "Expires in 4 Days",
      currentDate: "2025-10-11T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 5,
      expectedText: "Expires in 5 Days",
      currentDate: "2025-10-10T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 6,
      expectedText: "Expires in 6 Days",
      currentDate: "2025-10-09T14:29:00.976Z",
    },
    {
      daysUntilExpiry: 7,
      expectedText: "Expires in 7 Days",
      currentDate: "2025-10-08T14:29:00.976Z",
    },
  ])(
    "given the process has $daysUntilExpiry days until expiry then an additional $expectedText tag should be displayed",
    ({ expectedText, currentDate }) => {
      component.expiryDate = "2025-10-15T14:29:00.976Z";
      jest.useFakeTimers();
      jest.setSystemTime(new Date(currentDate));

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tagElements = compiled.querySelectorAll("p-tag");
      expect(tagElements.length).toBe(2);
      expect(tagElements[0].textContent).toBeTruthy();
      expect(tagElements[1].textContent).toContain(expectedText);
    }
  );

  it("given the process expires in more than 7 days it should only show one tag which is Expires on 'date'", () => {
    component.expiryDate = "2025-10-15T14:29:00.976Z";
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-01T14:29:00.976Z"));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tagElements = compiled.querySelectorAll("p-tag");
    expect(tagElements.length).toBe(1);
    expect(tagElements[0].textContent).toBeTruthy();
    const expected = formatDate(component.expiryDate, "medium", "en-US");
    expect(tagElements[0].textContent).toContain(`Expires on ${expected}`);
  });
});
