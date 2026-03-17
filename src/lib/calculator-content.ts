import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

export interface NumericInputConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
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

export interface CalculatorContentBundle {
  formulaInputs: {
    principal_usd: NumericInputConfig;
    expected_loss_percent: NumericInputConfig;
    market_multiple: NumericInputConfig;
    risk_free_rate_percent: NumericInputConfig;
    tenor_years: NumericInputConfig;
    issuance_costs_percent: NumericInputConfig;
    traditional_insurance_rate_percent: NumericInputConfig;
    trigger_types: string[];
    peril_types: string[];
  };
  defaultScenarios: CalculatorScenario[];
  marketMultipleAssumptions: {
    title: string;
    bands: Array<{ label: string; range: string; description: string }>;
    notes: string[];
  };
  expectedLossReferenceValues: {
    title: string;
    entries: Array<{ label: string; expected_loss_percent: number; typical_use: string }>;
  };
  methodology: {
    title: string;
    overview: string;
    formulas: Array<{ label: string; expression: string }>;
    assumptions: string[];
    limitations: string[];
    sovereign_policy_mode: {
      title: string;
      points: string[];
    };
    disclaimer: string;
  };
}

const ROOT = process.cwd();
const PATHS = {
  formulaInputs: path.join(ROOT, "data", "calculator_inputs", "formula_inputs.json"),
  defaultScenarios: path.join(ROOT, "data", "calculator_inputs", "default_scenarios.json"),
  marketMultiples: path.join(ROOT, "data", "calculator_inputs", "market_multiple_assumptions.json"),
  expectedLossRefs: path.join(ROOT, "data", "calculator_inputs", "expected_loss_reference_values.json"),
  methodology: path.join(ROOT, "content", "methodology_pages", "calculator_methodology.json")
};

const FALLBACK: CalculatorContentBundle = {
  formulaInputs: {
    principal_usd: { label: "Deal Size (USD)", min: 25_000_000, max: 2_000_000_000, step: 5_000_000, default: 250_000_000 },
    expected_loss_percent: { label: "Expected Loss (%)", min: 0.1, max: 15, step: 0.1, default: 2 },
    market_multiple: { label: "Market Multiple", min: 1, max: 8, step: 0.1, default: 3 },
    risk_free_rate_percent: { label: "Risk-Free Rate (%)", min: 0, max: 10, step: 0.05, default: 4 },
    tenor_years: { label: "Tenor (Years)", min: 1, max: 6, step: 1, default: 3 },
    issuance_costs_percent: { label: "Issuance Costs (%)", min: 0, max: 2, step: 0.05, default: 0.4 },
    traditional_insurance_rate_percent: {
      label: "Traditional Insurance / Reinsurance Rate (%)",
      min: 0.5,
      max: 15,
      step: 0.1,
      default: 6
    },
    trigger_types: ["Parametric", "Indemnity", "Modelled Loss", "Industry Loss", "Hybrid"],
    peril_types: ["Earthquake", "Hurricane / Wind", "Flood", "Multi-Peril", "Other"]
  },
  defaultScenarios: [
    {
      id: "conservative",
      label: "Conservative",
      description: "Lower EL, tighter risk assumptions, budget-protective structuring.",
      principal_usd: 300_000_000,
      expected_loss_percent: 1.1,
      market_multiple: 2.8,
      risk_free_rate_percent: 4.0,
      tenor_years: 3,
      issuance_costs_percent: 0.35,
      traditional_insurance_rate_percent: 4.8,
      trigger_type: "Parametric",
      peril_type: "Earthquake"
    },
    {
      id: "base_case",
      label: "Base Case",
      description: "Balanced sovereign transfer profile for fiscal resilience planning.",
      principal_usd: 350_000_000,
      expected_loss_percent: 1.8,
      market_multiple: 3.2,
      risk_free_rate_percent: 4.1,
      tenor_years: 3,
      issuance_costs_percent: 0.4,
      traditional_insurance_rate_percent: 5.6,
      trigger_type: "Parametric",
      peril_type: "Earthquake"
    },
    {
      id: "aggressive",
      label: "Aggressive",
      description: "Higher EL / wider spread profile for deeper protection layers.",
      principal_usd: 450_000_000,
      expected_loss_percent: 3.2,
      market_multiple: 3.8,
      risk_free_rate_percent: 4.2,
      tenor_years: 4,
      issuance_costs_percent: 0.5,
      traditional_insurance_rate_percent: 7.2,
      trigger_type: "Parametric",
      peril_type: "Multi-Peril"
    }
  ],
  marketMultipleAssumptions: {
    title: "Market Multiple Assumptions",
    bands: [
      { label: "Low", range: "1.8x - 2.8x", description: "Typical for lower volatility risk layers and favorable cycles." },
      { label: "Medium", range: "2.8x - 3.8x", description: "Common range in balanced catastrophe bond pricing contexts." },
      { label: "High", range: "3.8x - 6.0x", description: "Observed when uncertainty, volatility, or basis-risk concerns are elevated." }
    ],
    notes: [
      "Multiples are indicative and depend on market cycle, peril mix, and structure quality.",
      "Scenario outputs are illustrative for policy and structuring discussion only."
    ]
  },
  expectedLossReferenceValues: {
    title: "Expected Loss Reference Values",
    entries: [
      { label: "1-in-250 Style Layer", expected_loss_percent: 0.8, typical_use: "Budget shock insulation for severe but rarer events." },
      { label: "1-in-100 Style Layer", expected_loss_percent: 1.8, typical_use: "Balanced sovereign transfer layer." },
      { label: "1-in-50 Style Layer", expected_loss_percent: 3.5, typical_use: "Higher-frequency liquidity layer with larger premium burden." }
    ]
  },
  methodology: {
    title: "Methodology and Logic",
    overview:
      "This module applies a simplified catastrophe bond pricing framework for sovereign policy discussion and scenario analysis.",
    formulas: [
      { label: "Estimated Spread", expression: "Spread (%) = Expected Loss (%) x Market Multiple + Issuance Costs (%)" },
      { label: "Estimated Coupon", expression: "Coupon (%) = Spread (%) + Risk-Free Rate (%)" },
      { label: "Annual Premium", expression: "Annual Premium = Coupon (%) x Principal" },
      { label: "Total Cost over Term", expression: "Total Cost = Annual Premium x Tenor (years)" }
    ],
    assumptions: [
      "Expected loss and market multiple are user assumptions.",
      "Outputs represent indicative structuring analytics, not executable quotes.",
      "Risk-free rate is an input proxy for prevailing benchmark conditions."
    ],
    limitations: [
      "Model does not price secondary-market liquidity effects.",
      "Basis-risk and trigger calibration effects are simplified.",
      "Results should be supplemented by actuarial modeling and investor sounding."
    ],
    sovereign_policy_mode: {
      title: "Sovereign Policy Mode",
      points: [
        "Ex-ante liquidity can reduce fiscal disruption versus post-disaster budget reallocation.",
        "Parametric triggers can accelerate disbursement before full loss adjustment is complete.",
        "Cost diagnostics support medium-term fiscal planning and debt-management integration."
      ]
    },
    disclaimer: "This is an illustrative model, not market pricing."
  }
};

export const getCalculatorContent = cache(async (): Promise<CalculatorContentBundle> => {
  const [formulaInputs, defaultScenarios, marketMultipleAssumptions, expectedLossReferenceValues, methodology] =
    await Promise.all([
      readJson(PATHS.formulaInputs, FALLBACK.formulaInputs),
      readJson(PATHS.defaultScenarios, FALLBACK.defaultScenarios),
      readJson(PATHS.marketMultiples, FALLBACK.marketMultipleAssumptions),
      readJson(PATHS.expectedLossRefs, FALLBACK.expectedLossReferenceValues),
      readJson(PATHS.methodology, FALLBACK.methodology)
    ]);

  return {
    formulaInputs,
    defaultScenarios,
    marketMultipleAssumptions,
    expectedLossReferenceValues,
    methodology
  };
});

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
