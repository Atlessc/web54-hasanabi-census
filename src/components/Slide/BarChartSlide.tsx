import {createMemo, createSignal, JSX, onMount, Show} from 'solid-js'
import {Bar} from 'solid-chartjs'
import {Chart, ChartData, Colors, Legend, LinearScale, Title, Tooltip} from 'chart.js'
import DataLabels from 'chartjs-plugin-datalabels'
import {createMediaQuery} from '@solid-primitives/media'
import {createWindowSize} from '@solid-primitives/resize-observer'

import styles from './slide.module.scss'
import {plugins, stackedBarChart} from './options'
import getStackedBarData from './getStackedBarData'

interface BarChartSlideProps {
  dataFile: string,
  title: string,
  note?: string | JSX.Element
  colors?: string[]
}

export default function BarChartSlide(props: BarChartSlideProps) {
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
    getStackedBarData(props.dataFile, props.title, props.colors).then(setData)
  })

  return <>
    <div class={styles.slide}>
      <h2>{props.title}</h2>
      <Show when={props.note}><p>{props.note}</p></Show>
      <Bar class={styles.chart} data={data()} options={stackedBarChart(props.title, isTiny())} plugins={plugins}
        height={canvasHeight()} width={canvasWidth()} />
    </div>
  </>
}
