import type { CheckResult } from "../rules/checker"

export function printReport(result: CheckResult): void {
  console.log("\n=== FIP Budget Checker ===\n")

  if (result.passed) {
    console.log("✓ All budgets passed.\n")
    return
  }

  console.log(`✗ ${result.failures.length} budget violation(s):\n`)
  for (const f of result.failures) {
    console.log(`  FAIL  ${f.metric}`)
    console.log(`        actual: ${f.actual}  budget: ${f.budget}`)
    console.log(`        ${f.message}\n`)
  }

  if (result.warnings.length > 0) {
    console.log("Warnings:")
    for (const w of result.warnings) {
      console.log(`  WARN  ${w}`)
    }
    console.log()
  }
}
