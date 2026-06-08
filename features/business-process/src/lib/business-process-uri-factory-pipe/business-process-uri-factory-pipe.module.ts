import { NgModule } from "@angular/core";
import { BusinessProcessUriFactoryPipe } from "./business-process-uri-factory.pipe";
import { BusinessProcessGlobalUriFactoryPipe } from "./business-process-global-uri-factory.pipe";

@NgModule({
  declarations: [
    BusinessProcessUriFactoryPipe,
    BusinessProcessGlobalUriFactoryPipe,
  ],
  exports: [BusinessProcessUriFactoryPipe, BusinessProcessGlobalUriFactoryPipe],
  providers: [
    BusinessProcessUriFactoryPipe,
    BusinessProcessGlobalUriFactoryPipe,
  ],
})
export class BusinessProcessUriFactoryPipeModule {}
