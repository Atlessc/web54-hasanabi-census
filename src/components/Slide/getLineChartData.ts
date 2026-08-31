import {
  parse,
} from "csv-parse/browser/esm/sync";

import type {
  ChartData,
  ChartDataset,
} from "chart.js";

import {
  colors as defaultColors,
} from "./colors";

import {
  CensusTimelinePoint,
  mergeCensusTimeline,
} from "./censusTimeline";

export interface CensusLinePoint {
  x: number;
  y: number;

  dateLabel: string;

  /*
   * false means this category did
   * not have a recorded value for
   * this census date.
   *
   * It is still plotted at zero so
   * every line shares the complete
   * historical census timeline.
   */
  observed: boolean;
}

export interface CensusLineChartPayload {
  data:
    ChartData<
      "line",
      CensusLinePoint[]
    >;

  timeline:
    CensusTimelinePoint[];
}

export default async function getLineChartData(
  url:
    string,

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
    );

  const rows =
    parse(
      csvText,
    ) as string[][];

  const header =
    rows.shift() ??
    [];

  const sourceDates =
    header
      .slice(1)
      .map(
        date =>
          date.trim(),
      );

  const timeline =
    mergeCensusTimeline(
      sourceDates,
    );

  /*
   * Defensive fallback in case a
   * custom slide accidentally passes
   * an empty color array.
   */
  const palette =
    colors.length
      ? colors
      : defaultColors;

  const datasets:
    ChartDataset<
      "line",
      CensusLinePoint[]
    >[] =
    rows
      .filter(
        row =>
          Boolean(
            row[0]
              ?.trim(),
          ),
      )
      .map(
        (
          row,
          datasetIndex,
        ):
          ChartDataset<
            "line",
            CensusLinePoint[]
          > => {
          const label =
            row[0].trim();

          const sourceValues =
            row.slice(1);

          const valuesByDate =
            new Map<
              string,
              {
                value: number;
                observed: boolean;
              }
            >();

          sourceDates
            .forEach(
              (
                date,
                index,
              ) => {
                const raw =
                  sourceValues[
                    index
                  ];

                const observed =
                  raw !==
                    undefined &&
                  raw.trim() !==
                    "";

                const parsed =
                  observed
                    ? Number(
                        raw,
                      )
                    : 0;

                valuesByDate
                  .set(
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
                  );
              },
            );

          const color =
            palette[
              datasetIndex %
                palette.length
            ];

          const data:
            CensusLinePoint[] =
            timeline.map(
              point => {
                const source =
                  valuesByDate
                    .get(
                      point.label,
                    );

                return {
                  x:
                    point.timestamp,

                  y:
                    source
                      ?.value ??
                    0,

                  dateLabel:
                    point.label,

                  observed:
                    source
                      ?.observed ??
                    false,
                };
              },
            );

          return {
            label,
            data,

            /*
             * Data already contains
             * explicit X/Y coordinates.
             */
            parsing:
              false,

            borderColor:
              color,

            /*
             * Keep a simple color here.
             *
             * The custom line-relative
             * fade reads borderColor.
             */
            backgroundColor:
              color,

            pointBackgroundColor:
              color,

            pointBorderColor:
              "#111",

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
              "round",

            borderJoinStyle:
              "round",

            /*
             * Smooth curves without
             * extreme interpolation
             * overshoot.
             */
            cubicInterpolationMode:
              "monotone",

            tension:
              0.35,

            /*
             * IMPORTANT:
             *
             * Do not let Chart.js fill
             * toward the zero baseline.
             *
             * Our custom shader handles
             * the independent fade for
             * every individual line.
             */
            fill:
              false,

            spanGaps:
              false,
          };
        },
      );

  return {
    data: {
      datasets,
    },

    timeline,
  };
}