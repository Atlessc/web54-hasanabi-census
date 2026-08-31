import type {
  Chart,
  ChartOptions,
  Plugin,
} from "chart.js";

import type {
  CensusLinePoint,
} from "./getLineChartData";

import {
  CensusTimelinePoint,
  formatCensusTick,
} from "./censusTimeline";

const font = {
  family: "Fraunces",
  size: 15,
};

const tinyFont = {
  family: "Fraunces",
  size: 11,
};

const compactNumber =
  new Intl.NumberFormat(
    "en-US",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    },
  );

const fullNumber =
  new Intl.NumberFormat(
    "en-US",
  );

/*
 * --------------------------------------------------
 * LINE-RELATIVE FADE
 * --------------------------------------------------
 *
 * Every dataset gets its own fade.
 *
 * SHADE_DEPTH:
 *   How many CSS pixels below EACH
 *   individual line the fade extends.
 *
 * SHADE_TOP_OPACITY:
 *   Opacity directly underneath
 *   that individual line.
 *
 * The fade is mathematically linear:
 *
 * 0px below line        = 18%
 * 30px below line       = 13.5%
 * 60px below line       = 9%
 * 90px below line       = 4.5%
 * 120px below line      = 0%
 */

const SHADE_DEPTH =
  120;

const SHADE_TOP_OPACITY =
  0.18;

/*
 * --------------------------------------------------
 * LEGEND FOCUS
 * --------------------------------------------------
 */

const focusedDataset =
  new WeakMap<
    Chart<"line">,
    number | null
  >();

const originalColors =
  new WeakMap<
    Chart<"line">,
    string[]
  >();

const mutedColor =
  "rgba(130, 130, 130, .32)";

/*
 * --------------------------------------------------
 * REVEAL ANIMATION
 * --------------------------------------------------
 *
 * This animation remains completely
 * separate from Chart.js animation.
 *
 * Therefore:
 *
 * - touching the graph
 * - displaying a tooltip
 * - clicking the legend
 * - resizing
 *
 * cannot replay the entrance.
 */

interface RevealableChart
  extends Chart<"line"> {
  $lineRevealProgress?: number;

  $lineRevealStarted?: boolean;

  $lineRevealComplete?: boolean;

  $lineRevealClip?: boolean;

  $lineRevealFrame?: number;
}

const REVEAL_DURATION =
  1050;

const easeOutQuart = (
  progress: number,
) =>
  1 -
  Math.pow(
    1 - progress,
    4,
  );

const startReveal = (
  chart:
    RevealableChart,
) => {
  if (
    chart.$lineRevealStarted
  ) {
    return;
  }

  chart.$lineRevealStarted =
    true;

  chart.$lineRevealComplete =
    false;

  chart.$lineRevealProgress =
    0;

  const startTime =
    performance.now();

  const frame = (
    currentTime:
      number,
  ) => {
    if (
      chart.$lineRevealComplete
    ) {
      return;
    }

    const elapsed =
      currentTime -
      startTime;

    const rawProgress =
      Math.min(
        1,
        elapsed /
          REVEAL_DURATION,
      );

    chart.$lineRevealProgress =
      easeOutQuart(
        rawProgress,
      );

    /*
     * Repaint only.
     */
    chart.draw();

    if (
      rawProgress <
      1
    ) {
      chart.$lineRevealFrame =
        requestAnimationFrame(
          frame,
        );

      return;
    }

    chart.$lineRevealProgress =
      1;

    chart.$lineRevealComplete =
      true;

    chart.$lineRevealFrame =
      undefined;

    chart.draw();
  };

  chart.$lineRevealFrame =
    requestAnimationFrame(
      frame,
    );
};

const lineRevealPlugin:
  Plugin<"line"> = {
  id:
    "lineRevealPlugin",

  beforeInit(chart) {
    const revealChart =
      chart as
        RevealableChart;

    revealChart
      .$lineRevealProgress =
      0;

    revealChart
      .$lineRevealStarted =
      false;

    revealChart
      .$lineRevealComplete =
      false;
  },

  afterRender(chart) {
    startReveal(
      chart as
        RevealableChart,
    );
  },

  beforeDatasetsDraw(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart;

    const {
      chartArea,
      ctx,
    } = chart;

    if (
      !chartArea
    ) {
      return;
    }

    const progress =
      revealChart
        .$lineRevealProgress ??
      0;

    const width =
      (
        chartArea.right -
        chartArea.left
      ) *
      progress;

    ctx.save();

    ctx.beginPath();

    ctx.rect(
      chartArea.left,
      chartArea.top,
      width,
      chartArea.bottom -
        chartArea.top,
    );

    ctx.clip();

    revealChart
      .$lineRevealClip =
      true;
  },

  afterDatasetsDraw(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart;

    if (
      !revealChart
        .$lineRevealClip
    ) {
      return;
    }

    chart.ctx.restore();

    revealChart
      .$lineRevealClip =
      false;
  },

  beforeDestroy(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart;

    revealChart
      .$lineRevealComplete =
      true;

    if (
      revealChart
        .$lineRevealFrame !==
      undefined
    ) {
      cancelAnimationFrame(
        revealChart
          .$lineRevealFrame,
      );

      revealChart
        .$lineRevealFrame =
        undefined;
    }
  },
};

/*
 * --------------------------------------------------
 * CURVE INTERPOLATION
 * --------------------------------------------------
 *
 * Chart.js already calculated the
 * actual rendered Bezier curve.
 *
 * We ask that curve:
 *
 * "At this exact X coordinate,
 * what is your Y coordinate?"
 *
 * That lets the fade follow the
 * rendered curve itself instead of
 * approximating it between nodes.
 */

interface CurvePoint {
  x: number;
  y: number;
}

interface InterpolatableLine {
  interpolate(
    point:
      CurvePoint,

    property:
      "x" | "y",
  ):
    | CurvePoint
    | CurvePoint[]
    | undefined;
}

const getCurvePoint = (
  line:
    InterpolatableLine,

  x:
    number,
):
  CurvePoint |
  undefined => {
  const result =
    line.interpolate(
      {
        x,
        y: 0,
      },
      "x",
    );

  if (
    !result
  ) {
    return undefined;
  }

  if (
    Array.isArray(
      result,
    )
  ) {
    return result[0];
  }

  return result;
};

/*
 * --------------------------------------------------
 * COLOR PARSING
 * --------------------------------------------------
 */

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const parseColor = (
  color:
    string,
): ParsedColor => {
  const normalized =
    color.trim();

  if (
    normalized.startsWith(
      "#",
    )
  ) {
    let hex =
      normalized.slice(
        1,
      );

    if (
      hex.length ===
      3
    ) {
      hex =
        hex
          .split("")
          .map(
            character =>
              character +
              character,
          )
          .join("");
    }

    if (
      hex.length ===
      6
    ) {
      return {
        r:
          Number.parseInt(
            hex.slice(
              0,
              2,
            ),
            16,
          ),

        g:
          Number.parseInt(
            hex.slice(
              2,
              4,
            ),
            16,
          ),

        b:
          Number.parseInt(
            hex.slice(
              4,
              6,
            ),
            16,
          ),

        a:
          1,
      };
    }
  }

  const rgbMatch =
    normalized.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
    );

  if (
    rgbMatch
  ) {
    return {
      r:
        Number(
          rgbMatch[1],
        ),

      g:
        Number(
          rgbMatch[2],
        ),

      b:
        Number(
          rgbMatch[3],
        ),

      a:
        rgbMatch[4] ===
          undefined
          ? 1
          : Number(
              rgbMatch[4],
            ),
    };
  }

  /*
   * Safe fallback.
   */
  return {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  };
};

/*
 * --------------------------------------------------
 * ALPHA COMPOSITING
 * --------------------------------------------------
 *
 * Multiple line-relative fades may
 * genuinely occupy the same pixel.
 *
 * Instead of one replacing another,
 * composite them normally.
 */

const compositePixel = (
  pixels:
    Uint8ClampedArray,

  index:
    number,

  sourceColor:
    ParsedColor,

  sourceAlpha:
    number,
) => {
  if (
    sourceAlpha <=
    0
  ) {
    return;
  }

  const destinationAlpha =
    pixels[
      index + 3
    ] /
    255;

  const sourceA =
    Math.min(
      1,
      Math.max(
        0,
        sourceAlpha,
      ),
    );

  const outputAlpha =
    sourceA +
    destinationAlpha *
      (
        1 -
        sourceA
      );

  if (
    outputAlpha <=
    0
  ) {
    return;
  }

  const destinationR =
    pixels[index];

  const destinationG =
    pixels[
      index + 1
    ];

  const destinationB =
    pixels[
      index + 2
    ];

  const sourceContribution =
    sourceA /
    outputAlpha;

  const destinationContribution =
    (
      destinationAlpha *
      (
        1 -
        sourceA
      )
    ) /
    outputAlpha;

  pixels[index] =
    Math.round(
      sourceColor.r *
        sourceContribution +
      destinationR *
        destinationContribution,
    );

  pixels[
    index + 1
  ] =
    Math.round(
      sourceColor.g *
        sourceContribution +
      destinationG *
        destinationContribution,
    );

  pixels[
    index + 2
  ] =
    Math.round(
      sourceColor.b *
        sourceContribution +
      destinationB *
        destinationContribution,
    );

  pixels[
    index + 3
  ] =
    Math.round(
      outputAlpha *
        255,
    );
};

/*
 * --------------------------------------------------
 * SHADE CACHE
 * --------------------------------------------------
 *
 * All line fades are rendered into
 * ONE transparent offscreen canvas.
 *
 * We build it once.
 *
 * The reveal animation then only
 * repaints the cached canvas.
 */

interface ShadeCacheEntry {
  key: string;

  canvas:
    HTMLCanvasElement;
}

const shadeCache =
  new WeakMap<
    Chart<"line">,
    ShadeCacheEntry
  >();

/*
 * --------------------------------------------------
 * BUILD THE TRUE LINE-RELATIVE FADE
 * --------------------------------------------------
 */

const buildShadeCanvas = (
  chart:
    Chart<"line">,
):
  HTMLCanvasElement => {
  const {
    chartArea,
  } = chart;

  const dpr =
    chart
      .currentDevicePixelRatio ||
    1;

  /*
   * Only allocate pixels for the
   * graph plotting area.
   *
   * We do not need a canvas the
   * size of the whole component.
   */
  const logicalWidth =
    Math.max(
      1,
      chartArea.right -
        chartArea.left,
    );

  const logicalHeight =
    Math.max(
      1,
      chartArea.bottom -
        chartArea.top,
    );

  const physicalWidth =
    Math.max(
      1,
      Math.ceil(
        logicalWidth *
          dpr,
      ),
    );

  const physicalHeight =
    Math.max(
      1,
      Math.ceil(
        logicalHeight *
          dpr,
      ),
    );

  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    physicalWidth;

  canvas.height =
    physicalHeight;

  const context =
    canvas.getContext(
      "2d",
    );

  if (
    !context
  ) {
    return canvas;
  }

  const imageData =
    context.createImageData(
      physicalWidth,
      physicalHeight,
    );

  const pixels =
    imageData.data;

  chart.data.datasets
    .forEach(
      (
        dataset,
        datasetIndex,
      ) => {
        const meta =
          chart.getDatasetMeta(
            datasetIndex,
          );

        if (
          meta.hidden ||
          !meta.dataset
        ) {
          return;
        }

        const colorString =
          typeof (
            dataset
              .borderColor
          ) === "string"
            ? dataset
                .borderColor
            : "#fff";

        const color =
          parseColor(
            colorString,
          );

        const line =
          meta.dataset as
            unknown as
            InterpolatableLine;

        /*
         * Work at the actual physical
         * canvas pixel resolution.
         *
         * This is important.
         *
         * We do NOT repeat one logical
         * X sample across multiple
         * device pixels.
         *
         * That was the cause of the
         * previous vertical striping.
         */
        for (
          let physicalX =
            0;

          physicalX <
            physicalWidth;

          physicalX +=
            1
        ) {
          const logicalX =
            chartArea.left +
            (
              physicalX +
              0.5
            ) /
              dpr;

          const curvePoint =
            getCurvePoint(
              line,
              logicalX,
            );

          if (
            !curvePoint ||
            !Number.isFinite(
              curvePoint.y,
            )
          ) {
            continue;
          }

          if (
            curvePoint.y <
              chartArea.top ||
            curvePoint.y >
              chartArea.bottom
          ) {
            continue;
          }

          /*
           * Convert the rendered curve
           * Y coordinate into this
           * offscreen canvas's local
           * physical pixel space.
           */
          const curvePhysicalY =
            (
              curvePoint.y -
              chartArea.top
            ) *
            dpr;

          const depthPhysical =
            SHADE_DEPTH *
            dpr;

          const startPhysicalY =
            Math.max(
              0,
              Math.floor(
                curvePhysicalY,
              ),
            );

          const endPhysicalY =
            Math.min(
              physicalHeight -
                1,

              Math.ceil(
                curvePhysicalY +
                  depthPhysical,
              ),
            );

          for (
            let physicalY =
              startPhysicalY;

            physicalY <=
              endPhysicalY;

            physicalY +=
              1
          ) {
            const distancePhysical =
              (
                physicalY +
                0.5
              ) -
              curvePhysicalY;

            /*
             * Slightly above the curve
             * due to pixel rounding.
             */
            if (
              distancePhysical <
              0
            ) {
              continue;
            }

            const distanceLogical =
              distancePhysical /
              dpr;

            if (
              distanceLogical >
              SHADE_DEPTH
            ) {
              continue;
            }

            /*
             * EXACTLY LINEAR.
             *
             * At the line:
             * fade = 1
             *
             * Halfway down:
             * fade = .5
             *
             * At SHADE_DEPTH:
             * fade = 0
             */
            const fade =
              1 -
              distanceLogical /
                SHADE_DEPTH;

            const sourceAlpha =
              color.a *
              SHADE_TOP_OPACITY *
              Math.max(
                0,
                fade,
              );

            const pixelIndex =
              (
                physicalY *
                  physicalWidth +
                physicalX
              ) *
              4;

            compositePixel(
              pixels,
              pixelIndex,
              color,
              sourceAlpha,
            );
          }
        }
      },
    );

  /*
   * One pixel-buffer write.
   *
   * No strokes.
   * No copied curves.
   * No gradient rectangles.
   * No blur.
   */
  context.putImageData(
    imageData,
    0,
    0,
  );

  return canvas;
};

const getShadeCanvas = (
  chart:
    Chart<"line">,
):
  HTMLCanvasElement => {
  const {
    chartArea,
  } = chart;

  const colorSignature =
    chart.data.datasets
      .map(
        dataset =>
          typeof (
            dataset
              .borderColor
          ) === "string"
            ? dataset
                .borderColor
            : "#fff",
      )
      .join(",");

  const key =
    [
      chart.width,
      chart.height,

      chart
        .currentDevicePixelRatio,

      chartArea.left,
      chartArea.top,
      chartArea.right,
      chartArea.bottom,

      colorSignature,

      SHADE_DEPTH,
      SHADE_TOP_OPACITY,
    ].join(
      "|",
    );

  const existing =
    shadeCache.get(
      chart,
    );

  if (
    existing &&
    existing.key ===
      key
  ) {
    return existing
      .canvas;
  }

  const canvas =
    buildShadeCanvas(
      chart,
    );

  shadeCache.set(
    chart,
    {
      key,
      canvas,
    },
  );

  return canvas;
};

/*
 * --------------------------------------------------
 * LINE SHADE PLUGIN
 * --------------------------------------------------
 */

const lineShadePlugin:
  Plugin<"line"> = {
  id:
    "lineShadePlugin",

  beforeDatasetsDraw(
    chart,
  ) {
    const {
      ctx,
      chartArea,
    } = chart;

    if (
      !chartArea
    ) {
      return;
    }

    const canvas =
      getShadeCanvas(
        chart,
      );

    ctx.save();

    /*
     * Chart area clipping.
     */
    ctx.beginPath();

    ctx.rect(
      chartArea.left,
      chartArea.top,
      chartArea.right -
        chartArea.left,
      chartArea.bottom -
        chartArea.top,
    );

    ctx.clip();

    /*
     * Offscreen shade canvas is
     * device-pixel-resolution.
     *
     * Scale it into the exact
     * logical Chart.js plot area.
     */
    ctx.drawImage(
      canvas,

      0,
      0,
      canvas.width,
      canvas.height,

      chartArea.left,
      chartArea.top,

      chartArea.right -
        chartArea.left,

      chartArea.bottom -
        chartArea.top,
    );

    ctx.restore();
  },

  beforeDestroy(
    chart,
  ) {
    shadeCache.delete(
      chart,
    );
  },
};

/*
 * --------------------------------------------------
 * LEGEND INTERACTION
 * --------------------------------------------------
 */

const focusLine = (
  chart:
    Chart<"line">,

  datasetIndex:
    number,
) => {
  let colors =
    originalColors.get(
      chart,
    );

  if (
    !colors
  ) {
    colors =
      chart.data.datasets
        .map(
          dataset =>
            typeof (
              dataset
                .borderColor
            ) === "string"
              ? dataset
                  .borderColor
              : "#fff",
        );

    originalColors.set(
      chart,
      colors,
    );
  }

  const current =
    focusedDataset.get(
      chart,
    ) ??
    null;

  const next =
    current ===
      datasetIndex
      ? null
      : datasetIndex;

  focusedDataset.set(
    chart,
    next,
  );

  chart.data.datasets
    .forEach(
      (
        dataset,
        index,
      ) => {
        const selected =
          next === null ||
          index === next;

        const color =
          selected
            ? colors![index]
            : mutedColor;

        dataset.borderColor =
          color;

        dataset.backgroundColor =
          color;

        dataset.pointBackgroundColor =
          color;

        dataset.pointBorderColor =
          selected
            ? "#111"
            : mutedColor;

        if (
          next === null
        ) {
          dataset.borderWidth =
            3;

          dataset.pointRadius =
            4;

          dataset.pointHoverRadius =
            6;
        } else if (
          index === next
        ) {
          dataset.borderWidth =
            4;

          dataset.pointRadius =
            5;

          dataset.pointHoverRadius =
            7;
        } else {
          dataset.borderWidth =
            2;

          dataset.pointRadius =
            3;

          dataset.pointHoverRadius =
            5;
        }
      },
    );

  /*
   * colorSignature in the shade
   * cache key changes automatically,
   * so the fade is regenerated with
   * the focused/grey colors.
   */
  chart.update(
    "none",
  );
};

/*
 * ORDER MATTERS.
 *
 * 1. Reveal establishes the
 *    left-to-right clip.
 *
 * 2. Shade paints inside it.
 *
 * 3. Chart.js paints the crisp
 *    lines and nodes afterward.
 */

export const linePlugins:
  Plugin<"line">[] = [
    lineRevealPlugin,
    lineShadePlugin,
  ];

/*
 * --------------------------------------------------
 * CHART OPTIONS
 * --------------------------------------------------
 */

export const lineChartOptions = (
  tiny:
    boolean,

  timeline:
    CensusTimelinePoint[],
): ChartOptions<"line"> => {
  const activeFont =
    tiny
      ? tinyFont
      : font;

  const firstTimestamp =
    timeline[0]
      ?.timestamp ??
    0;

  const lastTimestamp =
    timeline[
      timeline.length -
      1
    ]?.timestamp ??
    firstTimestamp;

  return {
    responsive:
      true,

    maintainAspectRatio:
      false,

    normalized:
      true,

    /*
     * Our reveal plugin handles
     * the only entrance animation.
     */
    animation:
      false,

    interaction: {
      mode:
        "nearest",

      intersect:
        false,

      axis:
        "xy",
    },

    plugins: {
      datalabels: {
        display:
          false,
      },

      legend: {
        labels: {
          font:
            activeFont,

          boxWidth:
            tiny
              ? 18
              : 40,

          boxHeight:
            tiny
              ? 9
              : 12,

          padding:
            tiny
              ? 8
              : 10,
        },

        onClick(
          _event,
          legendItem,
          legend,
        ) {
          const index =
            legendItem
              .datasetIndex;

          if (
            index ===
            undefined
          ) {
            return;
          }

          focusLine(
            legend.chart as
              Chart<"line">,

            index,
          );
        },
      },

      tooltip: {
        titleFont:
          activeFont,

        bodyFont:
          activeFont,

        footerFont:
          activeFont,

        callbacks: {
          title(
            items,
          ) {
            const first =
              items[0];

            if (
              !first
            ) {
              return "";
            }

            const point =
              first.raw as
                CensusLinePoint;

            return (
              point.dateLabel
            );
          },

          label(
            context,
          ) {
            const point =
              context.raw as
                CensusLinePoint;

            const label =
              context
                .dataset
                .label ??
              "Data";

            return (
              `${label}: ` +
              fullNumber
                .format(
                  point.y,
                )
            );
          },

          afterLabel(
            context,
          ) {
            const point =
              context.raw as
                CensusLinePoint;

            if (
              point.observed
            ) {
              return "";
            }

            return (
              "Not measured in this census"
            );
          },
        },
      },
    },

    elements: {
      line: {
        tension:
          0.35,
      },
    },

    scales: {
      x: {
        type:
          "linear",

        min:
          firstTimestamp,

        max:
          lastTimestamp,

        bounds:
          "ticks",

        offset:
          false,

        /*
         * Only census dates get ticks,
         * but their X positions still
         * reflect actual elapsed time.
         */
        afterBuildTicks(
          scale,
        ) {
          scale.ticks =
            timeline.map(
              point => ({
                value:
                  point.timestamp,
              }),
            );
        },

        ticks: {
          autoSkip:
            false,

          minRotation:
            tiny
              ? 90
              : 0,

          maxRotation:
            tiny
              ? 90
              : 45,

          padding:
            4,

          font:
            activeFont,

          callback(
            value,
          ) {
            return formatCensusTick(
              Number(
                value,
              ),

              timeline,

              tiny,
            );
          },
        },

        grid: {
          color:
            "rgba(255, 255, 255, .06)",
        },
      },

      y: {
        type:
          "linear",

        beginAtZero:
          true,

        grace:
          "8%",

        ticks: {
          precision:
            0,

          font:
            activeFont,

          callback(
            value,
          ) {
            return compactNumber
              .format(
                Number(
                  value,
                ),
              );
          },
        },

        grid: {
          color:
            "rgba(255, 255, 255, .07)",
        },
      },
    },
  };
};