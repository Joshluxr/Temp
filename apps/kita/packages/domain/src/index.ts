/**
 * @kita/domain public surface (T-PLAT-01 stub).
 * Types + pure helpers only. See README.md for scope guards: no money-moving
 * logic until T-CORE-02/T-LEDGER-02 after the T-CONTRACT-01 contracts freeze.
 * Provider adapters below are DISABLED gates that throw — never mocks, never
 * journal writers; outcome manufacturing is forbidden (see providers/README).
 */
export * from './money.ts';
export * from './enums.ts';
export * from './providers/index.ts';
