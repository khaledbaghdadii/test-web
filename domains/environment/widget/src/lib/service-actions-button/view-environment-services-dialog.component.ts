import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { DialogModule } from "primeng/dialog";
import { AgGridAngular } from "ag-grid-angular";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ColDef, ValueFormatterParams } from "ag-grid-enterprise";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  ServiceActionsService,
  EnvironmentServiceItem,
} from "@mxevolve/domains/environment/data-access";
import {
  TableLoadingOverlayComponent,
  TableNoRowsOverlayComponent,
} from "@mxevolve/shared/ui/table";

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: "mxevolve-view-environment-services-dialog",
  standalone: true,
  imports: [DialogModule, AgGridAngular],
  providers: [ServiceActionsService],
  templateUrl: "./view-environment-services-dialog.component.html",
})
export class ViewEnvironmentServicesDialogComponent {
  readonly projectId = input.required<string>();
  readonly environmentId = input.required<string>();
  readonly visible = model<boolean>(false);

  private readonly serviceActionsService = inject(ServiceActionsService);
  private readonly toastService = inject(ToastMessageService);

  readonly noRowsOverlayComponent = TableNoRowsOverlayComponent;
  readonly noRowsOverlayComponentParams = { message: "No services found" };
  readonly loadingOverlayComponent = TableLoadingOverlayComponent;

  readonly defaultColumnDefinition: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  };

  readonly columnDefinitions: ColDef<EnvironmentServiceItem>[] = [
    {
      field: "name",
      headerName: "Code",
      valueFormatter: (params: ValueFormatterParams<EnvironmentServiceItem>) =>
        params.value || "-",
    },
    {
      field: "nickname",
      headerName: "NickName",
      valueFormatter: (params: ValueFormatterParams<EnvironmentServiceItem>) =>
        params.value || "-",
    },
    {
      field: "installationCode",
      headerName: "Installation Code",
      valueFormatter: (params: ValueFormatterParams<EnvironmentServiceItem>) =>
        params.value || "-",
    },
    {
      field: "description",
      headerName: "Description",
      valueFormatter: (params: ValueFormatterParams<EnvironmentServiceItem>) =>
        params.value || "-",
    },
    {
      field: "status",
      headerName: "Status",
      valueFormatter: (params: ValueFormatterParams<EnvironmentServiceItem>) =>
        params.value || "-",
    },
  ];

  readonly servicesResource = rxResource<
    EnvironmentServiceItem[],
    { projectId: string; environmentId: string; visible: boolean }
  >({
    params: () => ({
      projectId: this.projectId(),
      environmentId: this.environmentId(),
      visible: this.visible(),
    }),
    stream: ({ params }) => {
      if (!params.visible) return of([]);
      return this.serviceActionsService.fetchEnvironmentServices(
        params.projectId,
        params.environmentId
      );
    },
  });

  readonly services = computed(() =>
    this.servicesResource.hasValue() ? this.servicesResource.value() : []
  );

  constructor() {
    effect(() => {
      const status = this.servicesResource.status();
      if (status === "error") {
        const error = this.servicesResource.error();
        this.toastService.showError(
          error?.message ?? "Unknown error",
          "Failed to load environment services"
        );
        this.visible.set(false);
      }
    });
  }
}
