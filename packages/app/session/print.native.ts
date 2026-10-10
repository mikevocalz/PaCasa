/** Native has no print pipeline in this build; the screen offers the summary instead. */
export const canPrint = (): boolean => false;

export function printDocument(): void {
  // No print target on this platform.
}