#!/usr/bin/env tsx
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"
import type { BudgetConfig } from "../rules/checker"
import { parseLighthouseReport } from "../parsers/lighthouse"
import { parseBundleReport } from "../parsers/bundle"
import { checkBudgets } from "../rules/checker"
import { printReport } from "../reporters/console"

function loadConfig(configPath: string): BudgetConfig {
  const raw = readFileSync(configPath, "utf-8")
  return JSON.parse(raw) as BudgetConfig
}

function main(): void {
  const args = process.argv.slice(2)

  const configFlag = args.indexOf("--config")
  const configPath = configFlag >= 0 ? args[configFlag + 1] : "budget.config.json"

  const lighthouseFlag = args.indexOf("--lighthouse")
  const lighthousePath = lighthouseFlag >= 0 ? args[lighthouseFlag + 1] : undefined

  const bundleFlag = args.indexOf("--bundle")
  const bundlePath = bundleFlag >= 0 ? args[bundleFlag + 1] : undefined

  if (!configPath || !existsSync(resolve(configPath))) {
    console.error(`Config file not found: ${configPath}`)
    console.error("Usage: fip-budget --config budget.config.json [--lighthouse report.json] [--bundle stats.json]")
    process.exit(1)
  }

  const config = loadConfig(resolve(configPath))

  const lighthouse = lighthousePath && existsSync(resolve(lighthousePath))
    ? parseLighthouseReport(resolve(lighthousePath))
    : null

  const bundle = bundlePath && existsSync(resolve(bundlePath))
    ? parseBundleReport(resolve(bundlePath))
    : null

  const result = checkBudgets(config, lighthouse, bundle)
  printReport(result)

  if (!result.passed) process.exit(1)
}

main()
