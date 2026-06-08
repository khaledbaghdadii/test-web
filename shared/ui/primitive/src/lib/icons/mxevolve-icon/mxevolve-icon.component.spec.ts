import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MxevolveIconComponent } from "./mxevolve-icon.component";
import { CUSTOM_ICONS_PATH } from "../custom-icons/custom-icon-urls.token";
import { By } from "@angular/platform-browser";

describe("MxevolveIconComponent", () => {
  function setInput(
    fixture: ComponentFixture<MxevolveIconComponent>,
    name: string,
    value: unknown
  ): void {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  describe("without CUSTOM_ICONS_PATH", () => {
    let fixture: ComponentFixture<MxevolveIconComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MxevolveIconComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(MxevolveIconComponent);
    });

    describe("Material Symbols rendering", () => {
      it("should render a mapped icon name as the correct Material Symbol ligature", () => {
        setInput(fixture, "name", "delete");

        const span = fixture.debugElement.query(
          By.css(".material-symbols-rounded")
        );
        expect(span).toBeTruthy();
        expect(span.nativeElement.textContent.trim()).toBe("delete");
      });

      it("should render a different mapped name correctly", () => {
        setInput(fixture, "name", "search");

        const span = fixture.debugElement.query(
          By.css(".material-symbols-rounded")
        );
        expect(span.nativeElement.textContent.trim()).toBe("search");
      });

      it("should render nothing and log error for unknown name without base path", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation();

        setInput(fixture, "name", "rocket_launch");

        expect(
          fixture.debugElement.query(By.css(".material-symbols-rounded"))
        ).toBeNull();
        expect(
          fixture.debugElement.query(By.css(".mxevolve-icon__custom-svg"))
        ).toBeNull();

        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Icon "rocket_launch" not found')
        );

        errorSpy.mockRestore();
      });
    });

    describe("filled state", () => {
      it("should not apply filled class by default", () => {
        setInput(fixture, "name", "check");

        expect(
          fixture.nativeElement.classList.contains("mxevolve-icon-filled")
        ).toBe(false);
      });

      it("should apply filled class when filled is true", () => {
        setInput(fixture, "name", "check");
        setInput(fixture, "filled", true);

        expect(
          fixture.nativeElement.classList.contains("mxevolve-icon-filled")
        ).toBe(true);
      });
    });

    describe("spin state", () => {
      it("should apply spin class when spin is true", () => {
        setInput(fixture, "name", "progress_activity");
        setInput(fixture, "spin", true);

        expect(
          fixture.nativeElement.classList.contains("mxevolve-icon-spin")
        ).toBe(true);
      });
    });

    describe("size presets", () => {
      it("should apply size class when size is set", () => {
        setInput(fixture, "name", "home");
        setInput(fixture, "size", "lg");

        expect(
          fixture.nativeElement.classList.contains("mxevolve-icon-lg")
        ).toBe(true);
      });

      it("should not apply size class by default", () => {
        setInput(fixture, "name", "home");

        const classes: string = fixture.nativeElement.className;
        expect(classes).not.toContain("mxevolve-icon-xs");
        expect(classes).not.toContain("mxevolve-icon-sm");
        expect(classes).not.toContain("mxevolve-icon-md");
        expect(classes).not.toContain("mxevolve-icon-lg");
      });
    });

    describe("color input", () => {
      it("should apply a CSS variable to style.color", () => {
        setInput(fixture, "name", "home");
        setInput(fixture, "color", "var(--p-primary-color)");

        expect(fixture.nativeElement.style.color).toBe(
          "var(--p-primary-color)"
        );
      });

      it("should apply a hex color", () => {
        setInput(fixture, "name", "home");
        setInput(fixture, "color", "#ff0000");

        expect(fixture.nativeElement.style.color).toBe("rgb(255, 0, 0)");
      });

      it("should apply an rgb() color", () => {
        setInput(fixture, "name", "home");
        setInput(fixture, "color", "rgb(255, 0, 0)");

        expect(fixture.nativeElement.style.color).toBe("rgb(255, 0, 0)");
      });

      it("should not apply color style by default", () => {
        setInput(fixture, "name", "home");

        expect(fixture.nativeElement.style.color).toBe("");
      });
    });

    describe("accessibility", () => {
      it("should set aria-hidden when no ariaLabel is provided", () => {
        setInput(fixture, "name", "delete");

        const span = fixture.debugElement.query(
          By.css(".material-symbols-rounded")
        );
        expect(span.nativeElement.getAttribute("aria-hidden")).toBe("true");
        expect(span.nativeElement.getAttribute("aria-label")).toBeNull();
      });

      it("should set aria-label and remove aria-hidden when ariaLabel is provided", () => {
        setInput(fixture, "name", "delete");
        setInput(fixture, "ariaLabel", "Delete item");

        const span = fixture.debugElement.query(
          By.css(".material-symbols-rounded")
        );
        expect(span.nativeElement.getAttribute("aria-label")).toBe(
          "Delete item"
        );
        expect(span.nativeElement.getAttribute("aria-hidden")).toBeNull();
      });
    });

    describe("name changes", () => {
      it("should re-resolve when name input changes", () => {
        setInput(fixture, "name", "delete");

        let span = fixture.debugElement.query(
          By.css(".material-symbols-rounded")
        );
        expect(span.nativeElement.textContent.trim()).toBe("delete");

        setInput(fixture, "name", "search");

        span = fixture.debugElement.query(By.css(".material-symbols-rounded"));
        expect(span.nativeElement.textContent.trim()).toBe("search");
      });
    });
  });

  describe("with CUSTOM_ICONS_PATH", () => {
    let fixture: ComponentFixture<MxevolveIconComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [MxevolveIconComponent],
        providers: [{ provide: CUSTOM_ICONS_PATH, useValue: "assets/icons" }],
      }).compileComponents();

      fixture = TestBed.createComponent(MxevolveIconComponent);
    });

    it("should still render material icons when name is in MX_ICON_NAMES", () => {
      setInput(fixture, "name", "delete");

      const span = fixture.debugElement.query(
        By.css(".material-symbols-rounded")
      );
      expect(span).toBeTruthy();
      expect(span.nativeElement.textContent.trim()).toBe("delete");

      expect(
        fixture.debugElement.query(By.css("img.mxevolve-icon__custom-svg"))
      ).toBeNull();
    });

    it("should render an <img> for a non-material name using base path", () => {
      setInput(fixture, "name", "murex_logo_ball");

      const img = fixture.debugElement.query(
        By.css("img.mxevolve-icon__custom-svg")
      );
      expect(img).toBeTruthy();
      expect(img.nativeElement.getAttribute("src")).toBe(
        "assets/icons/murex_logo_ball.svg"
      );

      expect(
        fixture.debugElement.query(By.css(".material-symbols-rounded"))
      ).toBeNull();
    });

    it("should set alt from ariaLabel on custom icon img", () => {
      setInput(fixture, "name", "murex_logo_ball");
      setInput(fixture, "ariaLabel", "Company logo");

      const img = fixture.debugElement.query(
        By.css("img.mxevolve-icon__custom-svg")
      );
      expect(img.nativeElement.getAttribute("alt")).toBe("Company logo");
      expect(img.nativeElement.getAttribute("aria-hidden")).toBeNull();
    });

    it("should set aria-hidden and empty alt when no ariaLabel on custom icon", () => {
      setInput(fixture, "name", "murex_logo_ball");

      const img = fixture.debugElement.query(
        By.css("img.mxevolve-icon__custom-svg")
      );
      expect(img.nativeElement.getAttribute("alt")).toBe("");
      expect(img.nativeElement.getAttribute("aria-hidden")).toBe("true");
    });

    it("should apply size class to custom icons", () => {
      setInput(fixture, "name", "murex_logo_ball");
      setInput(fixture, "size", "xl");

      expect(fixture.nativeElement.classList.contains("mxevolve-icon-xl")).toBe(
        true
      );
    });

    it("should switch from material to custom when name changes", () => {
      setInput(fixture, "name", "delete");
      expect(
        fixture.debugElement.query(By.css(".material-symbols-rounded"))
      ).toBeTruthy();

      setInput(fixture, "name", "murex_logo_ball");

      expect(
        fixture.debugElement.query(By.css(".material-symbols-rounded"))
      ).toBeNull();
      const img = fixture.debugElement.query(
        By.css("img.mxevolve-icon__custom-svg")
      );
      expect(img).toBeTruthy();
      expect(img.nativeElement.getAttribute("src")).toBe(
        "assets/icons/murex_logo_ball.svg"
      );
    });
  });
});
