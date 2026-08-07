import { configureAxe } from "jest-axe";

/**
 * Shared axe config for ORB-UX-009 accessibility tests.
 * Prefer component-scoped exceptions over disabling broad rule categories.
 */
export const axe = configureAxe({
  rules: {
    // Radix Dialog portals can trip region landmarks in jsdom; dialog role/name are asserted separately.
    region: { enabled: false },
  },
});

export { toHaveNoViolations } from "jest-axe";
