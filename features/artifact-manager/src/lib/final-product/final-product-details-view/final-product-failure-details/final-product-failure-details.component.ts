import { Component, Input } from "@angular/core";
import { AuthorizationUtilsModule } from "@mxflow/core/auth";

import { FinalProduct } from "../../model/final-product";

@Component({
  selector: "mxevolve-final-product-failure-details-view",
  standalone: true,
  imports: [AuthorizationUtilsModule],
  templateUrl: "./final-product-failure-details.component.html",
})
export class FinalProductFailureDetailsComponent {
  @Input({ required: true }) finalProduct: FinalProduct;
}
