import {
  createEffect,
  createMemo,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js'

import {
  Line,
} from 'solid-chartjs'

import {
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'

import {
  createMediaQuery,
} from '@solid-primitives/media'

import {
  createWindowSize,
} from '@solid-primitives/resize-observer'

import styles from './slide.module.scss'

import getLineChartData, {
  CensusLineChartPayload,
} from './getLineChartData'

import {
  lineChartOptions,
  linePlugins,
} from './lineOptions'

interface LineChartSlideProps {
  dataFile:
    string

  title:
    string

  note?:
    string |
    JSX.Element

  colors?:
    string[]

  active:
    boolean
}

/*
 * Leaving a slide briefly does
 * not immediately destroy it.
 *
 * After this delay it unloads,
 * causing the left-to-right
 * reveal animation to replay
 * the next time it is visited.
 */
const RESET_DELAY =
  2200

export default function LineChartSlide(
  props:
    LineChartSlideProps,
) {
  const [
    payload,
    setPayload,
  ] =
    createSignal<
      CensusLineChartPayload |
      null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    createSignal(
      false,
    )

  const windowSize =
    createWindowSize()

  const [
    frameHeight,
    setFrameHeight,
  ] =
    createSignal(
      1,
    )

  const isMedium =
    createMediaQuery(
      '(max-width: 1200px)',
    )

  const isSmall =
    createMediaQuery(
      '(max-width: 700px)',
    )

  const isTiny =
    createMediaQuery(
      '(max-width: 600px)',
    )

  let chartFrame:
    HTMLDivElement |
    undefined

  let resetTimer:
    number |
    undefined

  let loadGeneration =
    0

  const clearResetTimer =
    () => {
      if (
        resetTimer ===
        undefined
      ) {
        return
      }

      window.clearTimeout(
        resetTimer,
      )

      resetTimer =
        undefined
    }

  const resetChart =
    () => {
      loadGeneration +=
        1

      setPayload(
        null,
      )

      setLoading(
        false,
      )

      resetTimer =
        undefined
    }

  const loadChart =
    async () => {
      if (
        untrack(
          payload,
        ) ||
        untrack(
          loading,
        )
      ) {
        return
      }

      const generation =
        ++loadGeneration

      setLoading(
        true,
      )

      try {
        const nextPayload =
          await getLineChartData(
            props.dataFile,
            props.colors,
          )

        if (
          generation !==
          loadGeneration
        ) {
          return
        }

        setPayload(
          nextPayload,
        )
      } finally {
        if (
          generation ===
          loadGeneration
        ) {
          setLoading(
            false,
          )
        }
      }
    }

  createEffect(
    () => {
      const active =
        props.active

      clearResetTimer()

      if (active) {
        void loadChart()

        return
      }

      if (
        !untrack(
          payload,
        ) &&
        !untrack(
          loading,
        )
      ) {
        return
      }

      resetTimer =
        window.setTimeout(
          resetChart,
          RESET_DELAY,
        )
    },
  )

  const canvasWidth =
    createMemo(
      () => {
        const width =
          windowSize.width

        if (
          isSmall()
        ) {
          return Math.max(
            1,
            width - 36,
          )
        }

        if (
          isMedium()
        ) {
          return Math.max(
            1,
            width * .8,
          )
        }

        return Math.max(
          1,
          width * .6,
        )
      },
    )

  onMount(
    () => {
      Chart.register(
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        Legend,
        Tooltip,

        /*
         * Required for:
         *
         * fill: 'origin'
         *
         * Without Filler, Chart.js
         * draws the line but ignores
         * the area underneath it.
         */
        Filler,
      )

      if (
        !chartFrame
      ) {
        return
      }

      const observer =
        new ResizeObserver(
          entries => {
            const entry =
              entries[0]

            if (!entry) {
              return
            }

            setFrameHeight(
              Math.max(
                1,
                entry
                  .contentRect
                  .height,
              ),
            )
          },
        )

      observer.observe(
        chartFrame,
      )

      onCleanup(
        () => {
          observer.disconnect()

          clearResetTimer()

          loadGeneration +=
            1
        },
      )
    },
  )

  return (
    <div
      class={
        styles.slide
      }
    >
      <div
        class={
          styles.slideHeader
        }
      >
        <h2>
          {props.title}
        </h2>

        <Show
          when={
            props.note
          }
        >
          <p>
            {props.note}
          </p>
        </Show>
      </div>

      <div
        class={
          styles.chartFrame
        }

        ref={
          chartFrame
        }
      >
        <div
          class={
            styles.chartStage
          }

          style={{
            width:
              `${canvasWidth()}px`,

            height:
              `${frameHeight()}px`,
          }}
        >
          <Show
            when={
              payload()
            }
          >
            {
              chartPayload => (
                <Line
                  class={
                    styles.chart
                  }

                  data={
                    chartPayload()
                      .data
                  }

                  options={
                    lineChartOptions(
                      isTiny(),

                      chartPayload()
                        .timeline,
                    )
                  }

                  plugins={
                    linePlugins
                  }
                />
              )
            }
          </Show>
        </div>
      </div>
    </div>
  )
}