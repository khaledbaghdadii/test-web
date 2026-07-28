import { Component } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { render, screen, within } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MenuItem } from "primeng/api";
import { ProjectNavSidebarComponent } from "./project-nav-sidebar.component";

@Component({ template: "", standalone: true })
class BlankComponent {}

const FLAT_ITEMS: MenuItem[] = [
  { label: "Merge Request", routerLink: ["scm/merge-request-reporting"] },
  { label: "Final Products", routerLink: ["artifact-management"] },
  { label: "Env Deployment", routerLink: ["environment/all-deployments"] },
];

const EXPANDABLE_ITEMS: MenuItem[] = [
  { label: "Process Template", routerLink: ["business-process/definition"] },
  {
    label: "Environments",
    items: [
      { label: "Definitions", routerLink: ["environment/definitions"] },
      { label: "Pools", routerLink: ["environment/pools"] },
    ],
  },
];

async function renderSidebar(items: MenuItem[]) {
  return render(ProjectNavSidebarComponent, {
    inputs: { items },
    providers: [provideRouter([{ path: "**", component: BlankComponent }])],
  });
}

describe("ProjectNavSidebarComponent", () => {
  it("renders a leaf link for each flat item", async () => {
    await renderSidebar(FLAT_ITEMS);

    expect(screen.getByRole("link", { name: "Merge Request" })).toBeTruthy();
  });

  it("sets the router link on a leaf item", async () => {
    await renderSidebar(FLAT_ITEMS);

    const link = screen.getByRole("link", { name: "Final Products" });

    expect(link.getAttribute("href")).toContain("artifact-management");
  });

  it("renders an expandable section as a button", async () => {
    await renderSidebar(EXPANDABLE_ITEMS);

    expect(screen.getByRole("button", { name: /Environments/ })).toBeTruthy();
  });

  it("expands sections by default", async () => {
    await renderSidebar(EXPANDABLE_ITEMS);

    expect(
      screen
        .getByRole("button", { name: /Environments/ })
        .getAttribute("aria-expanded")
    ).toBe("true");
  });

  it("renders the children of an expanded section", async () => {
    await renderSidebar(EXPANDABLE_ITEMS);

    expect(screen.getByRole("link", { name: "Definitions" })).toBeTruthy();
  });

  it("hides the children when a section is collapsed", async () => {
    const user = userEvent.setup();
    await renderSidebar(EXPANDABLE_ITEMS);

    await user.click(screen.getByRole("button", { name: /Environments/ }));

    expect(screen.queryByRole("link", { name: "Definitions" })).toBeNull();
  });

  it("marks a collapsed section as not expanded", async () => {
    const user = userEvent.setup();
    await renderSidebar(EXPANDABLE_ITEMS);

    await user.click(screen.getByRole("button", { name: /Environments/ }));

    expect(
      screen
        .getByRole("button", { name: /Environments/ })
        .getAttribute("aria-expanded")
    ).toBe("false");
  });

  it("renders flat items alongside expandable sections", async () => {
    await renderSidebar(EXPANDABLE_ITEMS);

    expect(screen.getByRole("link", { name: "Process Template" })).toBeTruthy();
  });

  it("renders nested children inside the expandable section group", async () => {
    await renderSidebar(EXPANDABLE_ITEMS);

    const sectionButton = screen.getByRole("button", { name: /Environments/ });
    const group = sectionButton.nextElementSibling as HTMLElement;

    expect(within(group).getByRole("link", { name: "Pools" })).toBeTruthy();
  });

  it("does not highlight an expanded section when none of its children are active", async () => {
    const { fixture } = await renderSidebar(EXPANDABLE_ITEMS);
    await TestBed.inject(Router).navigate(["/business-process/definition"]);
    fixture.detectChanges();

    expect(
      screen
        .getByRole("button", { name: /Environments/ })
        .classList.contains("mxevolve-project-nav-sidebar__item--active")
    ).toBe(false);
  });

  it("highlights a section when one of its children is the active route", async () => {
    const { fixture } = await renderSidebar(EXPANDABLE_ITEMS);
    await TestBed.inject(Router).navigate(["/environment/definitions"]);
    fixture.detectChanges();

    expect(
      screen
        .getByRole("button", { name: /Environments/ })
        .classList.contains("mxevolve-project-nav-sidebar__item--active")
    ).toBe(true);
  });

  it("does not highlight an exact-match leaf when a sub-path is the active route", async () => {
    const items: MenuItem[] = [
      {
        label: "Details",
        routerLink: ["project"],
        routerLinkActiveOptions: { exact: true },
      },
      { label: "MXtools", routerLink: ["project/mx-tools"] },
    ];
    const { fixture } = await renderSidebar(items);
    await TestBed.inject(Router).navigate(["/project/mx-tools"]);
    fixture.detectChanges();

    expect(
      screen
        .getByRole("link", { name: "Details" })
        .classList.contains("mxevolve-project-nav-sidebar__item--active")
    ).toBe(false);
  });

  it("highlights an exact-match leaf when its exact route is active", async () => {
    const items: MenuItem[] = [
      {
        label: "Details",
        routerLink: ["project"],
        routerLinkActiveOptions: { exact: true },
      },
      { label: "MXtools", routerLink: ["project/mx-tools"] },
    ];
    const { fixture } = await renderSidebar(items);
    await TestBed.inject(Router).navigate(["/project"]);
    fixture.detectChanges();

    expect(
      screen
        .getByRole("link", { name: "Details" })
        .classList.contains("mxevolve-project-nav-sidebar__item--active")
    ).toBe(true);
  });
});
