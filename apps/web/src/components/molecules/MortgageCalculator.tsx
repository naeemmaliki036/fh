"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { formatAed } from "@/lib/utils/format-currency";

interface MortgageCalculatorProps {
  price: number;
  currency: string;
}

function computeEmi(price: number, downPct: number, years: number, rate: number): number {
  const P = price * (1 - downPct / 100);
  const r = rate / 100 / 12;
  const n = years * 12;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function MortgageCalculator({
  price,
  currency,
}: MortgageCalculatorProps): React.ReactElement {
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(4.5);

  const emi = computeEmi(price, downPct, years, rate);
  const loanAmount = price * (1 - downPct / 100);

  return (
    <section className="rounded-xl bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-950">Mortgage Calculator</h2>
        <div className="group relative">
          <Info className="h-4 w-4 text-slate-400 cursor-help" />
          <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-56 rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 shadow-lg group-hover:block">
            Estimate only — actual rates vary by lender.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Down payment</span>
            <span className="font-semibold text-slate-900">{downPct}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
          <p className="text-xs text-slate-400">
            {currency} {loanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} loan
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Loan term</span>
            <span className="font-semibold text-slate-900">{years} yrs</span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Interest rate</span>
            <span className="font-semibold text-slate-900">{rate.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-400">Est. monthly payment</p>
        <p className="mt-1 text-2xl font-black text-slate-950">
          {Number.isFinite(emi) ? formatAed(Math.round(emi)) : "—"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {currency} / month — estimate only, rates vary by lender
        </p>
      </div>
    </section>
  );
}
