import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = path.join(process.cwd(), "data", "calculator_inputs");
const CONTENT_ROOT = path.join(process.cwd(), "content", "methodology_pages");

interface NumericInputConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface CalculatorFormulaInputs {
  principal_usd: NumericInputConfig;
  expected_loss_percent: NumericInputConfig;
  market_multiple: NumericInputConfig;
  risk_free_rate_percent: NumericInputConfig;
  tenor_years: NumericInputConfig;
  issuance_costs_percent: NumericInputConfig;
  traditional_insurance_rate_percent: NumericInputConfig;
  trigger_types: string[];
  peril_types: string[];
}

export interface CalculatorScenario {
  id: string;
  label: string;
  description: string;
  principal_usd: number;
  expected_loss_percent: number;
  market_multiple: number;
  risk_free_rate_percent: number;
  tenor_years: number;
  issuance_costs_percent: number;
  traditional_insurance_rate_percent: number;
  trigger_type: string;
  peril_type: string;
}

export interface MarketMultipleAssumptions {
  title: string;
  notes: string[];
  bands: Array<{
    label: string;
    range: string;
    description: string;
  }>;
}

export interface ExpectedLossReference {
  title: string;
  entries: Array<{
    label: string;
    expected_loss_percent: number;
    typical_use: string;
  }>;
}

export interface CalculatorMethodology {
  title: string;
  overview: string;
  formulas: Array<{
    label: string;
    expression: string;
  }>;
  assumptions: string[];
  limitations: string[];
  sovereign_policy_mode: {
    title: string;
    points: string[];
  };
  disclaimer: string;
}

export interface CalculatorContentBundle {
  formulaInputs: CalculatorFormulaInputs;
  defaultScenarios: CalculatorScenario[];
  marketMultipleAssumptions: MarketMultipleAssumptions;
  expectedLossReferenceValues: ExpectedLossReference;
  methodology: CalculatorMethodology;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export const getCalculatorContent = cache(async (): Promise<CalculatorContentBundle> => {
  const [formulaInputs, defaultScenarios, marketMultipleAssumptions, expectedLossReferenceValues, methodology] =
    await Promise.all([
      readJsonFile<CalculatorFormulaInputs>(path.join(DATA_ROOT, "formula_inputs.json"), {
        principal_usd: { label: "Deal Size (USD)", min: 50_000_000, max: 2_000_000_000, step: 10_000_000, default: 300_000_000 },
        expected_loss_percent: { label: "Expected Loss (%)", min: 0.1, max: 12, step: 0.05, default: 2 },
        market_multiple: { label: "Market Multiple", min: 1, max: 8, step: 0.05, default: 3 },
        risk_free_rate_percent: { label: "Risk-Free Rate (%)", min: 0.5, max: 10, step: 0.05, default: 4.2 },
        tenor_years: { label: "Tenor (Years)", min: 1, max: 6, step: 1, default: 3 },
        issuance_costs_percent: { label: "Issuance Costs (%)", min: 0, max: 2.5, step: 0.01, default: 0.5 },
        traditional_insurance_rate_percent: {
          label: "Traditional Insurance / Reinsurance Rate (%)",
          min: 0.5,
          max: 15,
          step: 0.05,
          default: 7
        },
        trigger_types: ["Parametric", "Indemnity", "Modelled Loss", "Industry Loss", "Hybrid"],
        peril_types: ["Earthquake", "Hurricane / Named Storm", "Flood", "Multi-Peril", "Other"]
      }),
      readJsonFile<CalculatorScenario[]>(path.join(DATA_ROOT, "default_scenarios.json"), []),
      readJsonFile<MarketMultipleAssumptions>(path.join(DATA_ROOT, "market_multiple_assumptions.json"), {
        title: "Indicative Market Multiple Reference",
        notes: [],
        bands: []
      }),
      readJsonFile<ExpectedLossReference>(path.join(DATA_ROOT, "expected_loss_reference_values.json"), {
        title: "Expected Loss Benchmarks",
        entries: []
      }),
      readJsonFile<CalculatorMethodology>(path.join(CONTENT_ROOT, "calculator_methodology.json"), {
        title: "Calculator Methodology",
        overview: "",
        formulas: [],
        assumptions: [],
        limitations: [],
        sovereign_policy_mode: { title: "Sovereign Policy Mode", points: [] },
        disclaimer: ""
      })
    ]);

  return {
    formulaInputs,
    defaultScenarios,
    marketMultipleAssumptions,
    expectedLossReferenceValues,
    methodology
  };
});
