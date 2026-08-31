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

    plugins: {
      legend: {
        labels: {
          font: activeFont,

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
      },

      tooltip: {
        yAlign: 'center',

        callbacks: {
          label:
            tooltipItem => {
              const datasetLabel =
                tooltipItem
                  .dataset
                  .label as string

              const totalAmount =
                originalDatasets[
                  id
                ][
                  datasetLabel
                ].data[
                  tooltipItem
                    .dataIndex
                ]

              const percentage =
                (
                  Number(
                    tooltipItem.raw,
                  ) *
                  100
                ).toFixed(2) +
                '%'

              return `${datasetLabel}: ${percentage} (${totalAmount})`
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

        color: 'black',

        clip: true,
        clamp: true,

        font:
          activeFont,

        formatter: (
          value,
          context,
        ) => {
          const datasetLabel =
            context
              .dataset
              .label as string

          const barsAmount =
            originalDatasets[
              id
            ][
              datasetLabel
            ].data.length

          const totalAmount =
            originalDatasets[
              id
            ][
              datasetLabel
            ].data[
              context
                .dataIndex
            ]

          let label =
            datasetLabel

          if (
            label.length >=
            80 / barsAmount
          ) {
            const insertIndex =
              label.indexOf('/') + 1

            if (
              insertIndex > 0
            ) {
              if (
                Number(value) <
                .06
              ) {
                label =
                  label.slice(
                    0,
                    insertIndex - 1,
                  ) +
                  '…'
              } else {
                label =
                  label.slice(
                    0,
                    insertIndex,
                  ) +
                  '\n' +
                  label.slice(
                    insertIndex,
                  )
              }
            }
          }

          const roundedPercentageValue =
            tiny
              ? Math.round(
                  Number(value) *
                  100,
                )
              : (
                  Math.round(
                    Number(value) *
                    100 *
                    100,
                  ) /
                  100
                )

          const percentage =
            roundedPercentageValue +
            '%'

          if (
            !value ||
            Number(value) < .01
          ) {
            return ''
          }

          if (
            tiny ||
            Number(value) < .05
          ) {
            return percentage
          }

          if (
            Number(value) < .10
          ) {
            return (
              label +
              '\n' +
              percentage
            )
          }

          return (
            label +
            '\n' +
            percentage +
            '\n' +
            totalAmount
          )
        },
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

      ticks: {
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

            return (
              month.substring(
                0,
                3,
              ) +
              " '" +
              year.substring(
                2,
                4,
              )
            )
          }

          return this
            .getLabelForValue(
              value,
            )
        },

        minRotation:
          tiny
            ? 90
            : 0,

        maxRotation:
          90,

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

      ticks: {
        display: !tiny,

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

        this.height += 8
      }
  },
}

export const plugins:
  Plugin[] = [
    legendSpacingPlugin,
  ]