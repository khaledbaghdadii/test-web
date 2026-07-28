import { TestBed } from "@angular/core/testing";
import { ThemeService, ThemeMode } from "./theme.service";

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.querySelector("html")?.classList.remove("app-dark");
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should set dark mode globally", () => {
    service.setDarkModeGlobally();
    expect(localStorage.getItem("theme-mode")).toBe(ThemeMode.DARK);
    expect(document.querySelector("html")?.classList.contains("app-dark")).toBe(
      true
    );
    expect(document.body.dataset["agThemeMode"]).toBe("dark");
  });

  it("should set light mode globally", () => {
    service.setLightModeGlobally();
    expect(localStorage.getItem("theme-mode")).toBe(ThemeMode.LIGHT);
    expect(document.querySelector("html")?.classList.contains("app-dark")).toBe(
      false
    );
    expect(document.body.dataset["agThemeMode"]).toBe("light");
  });

  it("should toggle dark mode to light mode", () => {
    localStorage.setItem("theme-mode", ThemeMode.DARK);
    service.toggleDarkMode();
    expect(localStorage.getItem("theme-mode")).toBe(ThemeMode.LIGHT);
    expect(document.querySelector("html")?.classList.contains("app-dark")).toBe(
      false
    );
  });

  it("should toggle light mode to dark mode", () => {
    localStorage.setItem("theme-mode", ThemeMode.LIGHT);
    service.toggleDarkMode();
    expect(localStorage.getItem("theme-mode")).toBe(ThemeMode.DARK);
    expect(document.querySelector("html")?.classList.contains("app-dark")).toBe(
      true
    );
  });

  it("should return true if dark mode is preferred", () => {
    jest.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as any);
    expect(service.isDarkMode()).toBe(true);
  });

  it("should return false if light mode is preferred", () => {
    jest.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as any);
    expect(service.isDarkMode()).toBe(false);
  });
});
