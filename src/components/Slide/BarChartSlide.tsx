import {createEffect, createMemo, createSignal, JSX, onMount} from 'solid-js'
import {Bar} from 'solid-chartjs'
import {Chart, ChartData, Colors, Legend, LinearScale, Title, Tooltip} from 'chart.js'
import DataLabels from 'chartjs-plugin-datalabels'
import {createMediaQuery} from '@solid-primitives/media'
import {createWindowSize} from '@solid-primitives/resize-observer'

import styles from './slide.module.scss'
import {plugins, stackedBarChart} from './options'
import getStackedBarData from './getStackedBarData'
import {colorsHeight} from './colors'

export default function BarChartSlide({dataFile, title, note}: {
  dataFile: string,
  title: string,
  note?: string | JSX.Element
}) {
  const [data, setData] = createSignal<ChartData>(null!)
  const size = createWindowSize()
  const isMedium = createMediaQuery("(max-width: 1200px)")
  const isSmall = createMediaQuery("(max-width: 700px)")
  const isTiny = createMediaQuery("(max-width: 600px)")
  const canvasWidth = createMemo(() => {
    if (isSmall()) return size.width - 36
    else if (isMedium()) return size.width * .8
    else return size.width * .6
  })
  const canvasHeight = createMemo(() => {
    return size.height * .8 - 22 * 2
  })

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, DataLabels, LinearScale)
    // PogO hardcoded
    if (title === 'Height') {
      getStackedBarData(dataFile, title)
        .then(data => {
          let i = 0
          for (const dataset of data.datasets) {
            dataset.backgroundColor = colorsHeight[i++]
          }
          return data
        })
        .then(setData)
    } else {
      getStackedBarData(dataFile, title).then(setData)
    }
  })

  return <>
    <div class={styles.slide}>
      <h2>{title}</h2>
      {note && <p>{note}</p>}
      <Bar class={styles.chart} data={data()} options={stackedBarChart(title, isTiny())} plugins={plugins}
           height={canvasHeight()} width={canvasWidth()} />
    </div>
  </>
}
