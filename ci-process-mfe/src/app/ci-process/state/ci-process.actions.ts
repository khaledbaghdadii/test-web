import { createAction, props } from "@ngrx/store";

export const updateErrorMessage = createAction(
  "[CI Process] Update Error Message",
  props<{ message: string }>()
);
export const clearErrorMessage = createAction(
  "[CI Process] Clear Error Message"
);
