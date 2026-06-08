import { Component, Input } from "@angular/core";
import { FinalProductSyncDetailsViewComponent } from "./final-product-sync-details-view/final-product-sync-details-view.component";
import { FinalProduct } from "../model/final-product";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { CopyableModule } from "@mxflow/directive";
import { TabsModule } from "primeng/tabs";
import { AuthorizationUtilsModule } from "@mxflow/core/auth";
import { FinalProductFailureDetailsComponent } from "./final-product-failure-details/final-product-failure-details.component";

@Component({
  selector: "mxevolve-final-product-details-view",
  standalone: true,
  imports: [
    FinalProductSyncDetailsViewComponent,
    CardContainerModule,
    HeaderTitleModule,
    CopyableModule,
    AuthorizationUtilsModule,
    TabsModule,
    FinalProductFailureDetailsComponent,
  ],
  templateUrl: "./final-product-details-view.component.html",
})
export class FinalProductDetailsViewComponent {
  @Input({ required: true }) finalProduct: FinalProduct;

  get hasSyncRequests(): boolean {
    return this.finalProduct.syncRequests?.length > 0;
  }

  get isFailed(): boolean {
    return this.finalProduct.state?.toUpperCase() === "FAILED";
  }
}
