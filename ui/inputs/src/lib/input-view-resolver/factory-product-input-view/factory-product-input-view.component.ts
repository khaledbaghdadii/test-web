import { Component, Input } from "@angular/core";

import { InputField } from "../../input-field/input-field";

@Component({
  selector: "mxevolve-factory-product-input-view",
  imports: [],
  templateUrl: "./factory-product-input-view.component.html",
})
export class FactoryProductInputViewComponent {
  @Input()
  input: InputField;
}
