import type {
  Chart,
  ChartOptions,
  Plugin,
} from 'chart.js'

import type {
  CensusLinePoint,
} from './getLineChartData'

import {
  CensusTimelinePoint,
  formatCensusTick,
} from './censusTimeline'

const font = {
  family:
    'Fraunces',

  size:
    15,
}

const tinyFont = {
  family:
    'Fraunces',

  size:
    11,
}

const compactNumber =
  new Intl.NumberFormat(
    'en-US',
    {
      notation:
        'compact',

      maximumFractionDigits:
        1,
    },
  )

const fullNumber =
  new Intl.NumberFormat(
    'en-US',
  )

/*
 * Legend-focus state belongs
 * to each individual Chart.js
 * instance.
 */
const focusedDataset =
  new WeakMap<
    Chart<'line'>,
    number | null
  >()

const originalColors =
  new WeakMap<
    Chart<'line'>,
    string[]
  >()

const mutedColor =
  'rgba(130, 130, 130, .32)'

/*
 * The reveal animation is deliberately
 * independent from Chart.js animations.
 *
 * Chart.js may redraw/update because of
 * tooltips, pointer interaction, legend
 * interaction, resizing, etc.
 *
 * None of those should replay the
 * entrance animation.
 */
interface RevealableChart
  extends Chart<'line'> {
  $lineRevealProgress?:
    number

  $lineRevealStarted?:
    boolean

  $lineRevealComplete?:
    boolean

  $lineRevealClip?:
    boolean

  $lineRevealFrame?:
    number
}

const REVEAL_DURATION =
  1050

const easeOutQuart = (
  progress:
    number,
) =>
  1 -
  Math.pow(
    1 - progress,
    4,
  )

const startReveal = (
  chart:
    RevealableChart,
) => {
  if (
    chart.$lineRevealStarted
  ) {
    return
  }

  chart.$lineRevealStarted =
    true

  chart.$lineRevealComplete =
    false

  chart.$lineRevealProgress =
    0

  const startTime =
    performance.now()

  const frame = (
    currentTime:
      number,
  ) => {
    /*
     * Chart may have been destroyed
     * while the animation was running.
     */
    if (
      chart.$lineRevealComplete
    ) {
      return
    }

    const elapsed =
      currentTime -
      startTime

    const rawProgress =
      Math.min(
        1,
        elapsed /
          REVEAL_DURATION,
      )

    chart.$lineRevealProgress =
      easeOutQuart(
        rawProgress,
      )

    /*
     * draw(), rather than update(),
     * is important here.
     *
     * update() would re-run Chart.js
     * state machinery. We only need
     * another paint of the exact same
     * graph.
     */
    chart.draw()

    if (
      rawProgress <
      1
    ) {
      chart.$lineRevealFrame =
        requestAnimationFrame(
          frame,
        )

      return
    }

    chart.$lineRevealProgress =
      1

    chart.$lineRevealComplete =
      true

    chart.$lineRevealFrame =
      undefined

    chart.draw()
  }

  chart.$lineRevealFrame =
    requestAnimationFrame(
      frame,
    )
}

const lineRevealPlugin:
  Plugin<'line'> = {
  id:
    'lineRevealPlugin',

  beforeInit(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart

    revealChart
      .$lineRevealProgress =
      0

    revealChart
      .$lineRevealStarted =
      false

    revealChart
      .$lineRevealComplete =
      false
  },

  /*
   * afterRender happens once the
   * initial axes/legend/chart layout
   * are ready.
   *
   * The started flag guarantees that
   * later renders caused by tapping,
   * tooltips, resizing, or legend
   * interactions do not restart it.
   */
  afterRender(
    chart,
  ) {
    startReveal(
      chart as
        RevealableChart,
    )
  },

  beforeDatasetsDraw(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart

    const {
      chartArea,
      ctx,
    } = chart

    if (
      !chartArea
    ) {
      return
    }

    const progress =
      revealChart
        .$lineRevealProgress ??
      0

    const width =
      (
        chartArea.right -
        chartArea.left
      ) *
      progress

    ctx.save()

    ctx.beginPath()

    ctx.rect(
      chartArea.left,
      chartArea.top,
      width,
      chartArea.bottom -
        chartArea.top,
    )

    ctx.clip()

    revealChart
      .$lineRevealClip =
      true
  },

  afterDatasetsDraw(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart

    if (
      !revealChart
        .$lineRevealClip
    ) {
      return
    }

    chart.ctx.restore()

    revealChart
      .$lineRevealClip =
      false
  },

  beforeDestroy(
    chart,
  ) {
    const revealChart =
      chart as
        RevealableChart

    /*
     * Mark complete first so a frame
     * already queued cannot continue.
     */
    revealChart
      .$lineRevealComplete =
      true

    if (
      revealChart
        .$lineRevealFrame !==
      undefined
    ) {
      cancelAnimationFrame(
        revealChart
          .$lineRevealFrame,
      )

      revealChart
        .$lineRevealFrame =
        undefined
    }
  },
}

const focusLine = (
  chart:
    Chart<'line'>,

  datasetIndex:
    number,
) => {
  let colors =
    originalColors.get(
      chart,
    )

  if (!colors) {
    colors =
      chart.data
        .datasets
        .map(
          dataset =>
            typeof (
              dataset
                .borderColor
            ) === 'string'
              ? dataset
                  .borderColor
              : '#fff',
        )

    originalColors.set(
      chart,
      colors,
    )
  }

  const current =
    focusedDataset.get(
      chart,
    ) ??
    null

  const next =
    current ===
      datasetIndex
      ? null
      : datasetIndex

  focusedDataset.set(
    chart,
    next,
  )

  chart.data
    .datasets
    .forEach(
      (
        dataset,
        index,
      ) => {
        const selected =
          next === null ||
          index === next

        const color =
          selected
            ? colors![index]
            : mutedColor

        /*
         * backgroundColor intentionally
         * stays untouched.
         *
         * Its gradient callback reads
         * borderColor, so changing the
         * line color automatically also
         * changes its area shading.
         */
        dataset.borderColor =
          color

        dataset.pointBackgroundColor =
          color

        dataset.pointBorderColor =
          selected
            ? '#111'
            : mutedColor

        if (
          next === null
        ) {
          dataset.borderWidth =
            3

          dataset.pointRadius =
            4

          dataset.pointHoverRadius =
            6
        } else if (
          index === next
        ) {
          dataset.borderWidth =
            4

          dataset.pointRadius =
            5

          dataset.pointHoverRadius =
            7
        } else {
          dataset.borderWidth =
            2

          dataset.pointRadius =
            3

          dataset.pointHoverRadius =
            5
        }
      },
    )

  /*
   * No Chart.js animation and,
   * importantly, no entrance reveal.
   */
  chart.update(
    'none',
  )
}

export const linePlugins:
  Plugin<'line'>[] = [
    lineRevealPlugin,
  ]

export const lineChartOptions = (
  tiny:
    boolean,

  timeline:
    CensusTimelinePoint[],
): ChartOptions<'line'> => {
  const activeFont =
    tiny
      ? tinyFont
      : font

  const firstTimestamp =
    timeline[0]
      ?.timestamp ??
    0

  const lastTimestamp =
    timeline[
      timeline.length -
      1
    ]?.timestamp ??
    firstTimestamp

  return {
    responsive:
      true,

    maintainAspectRatio:
      false,

    normalized:
      true,

    /*
     * Do not use Chart.js's general
     * animation engine for the line
     * entrance.
     *
     * Touch/tooltip/interaction updates
     * can run through that engine too.
     * Our custom plugin owns entrance
     * animation instead.
     */
    animation:
      false,

    interaction: {
      mode:
        'nearest',

      intersect:
        false,

      axis:
        'xy',
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
              .datasetIndex

          if (
            index ===
            undefined
          ) {
            return
          }

          focusLine(
            legend.chart as
              Chart<'line'>,

            index,
          )
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
              items[0]

            if (!first) {
              return ''
            }

            const point =
              first.raw as
                CensusLinePoint

            return (
              point.dateLabel
            )
          },

          label(
            context,
          ) {
            const point =
              context.raw as
                CensusLinePoint

            const label =
              context
                .dataset
                .label ??
              'Data'

            return (
              `${label}: ` +
              fullNumber
                .format(
                  point.y,
                )
            )
          },

          afterLabel(
            context,
          ) {
            const point =
              context.raw as
                CensusLinePoint

            if (
              point.observed
            ) {
              return ''
            }

            return (
              'Not measured in this census'
            )
          },
        },
      },
    },

    elements: {
      line: {
        tension:
          .35,
      },
    },

    scales: {
      x: {
        type:
          'linear',

        min:
          firstTimestamp,

        max:
          lastTimestamp,

        bounds:
          'ticks',

        offset:
          false,

        afterBuildTicks(
          scale,
        ) {
          scale.ticks =
            timeline.map(
              point => ({
                value:
                  point.timestamp,
              }),
            )
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
            )
          },
        },

        grid: {
          color:
            'rgba(255, 255, 255, .06)',
        },
      },

      y: {
        type:
          'linear',

        beginAtZero:
          true,

        grace:
          '8%',

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
              )
          },
        },

        grid: {
          color:
            'rgba(255, 255, 255, .07)',
        },
      },
    },
  }
}