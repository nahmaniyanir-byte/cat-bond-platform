"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  CircleDashed,
  Landmark,
  WalletCards
} from "lucide-react";

import type {
  CalculatorScenarioInput,
  IsraelLabContentBundle,
  ReliabilityStatus,
  TriggerScenario
} from "@/lib/israel-lab-content";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

type LabMode = "single" | "compare";
type BasisRiskLevel = "Low" | "Medium" | "High";

interface IsraelLabCoreProps {
  content: IsraelLabContentBundle;
}

interface EventInputs {
  magnitude: number;
  epicenterZone: string;
  depthKm: number;
}

interface FinancialInputs {
  bondSizeUsd: number;
  expectedLossPercent: number;
  marketMultiple: number;
  riskFreeRatePercent: number;
  tenorYears: number;
  issuanceCostPercent: number;
  triggerType: string;
}

interface SimulationOutput {
  triggerStatus: string;
  payoutPercent: number;
  payoutAmountUsd: number;
  spreadPercent: number;
  couponPercent: number;
  annualPremiumUsd: number;
  totalCostOverTermUsd: number;
  premiumToCoverRatio: number | null;
}

interface BasisRiskAssessment {
  level: BasisRiskLevel;
  score: number;
  drivers: string[];
  explanation: string;
  dataStatus: ReliabilityStatus;
}

const RELIABILITY_STYLES: Record<string, string> = {
  official_source: "border-emerald-300/45 bg-emerald-500/16 text-emerald-100",
  derived_from_source: "border-sky-300/45 bg-sky-500/16 text-sky-100",
  illustrative_assumption: "border-amber-300/45 bg-amber-500/16 text-amber-100"
};

const POLICY_BLOCKS = [
  {
    title: "Earthquake Liquidity Challenge",
    text: "Major seismic shocks can create immediate fiscal pressure before full damage assessment is complete. Front-end liquidity can reduce operational financing friction."
  },
  {
    title: "Post-Disaster Funding Timing",
    text: "Traditional post-disaster funding channels may require administrative and budget cycles that lag urgent response needs."
  },
  {
    title: "Fiscal Resilience Rationale",
    text: "A parametric sovereign structure can convert uncertain ex-post financing pressure into pre-arranged and rule-based contingent liquidity."
  },
  {
    title: "Early Response Window",
    text: "Rapid payout potential is relevant for emergency response, temporary housing, and critical infrastructure stabilization."
  }
] as const;

const INVESTOR_PACKAGES = [
  {
    title: "Hazard Package",
    status: "official_source",
    points: ["Seismic source stack", "Event monitoring references"]
  },
  {
    title: "Trigger Specification",
    status: "illustrative_assumption",
    points: ["Threshold logic", "Zone logic and payout ladder"]
  },
  {
    title: "Structuring Assumptions",
    status: "derived_from_source",
    points: ["Spread/coupon formulas", "Scenario economics"]
  },
  {
    title: "Policy Framework",
    status: "derived_from_source",
    points: ["Use-of-proceeds framing", "Liquidity governance narrative"]
  }
] as const;

const ROADMAP = [
  "Finalize sovereign coverage objective and issuance scope.",
  "Approve event validation and legal trigger protocol.",
  "Integrate fiscal framework and debt strategy treatment.",
  "Prepare investor pre-sounding package."
] as const;

const BLOCKERS = [
  "Final legal trigger text is pending.",
  "Official exposure baseline requires formal alignment.",
  "Budget integration design remains under policy review."
] as const;

const NEXT_ACTIONS = [
  "Set inter-agency sovereign DRF task force.",
  "Commission official trigger calibration work.",
  "Prepare executive financing comparison note."
] as const;

export function IsraelLabCore({ content }: IsraelLabCoreProps) {
  const defaultScenario =
    content.triggerScenarios.find((s) => s.id === content.calculatorDefaults.default_trigger_scenario_id) ??
    content.triggerScenarios[0];
  const maxCompare = Math.max(
    2,
    content.payoutCalculator.comparison_settings.max_scenarios,
    content.triggerLab.comparison_settings.max_scenarios
  );

  const [mode, setMode] = useState<LabMode>(content.triggerLab.ui_mode.default_mode ?? "single");
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenario?.id ?? "");
  const [compareIds, setCompareIds] = useState<string[]>(
    content.triggerScenarios.slice(0, maxCompare).map((s) => s.id)
  );
  const [usePresetInputs, setUsePresetInputs] = useState(true);

  const [financial, setFinancial] = useState<FinancialInputs>({
    bondSizeUsd: content.calculatorDefaults.default_bond_size_usd,
    expectedLossPercent: content.calculatorDefaults.default_expected_loss_percent,
    marketMultiple: content.calculatorDefaults.default_market_multiple,
    riskFreeRatePercent: content.calculatorDefaults.default_risk_free_rate_percent,
    tenorYears: content.calculatorDefaults.default_tenor_years,
    issuanceCostPercent: content.calculatorDefaults.default_issuance_cost_percent,
    triggerType: content.calculatorDefaults.default_trigger_type
  });

  const [eventInputs, setEventInputs] = useState<EventInputs>({
    magnitude: defaultScenario?.magnitude_threshold_mw ?? 6.5,
    epicenterZone: defaultScenario?.zone_name ?? "National Sovereign Trigger Map",
    depthKm: Math.min(defaultScenario?.depth_max_km ?? 25, 25)
  });

  const selectedScenario = useMemo(
    () => content.triggerScenarios.find((s) => s.id === selectedScenarioId) ?? content.triggerScenarios[0],
    [content.triggerScenarios, selectedScenarioId]
  );

  const scenarioPresetMap = useMemo(() => {
    return content.scenarioInputs.reduce<Record<string, CalculatorScenarioInput>>((acc, input) => {
      acc[input.trigger_scenario_id] = input;
      return acc;
    }, {});
  }, [content.scenarioInputs]);

  const singleOutput = useMemo(() => runSimulation(selectedScenario, eventInputs, financial), [selectedScenario, eventInputs, financial]);
  const singleBasisRisk = useMemo(() => estimateBasisRisk(selectedScenario), [selectedScenario]);
  const singleInsights = useMemo(
    () => buildScenarioInsights(selectedScenario, singleOutput, singleBasisRisk),
    [selectedScenario, singleOutput, singleBasisRisk]
  );

  const compareRows = useMemo(() => {
    return content.triggerScenarios
      .filter((scenario) => compareIds.includes(scenario.id))
      .slice(0, maxCompare)
      .map((scenario) => {
        const preset = scenarioPresetMap[scenario.id];
        const scenarioFinancial: FinancialInputs =
          usePresetInputs && preset
            ? {
                bondSizeUsd: preset.bond_size_usd,
                expectedLossPercent: preset.expected_loss_percent,
                marketMultiple: preset.market_multiple,
                riskFreeRatePercent: preset.risk_free_rate_percent,
                tenorYears: preset.tenor_years,
                issuanceCostPercent: preset.issuance_cost_percent,
                triggerType: financial.triggerType
              }
            : financial;
        const output = runSimulation(scenario, eventInputs, scenarioFinancial);
        const basisRisk = estimateBasisRisk(scenario);
        const insights = buildScenarioInsights(scenario, output, basisRisk);
        return { scenario, scenarioFinancial, output, basisRisk, insights, preset };
      });
  }, [compareIds, content.triggerScenarios, eventInputs, financial, maxCompare, scenarioPresetMap, usePresetInputs]);

  const readinessScore = useMemo(() => {
    const official = content.seismicSources.filter((s) => s.data_status === "official_source").length;
    const ratio = content.seismicSources.length ? official / content.seismicSources.length : 0;
    return Math.round(30 + ratio * 50);
  }, [content.seismicSources]);

  const zoneOptions = useMemo(() => {
    const schemaOptions = content.eventInputSchema.fields.find((f) => f.id === "epicenter_zone")?.options ?? [];
    const scenarioOptions = content.triggerScenarios.map((s) => s.zone_name);
    return Array.from(new Set([...schemaOptions, ...scenarioOptions]));
  }, [content.eventInputSchema.fields, content.triggerScenarios]);

  return (
    <div className="space-y-6">
      <section className="lux-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_10%_0%,rgba(34,211,238,0.16),transparent_65%),radial-gradient(680px_340px_at_90%_0%,rgba(14,165,233,0.11),transparent_70%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">ISRAEL LAB</p>
          <h1 className="mt-2 max-w-5xl text-3xl font-semibold text-white md:text-4xl">
            Sovereign Earthquake Cat Bond Policy and Structuring Environment
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
            Interactive policy-grade module for trigger design, liquidity simulation, and executive sovereign financing
            interpretation for Israel.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AnchorChip href="#trigger-lab" label="Trigger Lab" />
            <AnchorChip href="#simulation-engine" label="Simulation Engine" />
            <AnchorChip href="#executive-comparison" label="Executive Comparison" />
            <AnchorChip href="#stakeholder-orientation" label="Stakeholder Orientation" />
            <AnchorChip href="#investor-framing" label="Investor Framing" />
          </div>
        </div>
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Data Reliability Labels</h2>
          <div className="flex flex-wrap gap-2">
            <ReliabilityBadge status="official_source" />
            <ReliabilityBadge status="derived_from_source" />
            <ReliabilityBadge status="illustrative_assumption" />
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          ISRAEL LAB distinguishes official source content, derived calculations, and illustrative assumptions.
        </p>
      </section>

      <section id="trigger-lab" className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/85">{content.triggerLab.section_title}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{content.triggerLab.section_subtitle}</h2>
          </div>
          <div className="inline-flex rounded-lg border border-white/12 bg-slate-900/70 p-1">
            <ModeButton mode={mode} value="single" onSet={setMode} label="Single Scenario" />
            <ModeButton mode={mode} value="compare" onSet={setMode} label="Compare Scenarios" />
          </div>
        </div>

        {mode === "single" ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <article className="rounded-2xl border border-white/12 bg-slate-950/45 p-5">
              <label className="text-xs uppercase tracking-[0.14em] text-slate-300">Trigger Scenario</label>
              <select
                value={selectedScenario.id}
                onChange={(event) => {
                  const next = content.triggerScenarios.find((s) => s.id === event.target.value);
                  if (!next) return;
                  setSelectedScenarioId(next.id);
                  setEventInputs((current) => ({ ...current, epicenterZone: next.zone_name }));
                }}
                className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900/85 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 transition focus:ring-2"
              >
                {content.triggerScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoBox label="Zone" value={selectedScenario.zone_name} />
                <InfoBox label="Magnitude Threshold" value={`Mw ${selectedScenario.magnitude_threshold_mw.toFixed(1)}`} />
                <InfoBox label="Depth Condition" value={`<= ${selectedScenario.depth_max_km} km`} />
                <InfoBox label="Secondary Condition" value={selectedScenario.secondary_condition} />
              </div>

              <div className="mt-4 rounded-xl border border-cyan-300/24 bg-cyan-500/8 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">Trigger Logic</p>
                <p className="mt-1 text-sm text-slate-200">{selectedScenario.trigger_logic_summary}</p>
              </div>

              <div className="mt-4 space-y-2">
                {selectedScenario.payout_ladder.map((tier) => (
                  <div key={`${selectedScenario.id}-${tier.tier}`} className="rounded-lg border border-white/10 bg-slate-900/65 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-100">{tier.tier}</p>
                      <p className="text-sm font-semibold text-cyan-100">{formatPercent(tier.payout_percent)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{tier.condition_summary}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ReliabilityBadge status={selectedScenario.data_status} />
                <span className="text-xs text-slate-400">{selectedScenario.source_name}</span>
              </div>
            </article>

            <div className="space-y-4">
              <article className="rounded-2xl border border-white/12 bg-slate-950/45 p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/85">Scenario Insights Panel</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Executive Interpretation</h3>
                <InsightRow label="Severity Profile" value={singleInsights.severityProfile} />
                <InsightRow label="Fiscal Relevance" value={singleInsights.fiscalRelevance} />
                <InsightRow label="Likely Liquidity Need" value={singleInsights.liquidityNeed} />
                <InsightRow label="Use-of-Funds Narrative" value={singleInsights.useOfFundsNarrative} />
                <InsightRow label="Emergency Financing Implication" value={singleInsights.emergencyResponseFinancing} />
                <div className="mt-2 rounded-md border border-cyan-300/24 bg-cyan-500/8 p-2.5 text-xs text-cyan-100">
                  {singleInsights.policySummary}
                </div>
                <div className="mt-2">
                  <ReliabilityBadge status="derived_from_source" />
                </div>
              </article>

              <article className="rounded-2xl border border-white/12 bg-slate-950/45 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-200/85">Basis Risk Indicator</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Illustrative Basis Risk Screen</h3>
                  </div>
                  <BasisRiskPill level={singleBasisRisk.level} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{singleBasisRisk.explanation}</p>
                <p className="mt-1 text-xs text-slate-400">Score: {singleBasisRisk.score}</p>
                <div className="mt-2 space-y-1.5">
                  {singleBasisRisk.drivers.map((driver) => (
                    <div key={driver} className="rounded-md border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300">
                      {driver}
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <ReliabilityBadge status={singleBasisRisk.dataStatus} />
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/12 bg-slate-950/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-100">Compare up to {maxCompare} scenarios</p>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={usePresetInputs}
                    onChange={(event) => setUsePresetInputs(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-900/80 text-cyan-400 focus:ring-cyan-300/40"
                  />
                  Use preset assumptions
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {content.triggerScenarios.map((scenario) => {
                  const active = compareIds.includes(scenario.id);
                  const blocked = !active && compareIds.length >= maxCompare;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      disabled={blocked}
                      onClick={() => {
                        setCompareIds((current) => {
                          if (current.includes(scenario.id)) return current.filter((id) => id !== scenario.id);
                          if (current.length >= maxCompare) return current;
                          return [...current, scenario.id];
                        });
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
                        active
                          ? "border-cyan-300/55 bg-cyan-500/20 text-cyan-100"
                          : "border-white/12 bg-slate-900/70 text-slate-300 hover:border-cyan-300/35",
                        blocked && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {scenario.short_label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {compareRows.map((row) => (
                <article key={row.scenario.id} className="rounded-2xl border border-white/12 bg-slate-950/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.scenario.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{row.scenario.zone_name}</p>
                    </div>
                    <ReliabilityBadge status={row.scenario.data_status} />
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <CompareLine label="Bond Size" value={formatCurrency(row.scenarioFinancial.bondSizeUsd)} />
                    <CompareLine label="Expected Loss" value={formatPercent(row.scenarioFinancial.expectedLossPercent)} />
                    <CompareLine label="Market Multiple" value={row.scenarioFinancial.marketMultiple.toFixed(2)} />
                    <CompareLine label="Estimated Spread" value={formatPercent(row.output.spreadPercent)} />
                    <CompareLine label="Estimated Coupon" value={formatPercent(row.output.couponPercent)} />
                    <CompareLine label="Annual Premium" value={formatCurrency(row.output.annualPremiumUsd)} />
                    <CompareLine label="Total Cost" value={formatCurrency(row.output.totalCostOverTermUsd)} />
                    <CompareLine label="Payout Amount" value={formatCurrency(row.output.payoutAmountUsd)} />
                    <CompareLine label="Liquidity Injection" value={formatCurrency(row.output.payoutAmountUsd)} />
                    <CompareLine label="Basis Risk" value={row.basisRisk.level} />
                  </div>
                  <div className="mt-3 rounded-md border border-white/10 bg-slate-900/60 p-2 text-xs text-slate-300">
                    {row.insights.policySummary}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="simulation-engine" className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/85">{content.payoutCalculator.section_title}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{content.payoutCalculator.section_subtitle}</h2>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <article className="rounded-2xl border border-white/12 bg-slate-950/45 p-5">
            <h3 className="text-lg font-semibold text-white">Core Input Panel</h3>
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Bond Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {content.bondSizeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFinancial((current) => ({ ...current, bondSizeUsd: option.bond_size_usd }))}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
                      financial.bondSizeUsd === option.bond_size_usd
                        ? "border-cyan-300/55 bg-cyan-500/20 text-cyan-100"
                        : "border-white/12 bg-slate-900/70 text-slate-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <NumberInput
                label="Expected Loss (%)"
                value={financial.expectedLossPercent}
                min={0}
                max={20}
                step={0.1}
                onChange={(value) => setFinancial((current) => ({ ...current, expectedLossPercent: value }))}
              />
              <NumberInput
                label="Market Multiple"
                value={financial.marketMultiple}
                min={1}
                max={8}
                step={0.05}
                onChange={(value) => setFinancial((current) => ({ ...current, marketMultiple: value }))}
              />
              <NumberInput
                label="Risk-Free Rate (%)"
                value={financial.riskFreeRatePercent}
                min={0}
                max={10}
                step={0.05}
                onChange={(value) => setFinancial((current) => ({ ...current, riskFreeRatePercent: value }))}
              />
              <NumberInput
                label="Tenor (Years)"
                value={financial.tenorYears}
                min={1}
                max={7}
                step={1}
                onChange={(value) => setFinancial((current) => ({ ...current, tenorYears: Math.round(value) }))}
              />
              <NumberInput
                label="Issuance Costs (%)"
                value={financial.issuanceCostPercent}
                min={0}
                max={5}
                step={0.05}
                onChange={(value) => setFinancial((current) => ({ ...current, issuanceCostPercent: value }))}
              />
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-300">Trigger Type</label>
                <input
                  value={financial.triggerType}
                  onChange={(event) => setFinancial((current) => ({ ...current, triggerType: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 transition focus:ring-2"
                />
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <NumberInput
                label="Magnitude (Mw)"
                value={eventInputs.magnitude}
                min={5}
                max={8.5}
                step={0.1}
                onChange={(value) => setEventInputs((current) => ({ ...current, magnitude: value }))}
              />
              <div>
                <label className="text-xs uppercase tracking-[0.12em] text-slate-300">Epicenter Zone</label>
                <select
                  value={eventInputs.epicenterZone}
                  onChange={(event) => setEventInputs((current) => ({ ...current, epicenterZone: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 transition focus:ring-2"
                >
                  {zoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>
              <NumberInput
                label="Depth (km)"
                value={eventInputs.depthKm}
                min={1}
                max={50}
                step={1}
                onChange={(value) => setEventInputs((current) => ({ ...current, depthKm: value }))}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-white/12 bg-slate-950/45 p-5">
            <h3 className="text-lg font-semibold text-white">Core Output Panel</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <OutputCard label="Trigger Status" value={singleOutput.triggerStatus} status={selectedScenario.data_status} />
              <OutputCard label="Payout Percentage" value={formatPercent(singleOutput.payoutPercent)} status="derived_from_source" />
              <OutputCard label="Payout Amount" value={formatCurrency(singleOutput.payoutAmountUsd)} status="derived_from_source" />
              <OutputCard
                label="Immediate Liquidity Injection"
                value={formatCurrency(singleOutput.payoutAmountUsd)}
                status="derived_from_source"
              />
              <OutputCard label="Estimated Spread" value={formatPercent(singleOutput.spreadPercent)} status="derived_from_source" />
              <OutputCard label="Estimated Coupon" value={formatPercent(singleOutput.couponPercent)} status="derived_from_source" />
              <OutputCard label="Annual Premium" value={formatCurrency(singleOutput.annualPremiumUsd)} status="derived_from_source" />
              <OutputCard
                label="Total Cost over Term"
                value={formatCurrency(singleOutput.totalCostOverTermUsd)}
                status="derived_from_source"
              />
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Premium-to-Cover Ratio</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">
                {singleOutput.premiumToCoverRatio === null ? "N/A" : `${singleOutput.premiumToCoverRatio.toFixed(2)}x`}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="executive-comparison" className="glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/85">Executive Comparison Mode</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Side-by-Side Scenario Brief</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
            <ArrowRightLeft className="h-4 w-4 text-cyan-200" />
            <span>Active scenarios: {compareRows.length}</span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/12 bg-slate-950/45">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-900/75 text-xs uppercase tracking-[0.12em] text-slate-300">
              <tr>
                <th className="border-b border-white/10 px-3 py-2 text-left">Metric</th>
                {compareRows.map((row) => (
                  <th key={row.scenario.id} className="border-b border-white/10 px-3 py-2 text-left">
                    {row.scenario.short_label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareTableRow label="Trigger Scenario" values={compareRows.map((r) => r.scenario.title)} />
              <CompareTableRow label="Bond Size" values={compareRows.map((r) => formatCurrency(r.scenarioFinancial.bondSizeUsd))} />
              <CompareTableRow label="Expected Loss" values={compareRows.map((r) => formatPercent(r.scenarioFinancial.expectedLossPercent))} />
              <CompareTableRow label="Market Multiple" values={compareRows.map((r) => r.scenarioFinancial.marketMultiple.toFixed(2))} />
              <CompareTableRow label="Estimated Spread" values={compareRows.map((r) => formatPercent(r.output.spreadPercent))} />
              <CompareTableRow label="Estimated Coupon" values={compareRows.map((r) => formatPercent(r.output.couponPercent))} />
              <CompareTableRow label="Annual Premium" values={compareRows.map((r) => formatCurrency(r.output.annualPremiumUsd))} />
              <CompareTableRow label="Total Cost" values={compareRows.map((r) => formatCurrency(r.output.totalCostOverTermUsd))} />
              <CompareTableRow label="Payout Amount" values={compareRows.map((r) => formatCurrency(r.output.payoutAmountUsd))} />
              <CompareTableRow label="Liquidity Injection" values={compareRows.map((r) => formatCurrency(r.output.payoutAmountUsd))} />
              <CompareTableRow label="Basis Risk" values={compareRows.map((r) => r.basisRisk.level)} />
              <CompareTableRow label="Policy Relevance" values={compareRows.map((r) => r.insights.policySummary)} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/85">Why This Matters for Israel</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Policy Framing for Sovereign Fiscal Resilience</h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {POLICY_BLOCKS.map((block) => (
            <article key={block.title} className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
              <p className="text-sm font-semibold text-white">{block.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{block.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="stakeholder-orientation" className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/85">Stakeholder Orientation</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Executive Readiness and Workstreams</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StakeholderKpi
            label="Indicative Liquidity Injection"
            value={formatCurrency(singleOutput.payoutAmountUsd)}
            note="Derived from selected trigger + event assumptions"
            status="derived_from_source"
          />
          <StakeholderKpi
            label="Estimated Annual Premium"
            value={formatCurrency(singleOutput.annualPremiumUsd)}
            note="Illustrative sovereign carry estimate"
            status="derived_from_source"
          />
          <StakeholderKpi
            label="Workstream Readiness"
            value={`${readinessScore}%`}
            note="Illustrative readiness composite"
            status="illustrative_assumption"
          />
          <StakeholderKpi
            label="Basis Risk Class"
            value={singleBasisRisk.level}
            note="Illustrative policy design signal"
            status="illustrative_assumption"
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <RoadmapCard title="Roadmap Status" icon={<CheckCircle2 className="h-4 w-4 text-cyan-200" />} items={ROADMAP} />
          <RoadmapCard title="Open Blockers" icon={<AlertTriangle className="h-4 w-4 text-cyan-200" />} items={BLOCKERS} />
          <RoadmapCard title="Next Actions" icon={<CircleDashed className="h-4 w-4 text-cyan-200" />} items={NEXT_ACTIONS} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MiniRoleCard
            icon={<Landmark className="h-4 w-4 text-cyan-200" />}
            title="Ministry of Finance"
            text="Evaluate contingent liability profile, budget resilience, and issuance strategy."
          />
          <MiniRoleCard
            icon={<Building2 className="h-4 w-4 text-cyan-200" />}
            title="Accountant General"
            text="Assess execution feasibility, debt service implications, and funding workflow."
          />
          <MiniRoleCard
            icon={<WalletCards className="h-4 w-4 text-cyan-200" />}
            title="Investor Dialogue"
            text="Translate policy case into a reliability-labeled market communication package."
          />
        </div>
      </section>

      <section id="investor-framing" className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/85">Investor Framing</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Investor Data Room Structure</h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {INVESTOR_PACKAGES.map((item) => (
            <article key={item.title} className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <ReliabilityBadge status={item.status} />
              </div>
              <ul className="mt-2 space-y-1.5">
                {item.points.map((point) => (
                  <li key={point} className="rounded-md border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300">
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-2xl font-semibold text-white">Methodology and Reliability Register</h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-white">Formula / Logic Box</p>
            <div className="mt-2 space-y-2">
              {content.methodology.formulas.map((formula) => (
                <div key={formula.id} className="rounded-md border border-white/10 bg-slate-900/60 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-100">{formula.label}</p>
                    <ReliabilityBadge status={formula.data_status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{formula.expression}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{formula.source_note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-white">Source Register</p>
            <div className="mt-2 space-y-2">
              {content.seismicSources.map((source) => (
                <div key={source.source_name} className="rounded-md border border-white/10 bg-slate-900/60 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-100">{source.source_name}</p>
                    <ReliabilityBadge status={source.data_status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{source.source_type}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{source.source_note}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-amber-300/35 bg-amber-500/10 p-2.5 text-xs text-amber-100">
              Illustrative assumptions remain present in trigger scenarios and policy simulation presets.
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function runSimulation(scenario: TriggerScenario, event: EventInputs, financial: FinancialInputs): SimulationOutput {
  const zoneMatch = event.epicenterZone === scenario.zone_name;
  const thresholdMet = event.magnitude >= scenario.magnitude_threshold_mw;
  const depthMet = event.depthKm <= scenario.depth_max_km;

  let payoutPercent = 0;
  let triggerStatus = "Not Triggered";
  if (zoneMatch && thresholdMet && depthMet) {
    const tiers = [...scenario.payout_ladder].sort((a, b) => a.payout_percent - b.payout_percent);
    const severity = (event.magnitude - scenario.magnitude_threshold_mw) * 2 + (scenario.depth_max_km - event.depthKm) / 12;
    const idx = Math.max(0, Math.min(tiers.length - 1, Math.floor(Math.max(0, severity))));
    payoutPercent = tiers[idx]?.payout_percent ?? tiers[0]?.payout_percent ?? 0;
    triggerStatus = "Triggered";
  }

  const spreadPercent = financial.expectedLossPercent * financial.marketMultiple;
  const couponPercent = spreadPercent + financial.riskFreeRatePercent;
  const annualPremiumUsd = financial.bondSizeUsd * (couponPercent / 100);
  const payoutAmountUsd = financial.bondSizeUsd * (payoutPercent / 100);
  const issuanceCostUsd = financial.bondSizeUsd * (financial.issuanceCostPercent / 100);
  const totalCostOverTermUsd = annualPremiumUsd * financial.tenorYears + issuanceCostUsd;
  const premiumToCoverRatio = payoutAmountUsd > 0 ? annualPremiumUsd / payoutAmountUsd : null;

  return {
    triggerStatus,
    payoutPercent,
    payoutAmountUsd,
    spreadPercent,
    couponPercent,
    annualPremiumUsd,
    totalCostOverTermUsd,
    premiumToCoverRatio
  };
}

function estimateBasisRisk(scenario: TriggerScenario): BasisRiskAssessment {
  let score = 1;
  const drivers: string[] = [];
  const zone = scenario.zone_name.toLowerCase();
  const secondary = scenario.secondary_condition.toLowerCase();

  if (zone.includes("national")) {
    score += 3;
    drivers.push("National trigger envelope may diverge from localized economic loss footprints.");
  } else if (zone.includes("core")) {
    score += 2;
    drivers.push("Core-zone specificity may miss losses outside the primary fault corridor.");
  } else {
    score += 1;
    drivers.push("Regional trigger precision is moderate and depends on exposure concentration.");
  }
  if (secondary.includes("optional")) {
    score += 1;
    drivers.push("Optional secondary conditions increase interpretation complexity.");
  }
  if (scenario.payout_ladder.length >= 3) {
    score += 1;
    drivers.push("Multi-tier ladders improve granularity but can increase mapping complexity.");
  }
  if (scenario.depth_max_km >= 30) {
    score += 1;
    drivers.push("Wider depth window may broaden event qualification uncertainty.");
  }

  const level: BasisRiskLevel = score >= 7 ? "High" : score >= 5 ? "Medium" : "Low";
  return {
    level,
    score,
    drivers,
    explanation:
      "Illustrative basis-risk indicator based on trigger precision, conditional complexity, and scenario architecture.",
    dataStatus: "illustrative_assumption"
  };
}

function buildScenarioInsights(scenario: TriggerScenario, output: SimulationOutput, basisRisk: BasisRiskAssessment) {
  const catastrophic = scenario.magnitude_threshold_mw >= 7 || scenario.zone_name.toLowerCase().includes("national");
  const severityProfile = catastrophic
    ? "National catastrophic event profile"
    : scenario.magnitude_threshold_mw >= 6.6
      ? "Major regional event profile"
      : "Medium fiscal shock profile";
  const fiscalRelevance = catastrophic
    ? "High-severity sovereign financing stress scenario."
    : "Material but potentially bounded fiscal stress scenario.";
  const liquidityNeed =
    output.triggerStatus === "Triggered"
      ? "Immediate sovereign liquidity likely for emergency response and early recovery."
      : "No trigger payout under current event settings; alternate liquidity channels may be needed.";
  const useOfFundsNarrative =
    output.payoutPercent >= 100
      ? "Potential national response and critical infrastructure stabilization."
      : "Potential targeted emergency response and bridge financing.";
  const emergencyResponseFinancing =
    output.triggerStatus === "Triggered"
      ? "Illustrative rapid payout can support front-end emergency financing."
      : "Emergency financing timing may depend on slower post-disaster channels.";
  const policySummary = `Scenario class: ${severityProfile}. Trigger result: ${output.triggerStatus}. Basis risk: ${basisRisk.level}.`;

  return {
    severityProfile,
    fiscalRelevance,
    liquidityNeed,
    useOfFundsNarrative,
    emergencyResponseFinancing,
    policySummary
  };
}

function ModeButton({
  mode,
  value,
  onSet,
  label
}: {
  mode: LabMode;
  value: LabMode;
  onSet: (value: LabMode) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSet(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
        mode === value ? "bg-cyan-500/20 text-cyan-100" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function ReliabilityBadge({ status }: { status?: ReliabilityStatus }) {
  const normalized = status ?? "illustrative_assumption";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.11em]",
        RELIABILITY_STYLES[normalized] ?? "border-slate-300/40 bg-slate-500/16 text-slate-200"
      )}
    >
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.12em] text-slate-300">{label}</label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none ring-cyan-300/40 transition focus:ring-2"
      />
    </div>
  );
}

function OutputCard({
  label,
  value,
  status
}: {
  label: string;
  value: string;
  status: ReliabilityStatus;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/60 p-2.5">
      <p className="text-[11px] uppercase tracking-[0.11em] text-slate-300">{label}</p>
      <p className="mt-1 text-base font-semibold text-cyan-100">{value}</p>
      <div className="mt-1.5">
        <ReliabilityBadge status={status} />
      </div>
    </article>
  );
}

function StakeholderKpi({
  label,
  value,
  note,
  status
}: {
  label: string;
  value: string;
  note: string;
  status: ReliabilityStatus;
}) {
  return (
    <article className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.11em] text-slate-300">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-cyan-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
      <div className="mt-2">
        <ReliabilityBadge status={status} />
      </div>
    </article>
  );
}

function RoadmapCard({
  title,
  icon,
  items
}: {
  title: string;
  icon: ReactNode;
  items: readonly string[];
}) {
  return (
    <article className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-200">{title}</p>
      </div>
      <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-white/10 bg-slate-900/60 px-2.5 py-1.5">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function MiniRoleCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-xl border border-white/12 bg-slate-950/45 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="mt-2 text-xs text-slate-300">{text}</p>
    </article>
  );
}

function CompareLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1.5">
      <span className="text-slate-300">{label}</span>
      <span className="font-semibold text-cyan-100">{value}</span>
    </div>
  );
}

function CompareTableRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b border-white/8 last:border-b-0">
      <td className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.11em] text-slate-300">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="px-3 py-2 text-xs leading-relaxed text-slate-200">
          {value}
        </td>
      ))}
    </tr>
  );
}

function BasisRiskPill({ level }: { level: BasisRiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.11em]",
        level === "Low"
          ? "border-emerald-300/45 bg-emerald-500/16 text-emerald-100"
          : level === "Medium"
            ? "border-amber-300/45 bg-amber-500/16 text-amber-100"
            : "border-rose-300/45 bg-rose-500/16 text-rose-100"
      )}
    >
      {level}
    </span>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-2.5">
      <p className="text-[11px] uppercase tracking-[0.11em] text-slate-300">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 rounded-md border border-white/10 bg-slate-900/60 px-2.5 py-2">
      <p className="text-[11px] uppercase tracking-[0.11em] text-slate-300">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-200">{value}</p>
    </div>
  );
}

function AnchorChip({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-white/14 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.11em] text-slate-200 transition hover:border-cyan-300/45 hover:text-white"
    >
      {label}
    </a>
  );
}
