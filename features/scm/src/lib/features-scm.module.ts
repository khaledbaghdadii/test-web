import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScmService } from "./scm.service";
import { RepositoryDirectoryPickerComponent } from "./repository-directory-picker-component/repository-directory-picker.component";
import { ToastModule } from "primeng/toast";
import { RepositoryDirectoryTreeComponent } from "./repository-directory-picker-component/repository-directory-tree/repository-directory-tree.component";
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
  DynamicDialogModule,
} from "primeng/dynamicdialog";
import { TreeModule } from "primeng/tree";
import { ButtonModule } from "primeng/button";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { NotificationService } from "@mxflow/ui/alert";
import { ScmManagementService } from "./scm-management.service";

@NgModule({
  imports: [
    CommonModule,
    ToastModule,
    DynamicDialogModule,
    TreeModule,
    ButtonModule,
    MxflowSpinnerModule,
  ],
  exports: [RepositoryDirectoryPickerComponent],
  declarations: [
    RepositoryDirectoryPickerComponent,
    RepositoryDirectoryTreeComponent,
  ],
  providers: [
    ScmService,
    DialogService,
    DynamicDialogRef,
    DynamicDialogConfig,
    NotificationService,
    ScmManagementService,
  ],
})
export class FeaturesScmModule {}
