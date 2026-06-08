import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";
import { AuthModule } from "@mxflow/core/auth";
import { environment, EnvironmentProvider } from "../environments/environment";
import { appReducer } from "./app.reducer";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { ErrorHandlerModule } from "@mxflow/core/error-handler";
import { APP_CONFIG } from "@mxflow/config";
import { AppComponent } from "./app.component";
import { FEATURE_FLAG_CONFIG, FeatureFlagsModule } from "@mxflow/feature-flags";

const routes = [
  {
    path: "ci-process",
    loadChildren: () =>
      import("./ci-process/ci-process.module").then(
        (module) => module.CiProcessModule
      ),
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserModule,
    RouterModule.forRoot(routes),
    AuthModule.forRoot(),
    StoreModule.forRoot({ ciProcessMfe: appReducer }),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      name: "ci-process-mfe",
      maxAge: 50,
      logOnly: environment.production,
      connectInZone: true,
    }),
    ErrorHandlerModule.forRoot(),
    FeatureFlagsModule.forRoot({ gatewayUrl: environment.gatewayUrl }),
  ],
  providers: [
    { provide: APP_CONFIG, useValue: environment },
    { provide: FEATURE_FLAG_CONFIG, useValue: environment },
    EnvironmentProvider,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
