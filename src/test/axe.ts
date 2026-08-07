import { configureAxe } from "jest-axe";

/**
 * Shared axe runner for ORB-UX-009 accessibility tests.
 * Keep default rules enabled. Scope any false-positive exceptions to
 * individual tests with an explicit comment — never disable rules here.
 */
export const axe = configureAxe({});

export { toHaveNoViolations } from "jest-axe";
