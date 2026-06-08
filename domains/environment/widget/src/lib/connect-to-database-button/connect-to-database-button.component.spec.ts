import { render, screen, waitFor } from "@testing-library/angular";
import { Subject, of, throwError } from "rxjs";
import userEvent from "@testing-library/user-event";
import { ConnectToDatabaseButtonComponent } from "./connect-to-database-button.component";
import {
  DatabaseEditorService,
  EnvironmentDatabase,
} from "@mxevolve/domains/environment/data-access";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";

const mockDatabaseEditorService = {
  fetchEditorUrl: jest.fn(),
};

const MOCK_DATABASES: EnvironmentDatabase[] = [
  { name: "main-db", mxDbTypes: ["financial"] },
];

const REQUIRED_INPUTS = {
  projectId: "proj-001",
  environmentId: "env-001",
  databases: MOCK_DATABASES,
  status: EnvironmentStatus.READY,
  iconOnly: false,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(ConnectToDatabaseButtonComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentProviders: [
      { provide: DatabaseEditorService, useValue: mockDatabaseEditorService },
    ],
  });
}

describe("ConnectToDatabaseButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "open").mockImplementation(() => null);
    mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(
      of("https://editor.example.com")
    );
  });

  describe("button label", () => {
    it("renders with label 'Connect to DB'", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Connect to DB" })
      ).toBeTruthy();
    });
  });

  describe("button disabled state", () => {
    it("is enabled when environment is READY and has databases", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Connect to DB" })
      ).not.toBeDisabled();
    });

    it("is disabled when environment status is not READY", async () => {
      await renderComponent({ status: EnvironmentStatus.BROKEN });

      expect(
        screen.getByRole("button", { name: "Connect to DB" })
      ).toBeDisabled();
    });

    it("is disabled when there are no databases", async () => {
      await renderComponent({ databases: [] });

      expect(
        screen.getByRole("button", { name: "Connect to DB" })
      ).toBeDisabled();
    });
  });

  describe("disabled tooltip", () => {
    it("shows 'No databases available' tooltip when there are no databases", async () => {
      const user = userEvent.setup();
      await renderComponent({ databases: [] });

      await user.hover(screen.getByRole("button", { name: "Connect to DB" }));

      await waitFor(() =>
        expect(screen.getByText("No databases available")).toBeTruthy()
      );
    });

    it("shows 'Environment not ready' tooltip when environment status is not READY", async () => {
      const user = userEvent.setup();
      await renderComponent({ status: EnvironmentStatus.EXECUTING });

      await user.hover(screen.getByRole("button", { name: "Connect to DB" }));

      await waitFor(() =>
        expect(screen.getByText("Environment not ready")).toBeTruthy()
      );
    });
  });

  describe("menu items", () => {
    it("shows mxDbTypes joined with ' | ' as the menu item label", async () => {
      const user = userEvent.setup();
      await renderComponent({
        databases: [{ name: "main-db", mxDbTypes: ["financial", "reporting"] }],
      });

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));

      await waitFor(() =>
        expect(screen.getByText("financial | reporting")).toBeTruthy()
      );
    });

    it("shows the database name as the menu item label when mxDbTypes is empty", async () => {
      const user = userEvent.setup();
      await renderComponent({
        databases: [{ name: "main-db", mxDbTypes: [] }],
      });

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));

      await waitFor(() => expect(screen.getByText("main-db")).toBeTruthy());
    });
  });

  describe("database connection", () => {
    it("opens the database editor URL in a new tab when the connection succeeds", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      await waitFor(() =>
        expect(window.open).toHaveBeenCalledWith(
          "https://editor.example.com",
          "_blank"
        )
      );
    });

    it("emits connectionError when no URL is returned from the service", async () => {
      mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(of(undefined));
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const connectionErrorSpy = jest.fn();
      fixture.componentInstance.connectionError.subscribe(connectionErrorSpy);

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      await waitFor(() =>
        expect(connectionErrorSpy).toHaveBeenCalledWith(
          'No editor URL returned for database "main-db"'
        )
      );
    });

    it("emits connectionError when the service call fails", async () => {
      mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(
        throwError(() => new Error("Network failure"))
      );
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const connectionErrorSpy = jest.fn();
      fixture.componentInstance.connectionError.subscribe(connectionErrorSpy);

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      await waitFor(() =>
        expect(connectionErrorSpy).toHaveBeenCalledWith(
          'Failed to connect to database "main-db"'
        )
      );
    });

    it("shows a loading indicator while the connection is in progress", async () => {
      const editorSubject = new Subject<string>();
      mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(editorSubject);
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Connect to DB" })
        ).toBeDisabled()
      );
    });

    it("clears the loading indicator after the connection completes successfully", async () => {
      const editorSubject = new Subject<string>();
      mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(editorSubject);
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      editorSubject.next("https://editor.example.com");
      editorSubject.complete();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Connect to DB" })
        ).not.toBeDisabled()
      );
    });

    it("clears the loading indicator after the connection fails", async () => {
      const editorSubject = new Subject<string>();
      mockDatabaseEditorService.fetchEditorUrl.mockReturnValue(editorSubject);
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Connect to DB" }));
      await user.click(await screen.findByText("financial"));

      editorSubject.error(new Error("Network failure"));

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Connect to DB" })
        ).not.toBeDisabled()
      );
    });
  });

  describe("iconOnly mode", () => {
    it("renders a labeled button when iconOnly is false", async () => {
      await renderComponent();

      expect(
        screen.getByRole("button", { name: "Connect to DB" })
      ).toBeTruthy();
    });

    it("does not show visible button text in icon-only mode", async () => {
      await renderComponent({ iconOnly: true });

      expect(screen.queryByText("Connect to DB")).toBeNull();
    });

    it("shows 'Connect to DB' tooltip on hover in icon-only mode", async () => {
      const user = userEvent.setup();
      await renderComponent({ iconOnly: true });

      await user.hover(screen.getByRole("button", { name: "Connect to DB" }));

      await waitFor(() => {
        expect(screen.getByText("Connect to DB")).toBeInTheDocument();
      });
    });
  });
});
