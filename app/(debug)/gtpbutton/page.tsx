"use client";

import { type ReactNode, useMemo, useState } from "react";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPTabBar from "@/components/GTPButton/GTPTabBar";
import GTPTabButtonSet, { GTPTabButtonSetItem } from "@/components/GTPButton/GTPTabButtonSet";
import GTPUniversalChart, { GTPUniversalChartTabSetsConfig } from "@/components/GTPButton/GTPUniversalChart";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import { MetricContextWrapper } from "@/components/metric/MetricContextWrapper";

type ButtonVariant = "primary" | "highlight" | "no-background";
type ButtonVisualState = "default" | "hover" | "active" | "disabled";
type ButtonSize = "xs" | "sm" | "md" | "lg";

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

const VARIANTS: ButtonVariant[] = ["primary", "highlight", "no-background"];
const VISUAL_STATES: ButtonVisualState[] = ["default", "hover", "active", "disabled"];
const SIZES: ButtonSize[] = ["xs", "sm", "md", "lg"];

const TAB_SET_LEFT_ITEMS: GTPTabButtonSetItem[] = [
  { id: "hourly", label: "1h" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

const TAB_SET_RIGHT_ITEMS: GTPTabButtonSetItem[] = [
  { id: "absolute", label: "Absolute" },
  { id: "percentage", label: "Percentage" },
];

const UNIVERSAL_CHART_TAB_SETS: GTPUniversalChartTabSetsConfig = {
  topLeft: {
    items: [
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
      { id: "monthly", label: "Monthly" },
    ],
    defaultSelectedId: "daily",
  },
  topRight: {
    defaultSelectedId: "max",
  },
  bottomRight: {
    items: [
      { id: "absolute", label: "Absolute" },
      { id: "percentage", label: "Percentage" },
      { id: "stacked", label: "Stacked" },
    ],
    defaultSelectedId: "absolute",
  },
};

const ICON_LAYOUTS: Array<{
  id: "none" | "left" | "right" | "both" | "alone";
  label: string;
  buttonLabel?: string;
  leftIcon?: "gtp-filter";
  rightIcon?: "in-button-right-monochrome";
}> = [
  { id: "none", label: "None", buttonLabel: "Label" },
  { id: "left", label: "Left", buttonLabel: "Label", leftIcon: "gtp-filter" as const },
  { id: "right", label: "Right", buttonLabel: "Label", rightIcon: "in-button-right-monochrome" as const },
  {
    id: "both",
    label: "Both",
    buttonLabel: "Label",
    leftIcon: "gtp-filter" as const,
    rightIcon: "in-button-right-monochrome" as const,
  },
  { id: "alone", label: "Alone", leftIcon: "gtp-filter" as const },
];

function ShowcaseSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[15px] border border-color-bg-default bg-color-bg-medium p-4 space-y-4">
      <header className="space-y-1">
        <h2 className="heading-small-xs lg:heading-small-sm">{title}</h2>
        {description ? <p className="text-xs lg:text-sm text-color-text-secondary">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default function GTPButtonShowcasePage() {
  const [legacyClickCount, setLegacyClickCount] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState("ecosystem");
  const [selectedTimespan, setSelectedTimespan] = useState("30d");

  const [iconLeftClicks, setIconLeftClicks] = useState(0);
  const [iconRightClicks, setIconRightClicks] = useState(0);
  const [iconMainClicks, setIconMainClicks] = useState(0);

  const [submitCount, setSubmitCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const [plainButtonClicks, setPlainButtonClicks] = useState(0);
  const [tabSetSize, setTabSetSize] = useState<ButtonSize>("sm");
  const [leftTabSelection, setLeftTabSelection] = useState("daily");
  const [rightTabSelection, setRightTabSelection] = useState("absolute");

  const [playVariant, setPlayVariant] = useState<ButtonVariant>("primary");
  const [playVisualState, setPlayVisualState] = useState<ButtonVisualState>("default");
  const [playSize, setPlaySize] = useState<ButtonSize>("md");
  const [playHasLabel, setPlayHasLabel] = useState(true);
  const [playHasLeftIcon, setPlayHasLeftIcon] = useState(true);
  const [playHasRightIcon, setPlayHasRightIcon] = useState(true);
  const [playUseDisabledProp, setPlayUseDisabledProp] = useState(false);
  const [playButtonType, setPlayButtonType] = useState<"button" | "submit" | "reset">("button");
  const [playClickCount, setPlayClickCount] = useState(0);

  const playgroundPreview = useMemo(
    () => ({
      label: playHasLabel ? "Playground" : undefined,
      leftIcon: playHasLeftIcon ? "gtp-filter" : undefined,
      rightIcon: playHasRightIcon ? "in-button-right-monochrome" : undefined,
      variant: playVariant,
      visualState: playVisualState,
      size: playSize,
      disabled: playUseDisabledProp,
      buttonType: playButtonType,
    }),
    [
      playHasLabel,
      playHasLeftIcon,
      playHasRightIcon,
      playVariant,
      playVisualState,
      playSize,
      playUseDisabledProp,
      playButtonType,
    ],
  );

  return (
    <main className="min-h-screen bg-color-bg-default text-color-text-primary px-4 py-6 lg:px-8 font-raleway [&_code]:font-raleway [&_pre]:font-raleway [&_select]:font-raleway [&_input]:font-raleway">
      <div className="mx-auto w-full max-w-[1280px] space-y-6">
        <header className="space-y-2">
          <h1 className="heading-small-md lg:heading-small-lg">GTPButton Showcase</h1>
          <p className="text-sm text-color-text-secondary">
            Routes: <code>/gtpbutton</code> and <code>/debug/gtpbutton</code>. This page demonstrates every current prop and behavior in{" "}
            <code>components/GTPButton/GTPButton.tsx</code>.
          </p>
        </header>

        <ShowcaseSection
          title="Variant + Visual State Matrix"
          description="Figma variants: type, visual state, size, and icon composition."
        >
          <div className="space-y-3">
            {VARIANTS.map((variant) => (
              <div key={variant} className="space-y-2">
                <div className="text-xs uppercase tracking-[0.08em] text-color-text-secondary">{variant}</div>
                <div className="flex flex-wrap gap-2">
                  {VISUAL_STATES.map((state) => (
                    <GTPButton
                      key={`${variant}-${state}`}
                      label={`${state}`}
                      variant={variant}
                      visualState={state}
                      size="md"
                      rightIcon="in-button-right-monochrome"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Size + Icon Layout"
          description="Button dimensions come from text style (including line-height), icon size, gap, and per-layout paddings."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xxs text-color-text-secondary">
              {ICON_LAYOUTS.map((layout) => (
                <div key={layout.id} className="rounded-full border border-color-bg-default px-3 py-1">
                  {layout.label}
                </div>
              ))}
            </div>

            {SIZES.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-2">
                <div className="w-[42px] text-xs uppercase text-color-text-secondary">{size}</div>
                {ICON_LAYOUTS.map((layout) => (
                  <GTPButton
                    key={`${size}-${layout.id}`}
                    label={layout.buttonLabel}
                    leftIcon={layout.leftIcon}
                    rightIcon={layout.rightIcon}
                    size={size}
                    variant="primary"
                    visualState="default"
                  />
                ))}
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Interactive Playground"
          description="Adjust all current props and inspect the resulting prop object."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  Variant
                  <select
                    value={playVariant}
                    onChange={(event) => setPlayVariant(event.target.value as ButtonVariant)}
                    className="rounded-[10px] border border-color-bg-default bg-color-bg-default px-2 py-1 text-xs"
                  >
                    {VARIANTS.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  Visual State
                  <select
                    value={playVisualState}
                    onChange={(event) => setPlayVisualState(event.target.value as ButtonVisualState)}
                    className="rounded-[10px] border border-color-bg-default bg-color-bg-default px-2 py-1 text-xs"
                  >
                    {VISUAL_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  Size
                  <select
                    value={playSize}
                    onChange={(event) => setPlaySize(event.target.value as ButtonSize)}
                    className="rounded-[10px] border border-color-bg-default bg-color-bg-default px-2 py-1 text-xs"
                  >
                    {SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  Button Type
                  <select
                    value={playButtonType}
                    onChange={(event) => setPlayButtonType(event.target.value as "button" | "submit" | "reset")}
                    className="rounded-[10px] border border-color-bg-default bg-color-bg-default px-2 py-1 text-xs"
                  >
                    <option value="button">button</option>
                    <option value="submit">submit</option>
                    <option value="reset">reset</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={playHasLabel}
                    onChange={(event) => setPlayHasLabel(event.target.checked)}
                  />
                  Label
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={playHasLeftIcon}
                    onChange={(event) => setPlayHasLeftIcon(event.target.checked)}
                  />
                  Left Icon
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={playHasRightIcon}
                    onChange={(event) => setPlayHasRightIcon(event.target.checked)}
                  />
                  Right Icon
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={playUseDisabledProp}
                    onChange={(event) => setPlayUseDisabledProp(event.target.checked)}
                  />
                  Disabled Prop
                </label>
              </div>

              <div className="flex items-center gap-2">
                <GTPButton
                  label={playHasLabel ? `Playground (${playClickCount})` : undefined}
                  leftIcon={playHasLeftIcon ? "gtp-filter" : undefined}
                  rightIcon={playHasRightIcon ? "in-button-right-monochrome" : undefined}
                  variant={playVariant}
                  visualState={playVisualState}
                  size={playSize}
                  disabled={playUseDisabledProp}
                  buttonType={playButtonType}
                  className="shadow-standard"
                  clickHandler={() => setPlayClickCount((value) => value + 1)}
                />
                <GTPButton
                  label="Reset"
                  size="xs"
                  variant="no-background"
                  clickHandler={() => {
                    setPlayHasLabel(true);
                    setPlayHasLeftIcon(true);
                    setPlayHasRightIcon(true);
                    setPlayUseDisabledProp(false);
                    setPlayVariant("primary");
                    setPlayVisualState("default");
                    setPlaySize("md");
                    setPlayButtonType("button");
                    setPlayClickCount(0);
                  }}
                />
              </div>
            </div>

            <pre className="rounded-[12px] border border-color-bg-default bg-color-bg-default p-3 text-xxs overflow-x-auto">
{JSON.stringify(playgroundPreview, null, 2)}
            </pre>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Nested Components (Tab Bar + Tab Button Set)"
          description="Figma nodes 178:21776 and 178:23477: a Tab Bar with left/right nested Tab Button Sets."
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xxs text-color-text-secondary uppercase tracking-[0.08em]">
                Set Size
              </div>
              {SIZES.map((size) => (
                <GTPButton
                  key={`tab-set-size-${size}`}
                  label={size}
                  size="xs"
                  variant={tabSetSize === size ? "primary" : "no-background"}
                  visualState={tabSetSize === size ? "active" : "default"}
                  clickHandler={() => setTabSetSize(size)}
                />
              ))}
            </div>

            <GTPTabBar
              mobileVariant="stacked"
              left={(
                <GTPTabButtonSet
                  items={TAB_SET_LEFT_ITEMS}
                  selectedId={leftTabSelection}
                  size={tabSetSize}
                  fill="mobile"
                  onChange={(id) => setLeftTabSelection(id)}
                />
              )}
              right={(
                <GTPTabButtonSet
                  items={TAB_SET_RIGHT_ITEMS}
                  selectedId={rightTabSelection}
                  size={tabSetSize}
                  fill="mobile"
                  onChange={(id) => setRightTabSelection(id)}
                />
              )}
            />

            <p className="text-xs lg:text-sm text-color-text-secondary">
              Selected: left <code>{leftTabSelection}</code>, right <code>{rightTabSelection}</code>.
            </p>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Universal Chart Component"
          description={
            <>
              Figma node <code>3415:106567</code>. Includes the draggable table/chart splitter and a working
              ECharts plot fed by growthepie fundamentals data (<code>daily-active-addresses</code>).
            </>
          }
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <MetricContextWrapper
              metric="daily-active-addresses"
              metric_type="fundamentals"
              defaultTimeInterval="daily"
              defaultTimespan="365d"
              defaultScale="absolute"
            >
              <GTPUniversalChart fullBleed={false} tabSets={UNIVERSAL_CHART_TAB_SETS} />
            </MetricContextWrapper>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Icon Click Handlers"
          description="Left and right icon handlers are independent from the main button click handler."
        >
          <div className="flex flex-wrap gap-2">
            <GTPButton
              label={`main:${iconMainClicks} left:${iconLeftClicks} right:${iconRightClicks}`}
              leftIcon="gtp-filter"
              rightIcon="in-button-right-monochrome"
              variant="highlight"
              size="sm"
              clickHandler={() => setIconMainClicks((value) => value + 1)}
              leftIconClickHandler={() => setIconLeftClicks((value) => value + 1)}
              rightIconClickHandler={() => setIconRightClicks((value) => value + 1)}
            />
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Legacy Props Compatibility"
          description="Legacy props still map to the new implementation."
        >
          <div className="flex flex-wrap gap-2">
            <GTPButton
              label={`Clickable (${legacyClickCount})`}
              clickHandler={() => setLegacyClickCount((value) => value + 1)}
            />
            <GTPButton label="Selected" isSelected />
            <GTPButton label="Disabled" disabled />
            <GTPButton label="Gradient Outline" gradientOutline />
            <GTPButton label="Selected + Outline" isSelected gradientOutline />
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title="Button Type In Form"
          description="Shows how buttonType behaves for submit/reset/button."
        >
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitCount((value) => value + 1);
            }}
            onReset={(event) => {
              event.preventDefault();
              setResetCount((value) => value + 1);
            }}
          >
            <GTPButton label={`Submit (${submitCount})`} variant="highlight" size="sm" buttonType="submit" />
            <GTPButton label={`Reset (${resetCount})`} variant="no-background" size="sm" buttonType="reset" />
            <GTPButton
              label={`Plain Button (${plainButtonClicks})`}
              variant="primary"
              size="sm"
              buttonType="button"
              clickHandler={() => setPlainButtonClicks((value) => value + 1)}
            />
          </form>
        </ShowcaseSection>

        <ShowcaseSection
          title="Container + Row Composition"
          description={
            <>
              Mirrors the composition pattern used in <code>LandingChart</code>.
            </>
          }
        >
          <GTPButtonContainer>
            <GTPButtonRow>
              {METRIC_OPTIONS.map((option) => (
                <GTPButton
                  key={option.id}
                  label={option.label}
                  rightIcon={option.icon}
                  size="xs"
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
                  size="xs"
                  isSelected={selectedTimespan === option.id}
                  clickHandler={() => setSelectedTimespan(option.id)}
                />
              ))}
            </GTPButtonRow>
          </GTPButtonContainer>
        </ShowcaseSection>
      </div>
    </main>
  );
}
