import {parse} from 'csv-parse/browser/esm/sync'
import type {ChartData} from 'chart.js'
import {colors as defaultColors} from './colors'
import {normalizeChartDataY} from './utils'

export default async function getStackedBarData(url: string, id: string, colors: string[] = defaultColors) {
  const csvText = await fetch(url).then(res => res.text())
  const res = parse(csvText) as string[][]
  const labels = res.shift() as string[]
  labels.shift()

  const maxBarThickness =
    labels.length === 1
      ? 180
      : 96

  const data: ChartData = {
    labels,
    datasets: normalizeChartDataY(res.map((groupData, index) => {
      const label = groupData.shift()
      return {
        label,
        data: groupData.map(Number),
        backgroundColor: colors[index] ?? null,
        borderColor: '#111',
        borderSkipped: false,
        borderWidth: 1,
        barPercentage: 0.82,
        categoryPercentage: 0.78,
        maxBarThickness,
      }
    }), id)
  }
  return data
}
