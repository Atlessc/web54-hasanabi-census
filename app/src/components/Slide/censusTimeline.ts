export interface CensusTimelinePoint {
  label: string
  timestamp: number
}

const monthIndexes:
  Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

export const parseCensusDate = (
  label: string,
): number => {
  const [
    monthName,
    yearText,
  ] = label
    .trim()
    .split(/\s+/)

  const month =
    monthIndexes[
      monthName
    ]

  const year =
    Number(yearText)

  if (
    month === undefined ||
    !Number.isFinite(year)
  ) {
    throw new Error(
      `Invalid census date: ${label}`,
    )
  }

  return Date.UTC(
    year,
    month,
    1,
  )
}

const baseCensusLabels = [
  'June 2020',
  'December 2020',
  'December 2021',
  'August 2022',
  'July 2023',
  'August 2024',
  'August 2025',
  'August 2026',
]

export const baseCensusTimeline:
  CensusTimelinePoint[] =
  baseCensusLabels.map(
    label => ({
      label,
      timestamp:
        parseCensusDate(
          label,
        ),
    }),
  )

export const mergeCensusTimeline = (
  sourceLabels: string[],
): CensusTimelinePoint[] => {
  const labels =
    new Set<string>(
      baseCensusLabels,
    )

  for (
    const label
    of sourceLabels
  ) {
    const trimmed =
      label.trim()

    if (trimmed) {
      labels.add(
        trimmed,
      )
    }
  }

  return [
    ...labels,
  ]
    .map(
      label => ({
        label,
        timestamp:
          parseCensusDate(
            label,
          ),
      }),
    )
    .sort(
      (
        first,
        second,
      ) =>
        first.timestamp -
        second.timestamp,
    )
}

export const formatCensusTick = (
  timestamp: number,
  timeline:
    CensusTimelinePoint[],
  tiny: boolean,
): string => {
  const point =
    timeline.find(
      item =>
        item.timestamp ===
        timestamp,
    )

  if (!point) {
    return ''
  }

  if (!tiny) {
    return point.label
  }

  const [
    month,
    year,
  ] =
    point.label.split(' ')

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