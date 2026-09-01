import type {
  ChartOptions,
  Plugin,
} from 'chart.js'

import {
  originalDatasets,
} from './utils'

const font = {
  family: 'Fraunces',
  size: 15,
}

const tinyFont = {
  family: 'Fraunces',
  size: 11,
}

const dataLabelFont = {
  family: 'Archivo',
  size: 12,
  weight: 'bold' as const,
}

const tinyDataLabelFont = {
  family: 'Archivo',
  size: 10,
  weight: 'bold' as const,
}

const fullNumber =
  new Intl.NumberFormat(
    'en-US',
  )

const formatPercentage = (
  value: number,
  tiny: boolean,
) => {
  const percentage =
    value * 100

  if (tiny) {
    return `${Math.round(percentage)}%`
  }

  return `${percentage.toFixed(
    percentage < 10
      ? 1
      : 0,
  )}%`
}

const readableTextColor = (
  backgroundColor: unknown,
) => {
  const color =
    Array.isArray(backgroundColor)
      ? backgroundColor[0]
      : backgroundColor

  if (
    typeof color !== 'string' ||
    !/^#[\da-f]{6}$/i.test(color)
  ) {
    return '#fff'
  }

  const red =
    Number.parseInt(
      color.slice(1, 3),
      16,
    )

  const green =
    Number.parseInt(
      color.slice(3, 5),
      16,
    )

  const blue =
    Number.parseInt(
      color.slice(5, 7),
      16,
    )

  const luminance =
    (
      red * 299 +
      green * 587 +
      blue * 114
    ) /
    1000

  return luminance > 155
    ? '#111'
    : '#fff'
}

export const common = (
  id: string,
  tiny: boolean,
): ChartOptions => {
  const activeFont =
    tiny
      ? tinyFont
      : font

  return {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: 'index',
    },

    layout: {
      padding: {
        top: 4,
        right: tiny ? 4 : 10,
        bottom: 0,
        left: tiny ? 4 : 10,
      },
    },

    plugins: {
      legend: {
        position: 'bottom',

        labels: {
          font: activeFont,

          color: '#d7d7d7',

          usePointStyle: true,
          pointStyle: 'rectRounded',

          boxWidth:
            tiny
              ? 9
              : 11,

          boxHeight:
            tiny
              ? 9
              : 11,

          padding:
            tiny
              ? 10
              : 14,
        },
      },

      tooltip: {
        backgroundColor:
          'rgba(15, 15, 15, .96)',

        borderColor:
          'rgba(255, 255, 255, .16)',

        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,

        callbacks: {
          label:
            tooltipItem => {
              const datasetLabel =
                tooltipItem
                  .dataset
                  .label as string

              const originalDataset =
                originalDatasets[
                  id
                ]?.[
                  datasetLabel
                ]

              const totalAmount =
                Number(
                  originalDataset
                    ?.data[
                      tooltipItem
                        .dataIndex
                    ] ??
                  0,
                )

              const percentage =
                formatPercentage(
                  Number(
                    tooltipItem.raw,
                  ),
                  false,
                )

              return (
                `${datasetLabel}: ` +
                `${percentage} · ` +
                fullNumber.format(
                  totalAmount,
                )
              )
            },
        },

        titleFont:
          activeFont,

        bodyFont:
          activeFont,

        footerFont:
          activeFont,
      },

      datalabels: {
        anchor: 'center',
        align: 'center',
        textAlign: 'center',

        color:
          context =>
            readableTextColor(
              context
                .dataset
                .backgroundColor,
            ),

        clip: true,
        clamp: true,

        display:
          context => {
            const value =
              Number(
                context
                  .dataset
                  .data[
                    context
                      .dataIndex
                  ],
              )

            return value >=
              (
                tiny
                  ? .12
                  : .065
              )
          },

        font:
          tiny
            ? tinyDataLabelFont
            : dataLabelFont,

        formatter:
          value =>
            formatPercentage(
              Number(value),
              tiny,
            ),
      },
    },
  }
}

export const stackedBarChart = (
  id: string,
  tiny: boolean = false,
): ChartOptions => ({
  ...common(
    id,
    tiny,
  ),

  scales: {
    x: {
      stacked: true,

      border: {
        color:
          'rgba(255, 255, 255, .16)',
      },

      grid: {
        display: false,
      },

      ticks: {
        autoSkip: false,
        color: '#b8b8b8',
        padding: 8,

        callback(
          value_:
            number |
            string,
        ) {
          const value =
            Number(value_)

          if (tiny) {
            const [
              month,
              year,
            ] =
              this
                .getLabelForValue(
                  value,
                )
                .split(' ')

            return [
              month.substring(
                0,
                3,
              ),
              `'${year.substring(
                2,
                4,
              )}`,
            ]
          }

          return this
            .getLabelForValue(
              value,
            )
        },

        minRotation: 0,
        maxRotation: 0,

        font:
          activeTickFont(
            tiny,
          ),
      },
    },

    y: {
      min: 0,
      max: 1,

      stacked: true,

      border: {
        display: false,
      },

      grid: {
        color:
          'rgba(255, 255, 255, .09)',
        drawTicks: false,
      },

      ticks: {
        color: '#969696',
        padding: 8,
        stepSize: .25,

        callback:
          value =>
            (
              Number(value) *
              100
            ) +
            '%',

        font:
          activeTickFont(
            tiny,
          ),
      },
    },
  },
})

const activeTickFont = (
  tiny: boolean,
) =>
  tiny
    ? tinyFont
    : font

const legendSpacingPlugin:
  Plugin = {
  id:
    'legendSpacingPlugin',

  beforeInit(chart) {
    if (!chart.legend) {
      return
    }

    const originalFit =
      chart.legend.fit

    chart.legend.fit =
      function fit() {
        originalFit
          .bind(
            chart.legend,
          )()

        this.height += 4
      }
  },
}

export const plugins:
  Plugin[] = [
    legendSpacingPlugin,
  ]
