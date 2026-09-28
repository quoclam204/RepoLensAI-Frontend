/**
 * Minimal async-state foundation for feature hooks/components.
 * Covers loading / success / error without prescribing UX.
 */
export type AsyncState<T> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

export const idleState = <T>(): AsyncState<T> => ({ status: "idle" });
export const loadingState = <T>(data?: T): AsyncState<T> => ({ status: "loading", data });
export const successState = <T>(data: T): AsyncState<T> => ({ status: "success", data });
export const errorState = <T>(error: Error): AsyncState<T> => ({ status: "error", error });
