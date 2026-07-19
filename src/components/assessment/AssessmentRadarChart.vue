<script setup lang="ts">
import { computed } from "vue";
import type { AssessmentItem, AssessmentScore } from "../../types";

const props = defineProps<{
  items: AssessmentItem[];
  scores: AssessmentScore[];
  minimumScore: number;
}>();

const size = 320;
const center = size / 2;
const radius = 96;

const scoreByItemId = computed(
  () => new Map(props.scores.map((score) => [score.assessmentItemId, score])),
);

const getPoint = (index: number, valueRatio: number) => {
  const angle = (Math.PI * 2 * index) / props.items.length - Math.PI / 2;
  const pointRadius = radius * valueRatio;

  return {
    x: center + Math.cos(angle) * pointRadius,
    y: center + Math.sin(angle) * pointRadius,
  };
};

const getPolygonPoints = (ratio: number) =>
  props.items
    .map((_, index) => {
      const point = getPoint(index, ratio);
      return `${point.x},${point.y}`;
    })
    .join(" ");

const gridPolygons = computed(() =>
  [0.25, 0.5, 0.75, 1].map((ratio) => getPolygonPoints(ratio)),
);

const valuePoints = computed(() =>
  props.items
    .map((item, index) => {
      const score = scoreByItemId.value.get(item.id)?.score ?? 0;
      const ratio = Math.max(0, Math.min(1, score / item.maxScore));
      const point = getPoint(index, ratio);

      return `${point.x},${point.y}`;
    })
    .join(" "),
);

const minimumPoints = computed(() =>
  props.items
    .map((item, index) => {
      const ratio = Math.max(0, Math.min(1, props.minimumScore / item.maxScore));
      const point = getPoint(index, ratio);

      return `${point.x},${point.y}`;
    })
    .join(" "),
);

const axisLines = computed(() =>
  props.items.map((_, index) => {
    const point = getPoint(index, 1);
    return { x1: center, y1: center, x2: point.x, y2: point.y };
  }),
);

const labels = computed(() =>
  props.items.map((item, index) => {
    const point = getPoint(index, 1.32);
    const score = scoreByItemId.value.get(item.id)?.score ?? 0;
    const axisPoint = getPoint(index, 1);
    const xOffset = point.x - center;

    return {
      id: item.id,
      label: item.label,
      score,
      maxScore: item.maxScore,
      x: point.x,
      y: point.y,
      axisX: axisPoint.x,
      axisY: axisPoint.y,
      textAnchor:
        Math.abs(xOffset) < 16 ? "middle" : xOffset > 0 ? "start" : "end",
    };
  }),
);

const scorePoints = computed(() =>
  props.items.map((item, index) => {
    const score = scoreByItemId.value.get(item.id)?.score ?? 0;
    const ratio = Math.max(0, Math.min(1, score / item.maxScore));
    const point = getPoint(index, ratio);

    return {
      id: item.id,
      x: point.x,
      y: point.y,
    };
  }),
);

const getShortLabel = (label: string) => {
  if (label.length <= 16) return label;

  return `${label.slice(0, 15)}...`;
};
</script>

<template>
  <div class="rounded-lg border bg-card p-4 text-card-foreground">
    <div class="mb-2">
      <h3 class="text-sm font-semibold leading-none text-foreground">
        Radar Penilaian
      </h3>
      <p class="mt-1 text-xs text-muted-foreground">
        Minimum {{ minimumScore }}
      </p>
    </div>

    <div v-if="items.length > 0" class="flex justify-center">
      <svg
        :viewBox="`0 0 ${size} ${size}`"
        class="h-[300px] w-full max-w-[360px]"
        role="img"
        aria-label="Radar hasil penilaian"
      >
        <polygon
          v-for="points in gridPolygons"
          :key="points"
          :points="points"
          fill="none"
          stroke="var(--border)"
          stroke-width="1"
        />
        <line
          v-for="line in axisLines"
          :key="`${line.x2}-${line.y2}`"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          stroke="var(--border)"
          stroke-width="1"
        />
        <polygon
          :points="minimumPoints"
          fill="var(--chart-2)"
          fill-opacity="0.18"
          stroke="var(--chart-2)"
          stroke-opacity="0.35"
          stroke-width="1"
        />
        <polygon
          :points="valuePoints"
          fill="var(--chart-1)"
          fill-opacity="0.82"
          stroke="var(--chart-1)"
          stroke-width="1.5"
        />
        <circle
          v-for="point in scorePoints"
          :key="`${point.id}-point`"
          :cx="point.x"
          :cy="point.y"
          r="3"
          fill="var(--chart-1)"
          stroke="var(--background)"
          stroke-width="2"
        />
        <text
          v-for="label in labels"
          :key="label.id"
          :x="label.x"
          :y="label.y"
          :text-anchor="label.textAnchor"
          dominant-baseline="middle"
          class="fill-foreground text-[12px]"
        >
          <tspan
            :x="label.x"
            dy="-0.35em"
            class="font-semibold"
          >
            {{ label.score }}/{{ label.maxScore }}
          </tspan>
          <tspan
            :x="label.x"
            dy="1.15em"
            class="fill-muted-foreground text-[11px]"
          >
            {{ getShortLabel(label.label) }}
          </tspan>
        </text>
      </svg>
    </div>
  </div>
</template>
