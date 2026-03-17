import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_ROOT = path.join(process.cwd(), "content", "israel_lab");
const DATA_ROOT = path.join(process.cwd(), "data", "israel");

export type ReliabilityStatus = "official_source" | "derived_from_source" | "illustrative_assumption" | string;

export interface TriggerLadderTier {
  tier: string;
  payout_percent: number;
  condition_summary: string;
}

export interface TriggerScenario {
  id: string;
  title: string;
  short_label: string;
  zone_id: string;
  zone_name: string;
  magnitude_threshold_mw: number;
  depth_max_km: number;
  secondary_condition: string;
  trigger_logic_summary: string;
  payout_ladder: TriggerLadderTier[];
  use_case: string;
  data_status: ReliabilityStatus;
  source_name: string;
  source_note: string;
}

export interface TriggerZone {
  id: string;
  title: string;
  description: string;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface SeismicSource {
  source_name: string;
  source_type: string;
  usage: string;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface PayoutCalculatorConfig {
  enabled: boolean;
  section_title: string;
  section_subtitle: string;
  description: string;
  supported_modes: string[];
  default_mode: string;
  comparison_settings: {
    enabled: boolean;
    max_scenarios: number;
    comparison_title: string;
  };
}

export interface TriggerLabConfig {
  enabled: boolean;
  section_title: string;
  section_subtitle: string;
  description: string;
  ui_mode: {
    default_mode: "single" | "compare";
    available_modes: Array<"single" | "compare">;
  };
  comparison_settings: {
    enabled: boolean;
    max_scenarios: number;
    comparison_label: string;
  };
}

export interface CalculatorDefaults {
  default_trigger_scenario_id: string;
  default_bond_size_usd: number;
  default_expected_loss_percent: number;
  default_market_multiple: number;
  default_risk_free_rate_percent: number;
  default_tenor_years: number;
  default_issuance_cost_percent: number;
  default_peril_type: string;
  default_trigger_type: string;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface CalculatorScenarioInput {
  id: string;
  scenario_name: string;
  trigger_scenario_id: string;
  bond_size_usd: number;
  expected_loss_percent: number;
  market_multiple: number;
  risk_free_rate_percent: number;
  tenor_years: number;
  issuance_cost_percent: number;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface CalculatorMethodology {
  formulas: Array<{
    id: string;
    label: string;
    expression: string;
    data_status: ReliabilityStatus;
    source_note: string;
  }>;
  notes: Array<{
    text: string;
    data_status: ReliabilityStatus;
  }>;
}

export interface BondSizeOption {
  id: string;
  label: string;
  bond_size_usd: number;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface PayoutTierConfig {
  trigger_scenario_id: string;
  tier: string;
  payout_percent: number;
  data_status: ReliabilityStatus;
}

export interface EventInputSchema {
  fields: Array<{
    id: "magnitude" | "epicenter_zone" | "depth_km" | string;
    label: string;
    type: "number" | "select" | string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
  }>;
}

export interface TraditionalComparisonConfig {
  enabled: boolean;
  comparison_title: string;
  comparison_type: string;
  items: Array<{
    pathway: string;
    illustrative_timing: string;
    description: string;
  }>;
  data_status: ReliabilityStatus;
  source_note: string;
}

export interface IsraelLabContentBundle {
  triggerLab: TriggerLabConfig;
  payoutCalculator: PayoutCalculatorConfig;
  triggerScenarios: TriggerScenario[];
  triggerZones: TriggerZone[];
  seismicSources: SeismicSource[];
  calculatorDefaults: CalculatorDefaults;
  scenarioInputs: CalculatorScenarioInput[];
  payoutTiers: PayoutTierConfig[];
  methodology: CalculatorMethodology;
  bondSizeOptions: BondSizeOption[];
  eventInputSchema: EventInputSchema;
  traditionalComparison: TraditionalComparisonConfig;
}

async function readJson<T>(filePath: string): Promise<T> {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as T;
}

function cleanText(value: string): string {
  return value.replace(/ג€™/g, "'").replace(/ֳ—/g, "x");
}

function cleanDeep<T>(value: T): T {
  if (typeof value === "string") return cleanText(value) as T;
  if (Array.isArray(value)) return value.map((item) => cleanDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cleanDeep(item)])
    ) as T;
  }
  return value;
}

export const getIsraelLabContent = cache(async (): Promise<IsraelLabContentBundle> => {
  const [
    triggerLabRaw,
    payoutCalculatorRaw,
    triggerScenariosRaw,
    triggerZonesRaw,
    seismicSourcesRaw,
    calculatorDefaultsRaw,
    scenarioInputsRaw,
    payoutTiersRaw,
    methodologyRaw,
    bondSizeOptionsRaw,
    eventInputSchemaRaw,
    traditionalComparisonRaw
  ] = await Promise.all([
    readJson<TriggerLabConfig>(path.join(CONTENT_ROOT, "trigger_lab.json")),
    readJson<PayoutCalculatorConfig>(path.join(CONTENT_ROOT, "payout_calculator.json")),
    readJson<TriggerScenario[]>(path.join(DATA_ROOT, "triggers", "trigger_scenarios.json")),
    readJson<TriggerZone[]>(path.join(DATA_ROOT, "triggers", "trigger_zones.json")),
    readJson<SeismicSource[]>(path.join(DATA_ROOT, "triggers", "seismic_sources.json")),
    readJson<CalculatorDefaults>(path.join(DATA_ROOT, "calculator", "default_assumptions.json")),
    readJson<CalculatorScenarioInput[]>(path.join(DATA_ROOT, "calculator", "scenario_inputs.json")),
    readJson<PayoutTierConfig[]>(path.join(DATA_ROOT, "calculator", "payout_tiers.json")),
    readJson<CalculatorMethodology>(path.join(DATA_ROOT, "calculator", "methodology.json")),
    readJson<BondSizeOption[]>(path.join(DATA_ROOT, "calculator", "bond_size_options.json")),
    readJson<EventInputSchema>(path.join(DATA_ROOT, "calculator", "event_input_schema.json")),
    readJson<TraditionalComparisonConfig>(path.join(DATA_ROOT, "calculator", "traditional_comparison.json"))
  ]);

  return cleanDeep({
    triggerLab: triggerLabRaw,
    payoutCalculator: payoutCalculatorRaw,
    triggerScenarios: triggerScenariosRaw,
    triggerZones: triggerZonesRaw,
    seismicSources: seismicSourcesRaw,
    calculatorDefaults: calculatorDefaultsRaw,
    scenarioInputs: scenarioInputsRaw,
    payoutTiers: payoutTiersRaw,
    methodology: methodologyRaw,
    bondSizeOptions: bondSizeOptionsRaw,
    eventInputSchema: eventInputSchemaRaw,
    traditionalComparison: traditionalComparisonRaw
  });
});
