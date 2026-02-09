"use client";

import { useState } from "react";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";

const METRIC_OPTIONS = [
  {
    id: "ecosystem",
    label: "Total Ethereum Ecosystem",
    icon: "gtp-metrics-ethereum-ecosystem" as const,
  },
  {
    id: "composition",
    label: "Composition",
    icon: "gtp-metrics-chaincomposition" as const,
  },
  {
    id: "split",
    label: "Composition Split",
    icon: "gtp-metrics-chains-percentage" as const,
  },
];

const TIMESPAN_OPTIONS = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "1y", label: "1Y" },
];

export default function GTPButtonShowcasePage() {
  const [clickCount, setClickCount] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("ecosystem");
  const [selectedTimespan, setSelectedTimespan] = useState("30d");

  return (
    <main className="min-h-screen bg-color-bg-default text-color-text-primary px-4 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="space-y-2">
          <h1 className="text-xl lg:text-2xl font-medium">GTPButton Showcase</h1>
          <p className="text-sm text-color-text-secondary">
            Route: <code>/gtpbutton</code>. This page lists the options currently implemented in{" "}
            <code>components/GTPButton/GTPButton.tsx</code>.
          </p>
        </header>

        <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4 space-y-4">
          <h2 className="text-sm lg:text-base font-medium">State Variants</h2>
          <div className="flex flex-wrap gap-2">
            <GTPButton
              label={`Clickable (${clickCount})`}
              clickHandler={() => setClickCount((value) => value + 1)}
            />
            <GTPButton label="Selected" isSelected />
            <GTPButton label="Disabled" disabled />
            <GTPButton label="Gradient Outline" gradientOutline />
            <GTPButton label="Selected + Outline" isSelected gradientOutline />
          </div>
        </section>

        <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4 space-y-4">
          <h2 className="text-sm lg:text-base font-medium">Icon Variants</h2>
          <div className="flex flex-wrap gap-2">
            <GTPButton label="No Icon" />
            <GTPButton label="Left Icon" leftIcon="gtp-filter" />
            <GTPButton label="Right Icon" rightIcon="gtp-chevronright" />
            <GTPButton
              label="Both Icons"
              leftIcon="gtp-filter"
              rightIcon="gtp-chevronright"
            />
            <GTPButton
              label="Disabled + Icons"
              leftIcon="gtp-filter"
              rightIcon="gtp-chevronright"
              disabled
            />
          </div>
        </section>

        <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4 space-y-4">
          <h2 className="text-sm lg:text-base font-medium">Container + Row Composition</h2>
          <p className="text-xs lg:text-sm text-color-text-secondary">
            Mirrors the same composition pattern used in <code>LandingChart</code>.
          </p>
          <GTPButtonContainer>
            <GTPButtonRow>
              {METRIC_OPTIONS.map((option) => (
                <GTPButton
                  key={option.id}
                  label={option.label}
                  rightIcon={option.icon}
                  isSelected={selectedMetric === option.id}
                  clickHandler={() => setSelectedMetric(option.id)}
                />
              ))}
            </GTPButtonRow>

            <GTPButtonRow>
              {TIMESPAN_OPTIONS.map((option) => (
                <GTPButton
                  key={option.id}
                  label={option.label}
                  isSelected={selectedTimespan === option.id}
                  clickHandler={() => setSelectedTimespan(option.id)}
                />
              ))}
            </GTPButtonRow>
          </GTPButtonContainer>
        </section>

        <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4">
          <p className="text-xs lg:text-sm text-color-text-secondary">
            Note: <code>leftIconClickHandler</code> and <code>rightIconClickHandler</code> exist on
            the props interface but are not wired inside the component rendering yet.
          </p>
        </section>
      </div>
    </main>
  );
}
