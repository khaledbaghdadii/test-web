import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { MockComponent } from "ng-mocks";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";
import { MultiPageDialogComponent } from "./multi-page-dialog.component";
import { MultiPageDialogPageDirective } from "./multi-page-dialog-page.directive";

const HOST_TEMPLATE = `
  <mxevolve-multi-page-dialog #dlg (pageChange)="onPageChange($event)">
    <ng-template mxevolveMultiPageDialogPage="page1" title="Page One Title">
      <span>Page one body</span>
    </ng-template>
    <ng-template mxevolveMultiPageDialogPage="page2" title="Page Two Title">
      <span>Page two body</span>
    </ng-template>
  </mxevolve-multi-page-dialog>
  <button type="button" (click)="dlg.open('page1')">do-open</button>
  <button type="button" (click)="dlg.goTo('page2')">do-goto</button>
  <button type="button" (click)="dlg.back()">do-back</button>
  <button type="button" (click)="dlg.close()">do-close</button>
`;

async function renderHost(
  onPageChange: (value: string | undefined) => void = () => {}
) {
  return render(HOST_TEMPLATE, {
    imports: [
      MultiPageDialogComponent,
      MultiPageDialogPageDirective,
      Dialog,
      PrimeTemplate,
      MockComponent(MxevolveIconComponent),
    ],
    providers: [provideNoopAnimations()],
    componentProperties: { onPageChange },
  });
}

describe("MultiPageDialogComponent", () => {
  it("opens at the first page and renders its projected content", async () => {
    await renderHost();

    await userEvent.click(screen.getByText("do-open"));

    await waitFor(() => {
      expect(screen.getByText("Page one body")).toBeTruthy();
      expect(screen.queryByText("Page two body")).toBeNull();
    });
  });

  it("does not allow the backdrop to dismiss the dialog", async () => {
    const { fixture } = await renderHost();

    await userEvent.click(screen.getByText("do-open"));

    expect(
      fixture.debugElement.query(By.directive(Dialog)).componentInstance
        .dismissableMask
    ).toBe(false);

    const backdrop = document.querySelector(".p-dialog-mask");

    await userEvent.click(backdrop!);

    await waitFor(() => expect(screen.getByText("Page one body")).toBeTruthy());
  });

  it("does not show a back button on the first page", async () => {
    await renderHost();

    await userEvent.click(screen.getByText("do-open"));

    await waitFor(() => expect(screen.getByText("Page one body")).toBeTruthy());
    expect(screen.queryByLabelText("Back")).toBeNull();
  });

  it("navigates forward to the second page and shows a back button", async () => {
    await renderHost();

    await userEvent.click(screen.getByText("do-open"));
    await userEvent.click(screen.getByText("do-goto"));

    await waitFor(() => {
      expect(screen.getByText("Page two body")).toBeTruthy();
      expect(screen.queryByText("Page one body")).toBeNull();
      expect(screen.getByLabelText("Back")).toBeTruthy();
    });
  });

  it("returns to the previous page when back is pressed", async () => {
    await renderHost();

    await userEvent.click(screen.getByText("do-open"));
    await userEvent.click(screen.getByText("do-goto"));
    await waitFor(() => expect(screen.getByText("Page two body")).toBeTruthy());

    await userEvent.click(screen.getByText("do-back"));

    await waitFor(() => {
      expect(screen.getByText("Page one body")).toBeTruthy();
      expect(screen.queryByText("Page two body")).toBeNull();
      expect(screen.queryByLabelText("Back")).toBeNull();
    });
  });

  it("closes the dialog and clears the projected content", async () => {
    await renderHost();

    await userEvent.click(screen.getByText("do-open"));
    await waitFor(() => expect(screen.getByText("Page one body")).toBeTruthy());

    await userEvent.click(screen.getByText("do-close"));

    await waitFor(() => expect(screen.queryByText("Page one body")).toBeNull());
  });

  it("emits the active page id on open, forward navigation, and undefined on close", async () => {
    const pageEvents: (string | undefined)[] = [];
    await renderHost((value) => pageEvents.push(value));

    await userEvent.click(screen.getByText("do-open"));
    await userEvent.click(screen.getByText("do-goto"));
    await userEvent.click(screen.getByText("do-close"));

    await waitFor(() =>
      expect(pageEvents).toEqual(["page1", "page2", undefined])
    );
  });

  it("emits the previous page id when navigating back", async () => {
    const pageEvents: (string | undefined)[] = [];
    await renderHost((value) => pageEvents.push(value));

    await userEvent.click(screen.getByText("do-open"));
    await userEvent.click(screen.getByText("do-goto"));
    await userEvent.click(screen.getByText("do-back"));

    await waitFor(() =>
      expect(pageEvents).toEqual(["page1", "page2", "page1"])
    );
  });
});
