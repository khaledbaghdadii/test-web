import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MxevolveIllustrationComponent } from "./mxevolve-illustration.component";
import { ILLUSTRATIONS_PATH } from "./illustration-urls.token";
import { By } from "@angular/platform-browser";

describe("MxevolveIllustrationComponent", () => {
  function setInput(
    fixture: ComponentFixture<MxevolveIllustrationComponent>,
    name: string,
    value: unknown
  ): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  describe("without ILLUSTRATIONS_PATH", () => {
    let fixture: ComponentFixture<MxevolveIllustrationComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MxevolveIllustrationComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(MxevolveIllustrationComponent);
    });

    it("should render nothing and log error when no base path is provided", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      setInput(fixture, "name", "order_delivered");

      expect(
        fixture.debugElement.query(By.css("img.mxevolve-illustration__svg"))
      ).toBeNull();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Illustration "order_delivered" not found')
      );

      errorSpy.mockRestore();
    });
  });

  describe("with ILLUSTRATIONS_PATH", () => {
    let fixture: ComponentFixture<MxevolveIllustrationComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MxevolveIllustrationComponent],
        providers: [
          { provide: ILLUSTRATIONS_PATH, useValue: "assets/illustrations" },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(MxevolveIllustrationComponent);
    });

    describe("URL rendering", () => {
      it("should render an illustration as an img using the base path", () => {
        setInput(fixture, "name", "order_delivered");

        const img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img).toBeTruthy();
        expect(img.nativeElement.getAttribute("src")).toBe(
          "assets/illustrations/order_delivered.svg"
        );
      });

      it("should construct the correct URL for any name", () => {
        setInput(fixture, "name", "designing_architecture_in_metaverse");

        const img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img.nativeElement.getAttribute("src")).toBe(
          "assets/illustrations/designing_architecture_in_metaverse.svg"
        );
      });
    });

    describe("size presets", () => {
      it("should not apply a size class by default", () => {
        setInput(fixture, "name", "test_illustration");

        const classes: string = fixture.nativeElement.className;
        expect(classes).not.toContain("mxevolve-illustration-xs");
        expect(classes).not.toContain("mxevolve-illustration-sm");
        expect(classes).not.toContain("mxevolve-illustration-md");
        expect(classes).not.toContain("mxevolve-illustration-lg");
        expect(classes).not.toContain("mxevolve-illustration-xl");
        expect(classes).not.toContain("mxevolve-illustration-xxl");
      });

      it("should apply the correct size class when size is set", () => {
        setInput(fixture, "name", "test_illustration");
        setInput(fixture, "size", "lg");

        expect(
          fixture.nativeElement.classList.contains("mxevolve-illustration-lg")
        ).toBe(true);
      });

      it("should apply xxl size class", () => {
        setInput(fixture, "name", "test_illustration");
        setInput(fixture, "size", "xxl");

        expect(
          fixture.nativeElement.classList.contains("mxevolve-illustration-xxl")
        ).toBe(true);
      });
    });

    describe("accessibility", () => {
      it("should set aria-hidden and empty alt when no ariaLabel is provided", () => {
        setInput(fixture, "name", "some_illustration");

        const img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img.nativeElement.getAttribute("aria-hidden")).toBe("true");
        expect(img.nativeElement.getAttribute("alt")).toBe("");
      });

      it("should set alt and remove aria-hidden when ariaLabel is provided", () => {
        setInput(fixture, "name", "some_illustration");
        setInput(fixture, "ariaLabel", "Delivery completed");

        const img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img.nativeElement.getAttribute("alt")).toBe(
          "Delivery completed"
        );
        expect(img.nativeElement.getAttribute("aria-hidden")).toBeNull();
      });
    });

    describe("name changes", () => {
      it("should re-resolve when the name input changes", () => {
        setInput(fixture, "name", "first");

        let img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img.nativeElement.getAttribute("src")).toBe(
          "assets/illustrations/first.svg"
        );

        setInput(fixture, "name", "second");

        img = fixture.debugElement.query(
          By.css("img.mxevolve-illustration__svg")
        );
        expect(img.nativeElement.getAttribute("src")).toBe(
          "assets/illustrations/second.svg"
        );
      });
    });
  });
});
