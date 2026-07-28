import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ThemeService {
  setCorrectModeGlobally() {
    if (this.isDarkMode()) {
      this.setDarkModeGlobally();
    } else {
      this.setLightModeGlobally();
    }
  }

  toggleDarkMode() {
    if (this.isDarkMode()) {
      this.setLightModeGlobally();
    } else {
      this.setDarkModeGlobally();
    }
  }

  isDarkMode(): boolean {
    const preferedColorScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const themeMode = localStorage.getItem("theme-mode");

    if (themeMode) {
      return themeMode === ThemeMode.DARK;
    } else {
      return this.isDarkModePrefered(preferedColorScheme);
    }
  }

  setDarkModeGlobally() {
    const element = document.querySelector("html");
    localStorage.setItem("theme-mode", ThemeMode.DARK);
    element?.classList.add("app-dark");
    document.body.dataset["agThemeMode"] = "dark";
  }

  setLightModeGlobally() {
    const element = document.querySelector("html");
    localStorage.setItem("theme-mode", ThemeMode.LIGHT);
    element?.classList.remove("app-dark");
    document.body.dataset["agThemeMode"] = "light";
  }

  private isDarkModePrefered(mediaQueryList: MediaQueryList): boolean {
    return mediaQueryList.matches;
  }
}

export enum ThemeMode {
  DARK = "Dark",
  LIGHT = "Light",
}
