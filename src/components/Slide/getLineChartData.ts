import {
  parse,
} from 'csv-parse/browser/esm/sync'

import type {
  ChartData,
  ChartDataset,
  ScriptableContext,
} from 'chart.js'

import {
  colors as defaultColors,
} from './colors'

import {
  CensusTimelinePoint,
  mergeCensusTimeline,
} from './censusTimeline'

export interface CensusLinePoint {
  x: number
  y: number

  dateLabel: string

  /*
   * false means this category did not
   * have a recorded value for this
   * census date.
   *
   * It is plotted at zero so all
   * datasets share the complete
   * historical census timeline.
   */
  observed: boolean
}

export interface CensusLineChartPayload {
  data:
    ChartData<
      'line',
      CensusLinePoint[]
    >

  timeline:
    CensusTimelinePoint[]
}

/*
 * Convert the colors used by the
 * existing census palettes into an
 * rgba value with whatever opacity
 * the gradient needs.
 */
const withAlpha = (
  color:
    string,

  alpha:
    number,
): string => {
  const normalized =
    color.trim()

  if (
    normalized.startsWith(
      '#',
    )
  ) {
    const hex =
      normalized.slice(
        1,
      )

    const expanded =
      hex.length === 3
        ? hex
            .split('')
            .map(
              character =>
                character +
                character,
            )
            .join('')
        : hex

    if (
      expanded.length ===
      6
    ) {
      const red =
        Number.parseInt(
          expanded.slice(
            0,
            2,
          ),
          16,
        )

      const green =
        Number.parseInt(
          expanded.slice(
            2,
            4,
          ),
          16,
        )

      const blue =
        Number.parseInt(
          expanded.slice(
            4,
            6,
          ),
          16,
        )

      if (
        Number.isFinite(
          red,
        ) &&
        Number.isFinite(
          green,
        ) &&
        Number.isFinite(
          blue,
        )
      ) {
        return (
          `rgba(` +
          `${red}, ` +
          `${green}, ` +
          `${blue}, ` +
          `${alpha}` +
          `)`
        )
      }
    }
  }

  const rgbMatch =
    normalized.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
    )

  if (
    rgbMatch
  ) {
    return (
      `rgba(` +
      `${rgbMatch[1]}, ` +
      `${rgbMatch[2]}, ` +
      `${rgbMatch[3]}, ` +
      `${alpha}` +
      `)`
    )
  }

  /*
   * Palette colors are currently hex
   * or rgba, so this is just a safe
   * fallback.
   */
  return normalized
}

const createDatasetGradient = (
  context:
    ScriptableContext<
      'line'
    >,

  fallbackColor:
    string,
) => {
  const {
    chart,
    dataset,
  } = context

  const {
    chartArea,
    ctx,
  } = chart

  const currentColor =
    typeof (
      dataset.borderColor
    ) === 'string'
      ? dataset.borderColor
      : fallbackColor

  /*
   * Chart area is not guaranteed to
   * exist on the earliest resolution
   * pass.
   */
  if (
    !chartArea
  ) {
    return withAlpha(
      currentColor,
      .18,
    )
  }

  const gradient =
    ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    )

  /*
   * The fill itself only occupies the
   * area underneath the line.
   *
   * This produces:
   *
   * line
   * ███████
   * █████
   * ███
   * ██
   * ░
   * transparent
   *
   * The opacity is intentionally
   * restrained because several series
   * may overlap.
   */
  gradient.addColorStop(
    0,
    withAlpha(
      currentColor,
      .24,
    ),
  )

  gradient.addColorStop(
    .45,
    withAlpha(
      currentColor,
      .15,
    ),
  )

  gradient.addColorStop(
    .75,
    withAlpha(
      currentColor,
      .07,
    ),
  )

  gradient.addColorStop(
    1,
    withAlpha(
      currentColor,
      0,
    ),
  )

  return gradient
}

export default async function getLineChartData(
  url: string,
  colors:
    string[] =
      defaultColors,
): Promise<
  CensusLineChartPayload
> {
  const csvText =
    await fetch(
      url,
    ).then(
      response =>
        response.text(),
    )

  const rows =
    parse(
      csvText,
    ) as string[][]

  const header =
    rows.shift() ??
    []

  const sourceDates =
    header
      .slice(1)
      .map(
        date =>
          date.trim(),
      )

  const timeline =
    mergeCensusTimeline(
      sourceDates,
    )

  const datasets:
    ChartDataset<
      'line',
      CensusLinePoint[]
    >[] =
    rows
      .filter(
        row =>
          Boolean(
            row[0]?.trim(),
          ),
      )
      .map(
        (
          row,
          datasetIndex,
        ):
          ChartDataset<
            'line',
            CensusLinePoint[]
          > => {
          const label =
            row[0].trim()

          const sourceValues =
            row.slice(1)

          const valuesByDate =
            new Map<
              string,
              {
                value:
                  number

                observed:
                  boolean
              }
            >()

          sourceDates.forEach(
            (
              date,
              index,
            ) => {
              const raw =
                sourceValues[
                  index
                ]

              const observed =
                raw !==
                  undefined &&
                raw.trim() !==
                  ''

              const parsed =
                observed
                  ? Number(raw)
                  : 0

              valuesByDate.set(
                date,
                {
                  value:
                    Number.isFinite(
                      parsed,
                    )
                      ? parsed
                      : 0,

                  observed,
                },
              )
            },
          )

          const color =
            colors[
              datasetIndex %
              colors.length
            ]

          const data:
            CensusLinePoint[] =
            timeline.map(
              point => {
                const source =
                  valuesByDate.get(
                    point.label,
                  )

                return {
                  x:
                    point.timestamp,

                  y:
                    source?.value ??
                    0,

                  dateLabel:
                    point.label,

                  observed:
                    source
                      ?.observed ??
                    false,
                }
              },
            )

          return {
            label,
            data,

            parsing:
              false,

            borderColor:
              color,

            /*
             * Scriptable gradient.
             *
             * It reads the current
             * borderColor so legend
             * focus automatically turns
             * the fill grey too.
             */
            backgroundColor:
              context =>
                createDatasetGradient(
                  context,
                  color,
                ),

            pointBackgroundColor:
              color,

            pointBorderColor:
              '#111',

            pointBorderWidth:
              2,

            pointRadius:
              4,

            pointHoverRadius:
              6,

            pointHitRadius:
              14,

            borderWidth:
              3,

            borderCapStyle:
              'round',

            borderJoinStyle:
              'round',

            cubicInterpolationMode:
              'monotone',

            tension:
              .35,

            /*
             * Fill each curve down to
             * the zero/count baseline.
             */
            fill:
              'origin',

            spanGaps:
              false,
          }
        },
      )

  return {
    data: {
      datasets,
    },

    timeline,
  }
}