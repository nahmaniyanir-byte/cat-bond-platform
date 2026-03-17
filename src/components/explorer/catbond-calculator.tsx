"use client";

import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";

import type { CalculatorContentBundle, CalculatorScenario } from "@/lib/calculator-content";
import { formatCurrency, formatPercent } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface CatBondCalculatorProps {
  content: CalculatorContentBundle;
}

interface CalculatorInputs {
  principalUsd: number;
  expectedLossPercent: number;
  marketMultiple: number;
  riskFreeRatePercent: number;
  tenorYears: number;
  issuanceCostsPercent: number;
  traditionalInsuranceRatePercent: number;
  triggerType: string;
  perilType: string;
}

interface CalculatorOutputs {
  spreadPercent: number;
  couponPercent: number;
  annualPremiumUsd: number;
  totalCostOverTermUsd: number;
  totalCostPercentPrincipal: number;
  equivalentAnnualizedCostPercent: number;
  expectedLossAmountUsd: number;
  traditionalAnnualCostUsd: number;
  annualCostDeltaUsd: number;
}

export function CatBondCalculator({ content }: CatBondCalculatorProps) {
  const defaultScenario = content.defaultScenarios[0];
  const initialInputs = buildInitialInputs(content, defaultScenario);

  const [principalUsd, setPrincipalUsd] = useState(initialInputs.principalUsd);
  const [expectedLossPercent, setExpectedLossPercent] = useState(initialInputs.expectedLossPercent);
  const [marketMultiple, setMarketMultiple] = useState(initialInputs.marketMultiple);
  const [riskFreeRatePercent, setRiskFreeRatePercent] = useState(initialInputs.riskFreeRatePercent);
  const [tenorYears, setTenorYears] = useState(initialInputs.tenorYears);
  const [issuanceCostsPercent, setIssuanceCostsPercent] = useState(initialInputs.issuanceCostsPercent);
  const [traditionalInsuranceRatePercent, setTraditionalInsuranceRatePercent] = useState(
    initialInputs.traditionalInsuranceRatePercent
  );
  const [triggerType, setTriggerType] = useState(initialInputs.triggerType);
  const [perilType, setPerilType] = useState(initialInputs.perilType);

  const outputs = useMemo(
    () =>
      runCalculator({
        principalUsd,
        expectedLossPercent,
        marketMultiple,
        riskFreeRatePercent,
        tenorYears,
        issuanceCostsPercent,
        traditionalInsuranceRatePercent,
        triggerType,
        perilType
      }),
    [
      expectedLossPercent,
      issuanceCostsPercent,
      marketMultiple,
      perilType,
      principalUsd,
      riskFreeRatePercent,
      tenorYears,
      traditionalInsuranceRatePercent,
      triggerType
    ]
  );

  const scenarioComparisons = useMemo(
    () =>
      content.defaultScenarios.map((scenario) => {
        const scenarioInputs = scenarioToInputs(scenario);
        return {
          scenario,
          outputs: runCalculator(scenarioInputs)
        };
      }),
    [content.defaultScenarios]
  );

  const costComparisonChartData = useMemo(
    () => ({
      labels: ["Cat Bond Annual Premium", "Traditional Annual Cost", "Potential Capital Injection"],
      datasets: [
        {
          label: "USD",
          data: [outputs.annualPremiumUsd, outputs.traditionalAnnualCostUsd, principalUsd],
          backgroundColor: ["rgba(34,211,238,0.65)", "rgba(245,158,11,0.55)", "rgba(59,130,246,0.45)"],
          borderColor: ["rgba(103,232,249,0.9)", "rgba(251,191,36,0.9)", "rgba(96,165,250,0.9)"],
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    }),
    [outputs.annualPremiumUsd, outputs.traditionalAnnualCostUsd, principalUsd]
  );

  const scenarioCouponChartData = useMemo(
    () => ({
      labels: scenarioComparisons.map((item) => item.scenario.label),
      datasets: [
        {
          label: "Coupon (%)",
          data: scenarioComparisons.map((item) => item.outputs.couponPercent),
          backgroundColor: ["rgba(52,211,153,0.7)", "rgba(34,211,238,0.7)", "rgba(14,165,233,0.72)"],
          borderColor: ["rgba(110,231,183,0.9)", "rgba(103,232,249,0.9)", "rgba(125,211,252,0.92)"],
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    }),
    [scenarioComparisons]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#cbd5e1"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148,163,184,0.12)" }
        },
        y: {
          ticks: {
            color: "#94a3b8",
            callback: (value: string | number) =>
              typeof value === "number" ? `$${Math.round(value / 1_000_000)}M` : value
          },
          grid: { color: "rgba(148,163,184,0.12)" }
        }
      }
    }),
    []
  );

  const percentChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#cbd5e1" } }
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148,163,184,0.12)" }
        },
        y: {
          ticks: {
            color: "#94a3b8",
            callback: (value: string | number) => (typeof value === "number" ? `${value.toFixed(1)}%` : value)
          },
          grid: { color: "rgba(148,163,184,0.12)" }
        }
      }
    }),
    []
  );

  function applyScenario(scenario: CalculatorScenario) {
    const scenarioInputs = scenarioToInputs(scenario);
    setPrincipalUsd(scenarioInputs.principalUsd);
    setExpectedLossPercent(scenarioInputs.expectedLossPercent);
    setMarketMultiple(scenarioInputs.marketMultiple);
    setRiskFreeRatePercent(scenarioInputs.riskFreeRatePercent);
    setTenorYears(scenarioInputs.tenorYears);
    setIssuanceCostsPercent(scenarioInputs.issuanceCostsPercent);
    setTraditionalInsuranceRatePercent(scenarioInputs.traditionalInsuranceRatePercent);
    setTriggerType(scenarioInputs.triggerType);
    setPerilType(scenarioInputs.perilType);
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/90">Pricing and Fiscal Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
          Sovereign Catastrophe Bond Pricing Calculator
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-300">
          Indicative module for catastrophe bond structuring, coupon estimation, and sovereign budget impact analysis.
          Inputs and scenario references are loaded from external methodology and calculator configuration files.
        </p>
      </section>

      <section className="glass-panel p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-300">Scenario Manager</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {content.defaultScenarios.map((scenario) => (
            <button key={scenario.id} type="button" onClick={() => applyScenario(scenario)} className="btn-secondary">
              {scenario.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Core Input Panel</h2>
          <div className="mt-4 grid gap-4">
            <NumericInput
              label={content.formulaInputs.principal_usd.label}
              value={principalUsd}
              min={content.formulaInputs.principal_usd.min}
              max={content.formulaInputs.principal_usd.max}
              step={content.formulaInputs.principal_usd.step}
              onChange={setPrincipalUsd}
              format={(value) => formatCurrency(value)}
            />
            <NumericInput
              label={content.formulaInputs.expected_loss_percent.label}
              value={expectedLossPercent}
              min={content.formulaInputs.expected_loss_percent.min}
              max={content.formulaInputs.expected_loss_percent.max}
              step={content.formulaInputs.expected_loss_percent.step}
              onChange={setExpectedLossPercent}
              format={(value) => formatPercent(value)}
            />
            <NumericInput
              label={content.formulaInputs.market_multiple.label}
              value={marketMultiple}
              min={content.formulaInputs.market_multiple.min}
              max={content.formulaInputs.market_multiple.max}
              step={content.formulaInputs.market_multiple.step}
              onChange={setMarketMultiple}
              format={(value) => value.toFixed(2)}
            />
            <NumericInput
              label={content.formulaInputs.risk_free_rate_percent.label}
              value={riskFreeRatePercent}
              min={content.formulaInputs.risk_free_rate_percent.min}
              max={content.formulaInputs.risk_free_rate_percent.max}
              step={content.formulaInputs.risk_free_rate_percent.step}
              onChange={setRiskFreeRatePercent}
              format={(value) => formatPercent(value)}
            />
            <NumericInput
              label={content.formulaInputs.tenor_years.label}
              value={tenorYears}
              min={content.formulaInputs.tenor_years.min}
              max={content.formulaInputs.tenor_years.max}
              step={content.formulaInputs.tenor_years.step}
              onChange={setTenorYears}
              format={(value) => `${Math.round(value)} years`}
            />
            <NumericInput
              label={content.formulaInputs.issuance_costs_percent.label}
              value={issuanceCostsPercent}
              min={content.formulaInputs.issuance_costs_percent.min}
              max={content.formulaInputs.issuance_costs_percent.max}
              step={content.formulaInputs.issuance_costs_percent.step}
              onChange={setIssuanceCostsPercent}
              format={(value) => formatPercent(value)}
            />
            <NumericInput
              label={content.formulaInputs.traditional_insurance_rate_percent.label}
              value={traditionalInsuranceRatePercent}
              min={content.formulaInputs.traditional_insurance_rate_percent.min}
              max={content.formulaInputs.traditional_insurance_rate_percent.max}
              step={content.formulaInputs.traditional_insurance_rate_percent.step}
              onChange={setTraditionalInsuranceRatePercent}
              format={(value) => formatPercent(value)}
            />
            <SelectInput
              label="Trigger Type"
              value={triggerType}
              options={content.formulaInputs.trigger_types}
              onChange={setTriggerType}
            />
            <SelectInput
              label="Peril Type"
              value={perilType}
              options={content.formulaInputs.peril_types}
              onChange={setPerilType}
            />
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Core Output Panel</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Estimated Spread" value={formatPercent(outputs.spreadPercent)} />
            <MetricCard label="Estimated Coupon" value={formatPercent(outputs.couponPercent)} />
            <MetricCard label="Annual Premium" value={formatCurrency(outputs.annualPremiumUsd)} />
            <MetricCard label="Total Cost over Term" value={formatCurrency(outputs.totalCostOverTermUsd)} />
            <MetricCard
              label="Total Cost / Principal"
              value={formatPercent(outputs.totalCostPercentPrincipal)}
            />
            <MetricCard
              label="Equivalent Annualized Cost"
              value={formatPercent(outputs.equivalentAnnualizedCostPercent)}
            />
          </div>
          <div className="mt-4 h-[320px]">
            <Bar data={costComparisonChartData} options={chartOptions} />
          </div>
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">Scenario Comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-300">
                <th className="px-2 py-2">Scenario</th>
                <th className="px-2 py-2">Expected Loss</th>
                <th className="px-2 py-2">Market Multiple</th>
                <th className="px-2 py-2">Spread</th>
                <th className="px-2 py-2">Coupon</th>
                <th className="px-2 py-2">Annual Premium</th>
                <th className="px-2 py-2">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {scenarioComparisons.map((item) => (
                <tr key={item.scenario.id} className="border-b border-white/5 text-slate-100/90">
                  <td className="px-2 py-2">
                    <p className="font-medium text-white">{item.scenario.label}</p>
                    <p className="text-xs text-slate-400">{item.scenario.description}</p>
                  </td>
                  <td className="px-2 py-2 text-slate-300">{formatPercent(item.scenario.expected_loss_percent)}</td>
                  <td className="px-2 py-2 text-slate-300">{item.scenario.market_multiple.toFixed(2)}x</td>
                  <td className="px-2 py-2 text-slate-300">{formatPercent(item.outputs.spreadPercent)}</td>
                  <td className="px-2 py-2 text-slate-300">{formatPercent(item.outputs.couponPercent)}</td>
                  <td className="px-2 py-2 text-slate-300">{formatCurrency(item.outputs.annualPremiumUsd)}</td>
                  <td className="px-2 py-2 text-slate-300">{formatCurrency(item.outputs.totalCostOverTermUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 h-[260px]">
          <Bar data={scenarioCouponChartData} options={percentChartOptions} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">Comparison Tool</h2>
          <p className="mt-2 text-sm text-slate-300">
            Compare indicative catastrophe bond annual premium against a configurable traditional
            insurance/reinsurance rate assumption.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Cat Bond Annual Premium" value={formatCurrency(outputs.annualPremiumUsd)} />
            <MetricCard
              label="Traditional Annual Cost"
              value={formatCurrency(outputs.traditionalAnnualCostUsd)}
            />
            <MetricCard label="Annual Delta (Cat Bond - Traditional)" value={formatCurrency(outputs.annualCostDeltaUsd)} />
            <MetricCard label="Expected Loss Amount" value={formatCurrency(outputs.expectedLossAmountUsd)} />
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">{content.marketMultipleAssumptions.title}</h2>
          <div className="mt-4 space-y-3">
            {content.marketMultipleAssumptions.bands.map((band) => (
              <div key={band.label} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-sm font-semibold text-white">{band.label}</p>
                <p className="mt-1 text-sm text-cyan-200">{band.range}</p>
                <p className="mt-1 text-sm text-slate-300">{band.description}</p>
              </div>
            ))}
          </div>
          {content.marketMultipleAssumptions.notes.length ? (
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              {content.marketMultipleAssumptions.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">{content.expectedLossReferenceValues.title}</h2>
          <div className="mt-4 space-y-3">
            {content.expectedLossReferenceValues.entries.map((entry) => (
              <div key={entry.label} className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-sm font-semibold text-white">{entry.label}</p>
                <p className="mt-1 text-sm text-cyan-200">{formatPercent(entry.expected_loss_percent)}</p>
                <p className="mt-1 text-sm text-slate-300">{entry.typical_use}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel p-5">
          <h2 className="text-xl font-semibold text-white">{content.methodology.title}</h2>
          <p className="mt-2 text-sm text-slate-300">{content.methodology.overview}</p>

          <div className="mt-4 space-y-2">
            {content.methodology.formulas.map((formula) => (
              <div key={formula.label} className="rounded-lg border border-white/10 bg-slate-900/55 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{formula.label}</p>
                <p className="mt-1 text-sm text-slate-200">{formula.expression}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Assumptions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {content.methodology.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Limitations</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {content.methodology.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="glass-panel p-5">
        <h2 className="text-xl font-semibold text-white">
          {content.methodology.sovereign_policy_mode.title}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {content.methodology.sovereign_policy_mode.points.map((point) => (
            <article key={point} className="rounded-xl border border-white/10 bg-slate-900/55 p-4 text-sm text-slate-300">
              {point}
            </article>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-slate-900/50 p-4 text-sm text-slate-300">
          {content.methodology.disclaimer}
        </div>
      </section>
    </div>
  );
}

function buildInitialInputs(
  content: CalculatorContentBundle,
  scenario: CalculatorScenario | undefined
): CalculatorInputs {
  if (scenario) {
    return scenarioToInputs(scenario);
  }

  return {
    principalUsd: content.formulaInputs.principal_usd.default,
    expectedLossPercent: content.formulaInputs.expected_loss_percent.default,
    marketMultiple: content.formulaInputs.market_multiple.default,
    riskFreeRatePercent: content.formulaInputs.risk_free_rate_percent.default,
    tenorYears: content.formulaInputs.tenor_years.default,
    issuanceCostsPercent: content.formulaInputs.issuance_costs_percent.default,
    traditionalInsuranceRatePercent: content.formulaInputs.traditional_insurance_rate_percent.default,
    triggerType: content.formulaInputs.trigger_types[0] ?? "Parametric",
    perilType: content.formulaInputs.peril_types[0] ?? "Multi-Peril"
  };
}

function scenarioToInputs(scenario: CalculatorScenario): CalculatorInputs {
  return {
    principalUsd: scenario.principal_usd,
    expectedLossPercent: scenario.expected_loss_percent,
    marketMultiple: scenario.market_multiple,
    riskFreeRatePercent: scenario.risk_free_rate_percent,
    tenorYears: scenario.tenor_years,
    issuanceCostsPercent: scenario.issuance_costs_percent,
    traditionalInsuranceRatePercent: scenario.traditional_insurance_rate_percent,
    triggerType: scenario.trigger_type,
    perilType: scenario.peril_type
  };
}

function runCalculator(inputs: CalculatorInputs): CalculatorOutputs {
  const spreadPercent = inputs.expectedLossPercent * inputs.marketMultiple + inputs.issuanceCostsPercent;
  const couponPercent = spreadPercent + inputs.riskFreeRatePercent;
  const annualPremiumUsd = (couponPercent / 100) * inputs.principalUsd;
  const totalCostOverTermUsd = annualPremiumUsd * inputs.tenorYears;
  const totalCostPercentPrincipal = inputs.principalUsd > 0 ? (totalCostOverTermUsd / inputs.principalUsd) * 100 : 0;
  const equivalentAnnualizedCostPercent = inputs.tenorYears > 0 ? totalCostPercentPrincipal / inputs.tenorYears : 0;
  const expectedLossAmountUsd = (inputs.expectedLossPercent / 100) * inputs.principalUsd;
  const traditionalAnnualCostUsd = (inputs.traditionalInsuranceRatePercent / 100) * inputs.principalUsd;
  const annualCostDeltaUsd = annualPremiumUsd - traditionalAnnualCostUsd;

  return {
    spreadPercent,
    couponPercent,
    annualPremiumUsd,
    totalCostOverTermUsd,
    totalCostPercentPrincipal,
    equivalentAnnualizedCostPercent,
    expectedLossAmountUsd,
    traditionalAnnualCostUsd,
    annualCostDeltaUsd
  };
}

interface NumericInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}

function NumericInput({ label, value, min, max, step, onChange, format }: NumericInputProps) {
  return (
    <label className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
        <span className="text-sm text-cyan-200">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
      />
    </label>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs uppercase tracking-[0.14em] text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-white/12 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none"
      >
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
