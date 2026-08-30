import {
  createMemo,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import {Bar} from 'solid-chartjs'
import {
  Chart,
  ChartData,
  Colors,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import DataLabels from 'chartjs-plugin-datalabels'
import {createMediaQuery} from '@solid-primitives/media'

import styles from './slide.module.scss'
import {
  plugins,
  stackedBarChart,
} from './options'
import getStackedBarData from './getStackedBarData'

interface BarChartSlideProps {
  dataFile: string
  title: string
  note?: string | JSX.Element
  colors?: string[]
}

interface FrameSize {
  width: number
  height: number
}

export default function BarChartSlide(
  props: BarChartSlideProps,
) {
  const [data, setData] =
    createSignal<ChartData>(null!)

  const [frameSize, setFrameSize] =
    createSignal<FrameSize>({
      width: 1,
      height: 1,
    })

  const isMedium = createMediaQuery(
    '(max-width: 1200px)',
  )

  const isSmall = createMediaQuery(
    '(max-width: 700px)',
  )

  const isTiny = createMediaQuery(
    '(max-width: 600px)',
  )

  let chartFrame:
    | HTMLDivElement
    | undefined

  const canvasWidth = createMemo(() => {
    const width = frameSize().width

    if (isSmall()) {
      return Math.max(
        1,
        width - 36,
      )
    }

    if (isMedium()) {
      return Math.max(
        1,
        width * .8,
      )
    }

    return Math.max(
      1,
      width * .6,
    )
  })

  const canvasHeight = createMemo(() =>
    Math.max(
      1,
      frameSize().height,
    ),
  )

  onMount(() => {
    Chart.register(
      Title,
      Tooltip,
      Legend,
      Colors,
      DataLabels,
      LinearScale,
    )

    getStackedBarData(
      props.dataFile,
      props.title,
      props.colors,
    ).then(setData)

    if (!chartFrame) return

    const resizeObserver =
      new ResizeObserver((entries) => {
        const entry = entries[0]

        if (!entry) return

        setFrameSize({
          width:
            entry.contentRect.width,
          height:
            entry.contentRect.height,
        })
      })

    resizeObserver.observe(
      chartFrame,
    )

    onCleanup(() => {
      resizeObserver.disconnect()
    })
  })

  return (
    <div class={styles.slide}>
      <div class={styles.slideHeader}>
        <h2>{props.title}</h2>

        <Show when={props.note}>
          <p>{props.note}</p>
        </Show>
      </div>

      <div
        class={styles.chartFrame}
        ref={chartFrame}
      >
        <Bar
          class={styles.chart}
          data={data()}
          options={stackedBarChart(
            props.title,
            isTiny(),
          )}
          plugins={plugins}
          height={canvasHeight()}
          width={canvasWidth()}
        />
      </div>
    </div>
  )
}