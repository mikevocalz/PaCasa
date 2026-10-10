/** A resource lease, not UI state. Invalidated when consent or screen ownership changes. */
export function createTurnLease() {
  let generation = 0;
  let locked = false;
  return {
    begin(): number | null {
      if (locked) return null;
      locked = true;
      return ++generation;
    },
    current(token: number): boolean { return token === generation; },
    release(token: number): void { if (token === generation) locked = false; },
    invalidate(): void { generation += 1; locked = false; },
  };
}
