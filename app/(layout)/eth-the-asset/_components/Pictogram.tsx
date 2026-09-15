"use client";

import { useMemo } from "react";
import { BasketGlyph, useGlyphId } from "./BasketIcons";

// An isotype (pictogram) count: the quantity drawn as repeated item
// illustrations rather than stated as a number. One <symbol> is defined and
// re-used, so N glyphs cost N <use> nodes rather than N copies of the artwork.

const NICE_UNITS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];

/** Pick a per-glyph unit that lands the glyph count near `target`. */
function pickUnit(count: number, target: number) {
  let best = NICE_UNITS[0];
  let bestDistance = Infinity;
  for (const unit of NICE_UNITS) {
    const glyphs = count / unit;
    if (glyphs < 3) continue;
    const distance = Math.abs(glyphs - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = unit;
    }
  }
  return best;
}

export default function Pictogram({
  glyph,
  count,
  unitLabel,
  columns = 8,
  glyphSize = 34,
  gap = 6,
  targetGlyphs = 18,
  maxGlyphs = 24,
}: {
  glyph: BasketGlyph;
  /** The real quantity being drawn. */
  count: number;
  /** What one unit is called, e.g. "dozen" — used in the "each = N" caption. */
  unitLabel: string;
  columns?: number;
  glyphSize?: number;
  gap?: number;
  targetGlyphs?: number;
  maxGlyphs?: number;
}) {
  const uid = useGlyphId();

  const { perGlyph, full, partial, total } = useMemo(() => {
    const unit = pickUnit(count, targetGlyphs);
    const exact = count / unit;
    const capped = Math.min(exact, maxGlyphs);
    const fullCount = Math.floor(capped);
    return {
      perGlyph: unit,
      full: fullCount,
      partial: capped - fullCount,
      total: Math.ceil(capped),
    };
  }, [count, targetGlyphs, maxGlyphs]);

  const cell = glyphSize + gap;
  const rows = Math.max(1, Math.ceil(total / columns));
  const width = columns * cell - gap;
  const height = rows * cell - gap;

  const position = (index: number) => ({
    x: (index % columns) * cell,
    y: Math.floor(index / columns) * cell,
  });

  const partialPos = position(full);

  return (
    <div className="flex flex-col gap-y-[5px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ maxWidth: width, display: "block" }}
        role="img"
        aria-label={`${count.toLocaleString()} ${unitLabel}`}
      >
        <defs>
          <glyph.Defs uid={uid} />
          <symbol id={`${uid}-sym`} viewBox="0 0 48 48">
            <glyph.Body uid={uid} />
          </symbol>
          {partial > 0 && (
            <clipPath id={`${uid}-clip`}>
              <rect x={partialPos.x} y={partialPos.y} width={glyphSize * partial} height={glyphSize} />
            </clipPath>
          )}
        </defs>

        {Array.from({ length: full }, (_, i) => {
          const { x, y } = position(i);
          return <use key={i} href={`#${uid}-sym`} x={x} y={y} width={glyphSize} height={glyphSize} />;
        })}

        {partial > 0 && (
          <>
            <use
              href={`#${uid}-sym`}
              x={partialPos.x}
              y={partialPos.y}
              width={glyphSize}
              height={glyphSize}
              opacity={0.18}
            />
            {/* Clipping a wrapping <g> rather than the <use> itself — clip-path
                applied directly to <use> is unreliable across engines. */}
            <g clipPath={`url(#${uid}-clip)`}>
              <use href={`#${uid}-sym`} x={partialPos.x} y={partialPos.y} width={glyphSize} height={glyphSize} />
            </g>
          </>
        )}
      </svg>
      <div className="heading-small-xxxs text-color-text-primary/70">
        each = {perGlyph.toLocaleString()} {unitLabel}
        {count / perGlyph > maxGlyphs && " · showing the first " + maxGlyphs}
      </div>
    </div>
  );
}
