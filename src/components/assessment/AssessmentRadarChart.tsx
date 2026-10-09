import React, { useMemo } from "react";
import type { AssessmentItem, AssessmentScore } from "@/types";

export interface AssessmentRadarChartProps {
  items: AssessmentItem[];
  scores: AssessmentScore[];
  minimumScore: number;
}

export const AssessmentRadarChart: React.FC<AssessmentRadarChartProps> = ({
  items,
  scores,
  minimumScore,
}) => {
  const size = 320;
  const center = size / 2;
  const radius = 96;

  const scoreByItemId = useMemo(
    () => new Map(scores.map((score) => [score.assessmentItemId, score])),
    [scores],
  );

  const getPoint = (index: number, valueRatio: number) => {
    if (items.length === 0) return { x: center, y: center };
    const angle = (Math.PI * 2 * index) / items.length - Math.PI / 2;
    const pointRadius = radius * valueRatio;

    return {
      x: center + Math.cos(angle) * pointRadius,
      y: center + Math.sin(angle) * pointRadius,
    };
  };

  const getPolygonPoints = (ratio: number) =>
    items
      .map((_, index) => {
        const point = getPoint(index, ratio);
        return `${point.x},${point.y}`;
      })
      .join(" ");

  const gridPolygons = useMemo(
    () => [0.25, 0.5, 0.75, 1].map((ratio) => getPolygonPoints(ratio)),
    [items],
  );

  const valuePoints = useMemo(
    () =>
      items
        .map((item, index) => {
          const score = scoreByItemId.get(item.id)?.score ?? 0;
          const ratio = Math.max(0, Math.min(1, score / (item.maxScore || 1)));
          const point = getPoint(index, ratio);
          return `${point.x},${point.y}`;
        })
        .join(" "),
    [items, scoreByItemId],
  );

  const minimumPoints = useMemo(
    () =>
      items
        .map((item, index) => {
          const ratio = Math.max(
            0,
            Math.min(1, minimumScore / (item.maxScore || 1)),
          );
          const point = getPoint(index, ratio);
          return `${point.x},${point.y}`;
        })
        .join(" "),
    [items, minimumScore],
  );

  const axisLines = useMemo(
    () =>
      items.map((_, index) => {
        const point = getPoint(index, 1);
        return { x1: center, y1: center, x2: point.x, y2: point.y };
      }),
    [items],
  );

  const labels = useMemo(
    () =>
      items.map((item, index) => {
        const point = getPoint(index, 1.32);
        const score = scoreByItemId.get(item.id)?.score ?? 0;
        const xOffset = point.x - center;

        return {
          id: item.id,
          label: item.label,
          score,
          maxScore: item.maxScore,
          x: point.x,
          y: point.y,
          textAnchor:
            Math.abs(xOffset) < 16
              ? ("middle" as const)
              : xOffset > 0
                ? ("start" as const)
                : ("end" as const),
        };
      }),
    [items, scoreByItemId],
  );

  const scorePoints = useMemo(
    () =>
      items.map((item, index) => {
        const score = scoreByItemId.get(item.id)?.score ?? 0;
        const ratio = Math.max(0, Math.min(1, score / (item.maxScore || 1)));
        const point = getPoint(index, ratio);

        return {
          id: item.id,
          x: point.x,
          y: point.y,
        };
      }),
    [items, scoreByItemId],
  );

  const getShortLabel = (label: string) => {
    if (label.length <= 16) return label;
    return `${label.slice(0, 15)}...`;
  };

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-2">
        <h3 className="text-sm font-semibold leading-none text-foreground">
          Radar Penilaian
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum {minimumScore}
        </p>
      </div>

      {items.length > 0 && (
        <div className="flex justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-[300px] w-full max-w-[360px]"
            role="img"
            aria-label="Radar hasil penilaian"
          >
            {gridPolygons.map((points) => (
              <polygon
                key={points}
                points={points}
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
            {axisLines.map((line) => (
              <line
                key={`${line.x2}-${line.y2}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="var(--border)"
                strokeWidth="1"
              />
            ))}
            <polygon
              points={minimumPoints}
              fill="var(--chart-2)"
              fillOpacity="0.18"
              stroke="var(--chart-2)"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <polygon
              points={valuePoints}
              fill="var(--chart-1)"
              fillOpacity="0.82"
              stroke="var(--chart-1)"
              strokeWidth="1.5"
            />
            {scorePoints.map((point) => (
              <circle
                key={`${point.id}-point`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="var(--chart-1)"
                stroke="var(--background)"
                strokeWidth="2"
              />
            ))}
            {labels.map((label) => (
              <text
                key={label.id}
                x={label.x}
                y={label.y}
                textAnchor={label.textAnchor}
                dominantBaseline="middle"
                className="fill-foreground text-[12px]"
              >
                <tspan x={label.x} dy="-0.35em" className="font-semibold">
                  {label.score}/{label.maxScore}
                </tspan>
                <tspan
                  x={label.x}
                  dy="1.15em"
                  className="fill-muted-foreground text-[11px]"
                >
                  {getShortLabel(label.label)}
                </tspan>
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

export default AssessmentRadarChart;

