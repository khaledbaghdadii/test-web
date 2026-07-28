import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { AgGridAngular } from "ag-grid-angular";
import type { ColDef } from "ag-grid-enterprise";
import {
  Applicative,
  Environment,
  EnvironmentDatabase,
} from "@mxevolve/domains/environment/data-access";
import { Panel } from "primeng/panel";
import { ApplicationRoleCellRendererComponent } from "./cell-renderers/application-role-cell-renderer.component";
import { MxDbTypesCellRendererComponent } from "./cell-renderers/mx-db-types-cell-renderer.component";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";

interface ApplicationRow {
  hostname: string;
  isPrimary: boolean;
  directory: string;
  portRange: string;
}

@Component({
  selector: "mxevolve-environment-resources-tabs",
  standalone: true,
  imports: [Tabs, TabList, Tab, TabPanels, TabPanel, AgGridAngular, Panel],
  templateUrl: "./environment-resources-tabs.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentResourcesTabsComponent {
  readonly environment = input.required<Environment>();

  readonly applicationRows = computed<ApplicationRow[]>(() => {
    const environment = this.environment();
    const rows: ApplicationRow[] = [];

    if (environment.primaryApplicative) {
      rows.push(this.toApplicationRow(environment.primaryApplicative, true));
    }

    for (const applicative of environment.secondaryApplicatives ?? []) {
      rows.push(this.toApplicationRow(applicative, false));
    }

    return rows;
  });

  readonly databaseRows = computed(() => this.environment().databases ?? []);

  readonly clientRows = computed(() => this.environment().clients ?? []);

  readonly testRows = computed(() => this.environment().tests ?? []);

  readonly bundleRows = computed(() =>
    (this.environment().bundles ?? []).filter(
      (bundle) => bundle.version && bundle.branch
    )
  );

  readonly applicationColumnDefs = signal<ColDef<ApplicationRow>[]>([
    { field: "hostname", headerName: "Hostname", flex: 2 },
    {
      field: "isPrimary",
      headerName: "Role",
      cellRenderer: ApplicationRoleCellRendererComponent,
    },
    { field: "directory", headerName: "Directory", flex: 2 },
    { field: "portRange", headerName: "Port Range", flex: 1 },
  ]);

  readonly databaseColumnDefs = signal<ColDef<EnvironmentDatabase>[]>([
    { field: "name", headerName: "Name", flex: 2 },
    { headerName: "MX DB Types", cellRenderer: MxDbTypesCellRendererComponent },
    {
      headerName: "Hostname",
      flex: 2,
      valueGetter: (p) => p.data?.allocation?.machine?.name ?? "-",
    },
    {
      headerName: "DB Server Name",
      flex: 2,
      valueGetter: (p) => p.data?.allocation?.name ?? "-",
    },
    {
      headerName: "DB Server Port",
      flex: 1,
      valueGetter: (p) => p.data?.allocation?.port ?? "-",
    },
  ]);

  readonly clientColumnDefs = signal<ColDef[]>([
    {
      headerName: "Hostname",
      flex: 2,
      valueGetter: (p) => p.data?.allocation?.machine?.name ?? "-",
    },
    {
      headerName: "Directory",
      flex: 2,
      valueGetter: (p) => p.data?.directory ?? "-",
    },
  ]);

  readonly testColumnDefs = signal<ColDef[]>([
    {
      headerName: "Hostname",
      flex: 2,
      valueGetter: (p) => p.data?.allocation?.machine?.name ?? "-",
    },
    {
      headerName: "Directory",
      flex: 2,
      valueGetter: (p) => p.data?.directory ?? "-",
    },
  ]);

  readonly bundleColumnDefs = signal<ColDef[]>([
    { field: "id", headerName: "ID", flex: 1 },
    { field: "version", headerName: "Version", flex: 1 },
    { field: "branch", headerName: "Branch", flex: 2 },
    { field: "changelist", headerName: "Revision", flex: 1 },
  ]);

  readonly defaultColDef = signal<ColDef>({
    sortable: true,
    resizable: true,
    filter: false,
  });

  private toApplicationRow(
    applicative: Applicative,
    isPrimary: boolean
  ): ApplicationRow {
    const ports = applicative.allocation.ports;

    return {
      hostname: applicative.allocation.machine?.name ?? "-",
      isPrimary,
      directory: applicative.directory ?? "-",
      portRange: ports ? `${ports.start} - ${ports.end}` : "-",
    };
  }

  protected readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  protected readonly loadingOverlayComponent = TableLoadingOverlayComponent;
}
