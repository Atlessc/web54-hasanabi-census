import {createSignal, onCleanup, onMount} from 'solid-js'
import createEmblaCarousel from 'embla-carousel-solid'
import cn from 'classnames'
import {BsBoxArrowInLeft, BsBoxArrowInRight} from 'solid-icons/bs'

import {HomeSlide} from '../Slide'
import BarChartSlide from '../Slide/BarChartSlide'
import {barChartSlides, censusCategories} from '../Slide/slideData'
import ExplorerHeader from '../ExplorerHeader/ExplorerHeader'
import CategoryRail from '../CategoryRail/CategoryRail'

import styles from './slider.module.scss'

export default function Slider() {
  const [emblaRef, emblaApi] = createEmblaCarousel()
  const [canScrollNext, setCanScrollNext] = createSignal(false)
  const [canScrollPrev, setCanScrollPrev] = createSignal(false)
  const [slideIndex, setSlideIndex] = createSignal(0)

  const syncCarouselState = () => {
    const api = emblaApi()
    if (!api) return

    setCanScrollNext(api.canScrollNext())
    setCanScrollPrev(api.canScrollPrev())
    setSlideIndex(api.selectedScrollSnap())
  }

  const selectSlide = (index: number) => {
    emblaApi()?.scrollTo(index)
  }

  onMount(() => {
    const api = emblaApi()
    if (!api) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return

      if (event.key === 'ArrowRight') api.scrollNext()
      if (event.key === 'ArrowLeft') api.scrollPrev()
    }

    syncCarouselState()
    api.on('select', syncCarouselState)
    api.on('reInit', syncCarouselState)
    window.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown)
      api.off('select', syncCarouselState)
      api.off('reInit', syncCarouselState)
    })
  })

  return (
    <main class={styles.explorer}>
      <ExplorerHeader
        categories={censusCategories}
        selectedIndex={slideIndex()}
        onSelect={selectSlide}
      />

      <section class={styles.visualization} aria-label="Census visualization">
        <div class={styles.slider} ref={emblaRef}>
          <div class={styles.container}>
            <div class={styles.slide}>
              <HomeSlide />
            </div>

            {barChartSlides.map(({name, fileUrl, ...additional}) => (
              <div class={styles.slide}>
                <BarChartSlide dataFile={fileUrl} title={name} {...additional} />
              </div>
            ))}
          </div>
        </div>

        <button
          class={cn(styles.arrow, styles.prev, !canScrollPrev() && styles.hide)}
          type="button"
          aria-label="Previous census category"
          disabled={!canScrollPrev()}
          onclick={() => emblaApi()?.scrollPrev()}
        >
          <BsBoxArrowInLeft />
        </button>

        <button
          class={cn(styles.arrow, styles.next, !canScrollNext() && styles.hide)}
          type="button"
          aria-label="Next census category"
          disabled={!canScrollNext()}
          onclick={() => emblaApi()?.scrollNext()}
        >
          <BsBoxArrowInRight />
        </button>
      </section>

      <CategoryRail
        categories={censusCategories}
        selectedIndex={slideIndex()}
        onSelect={selectSlide}
      />
    </main>
  )
}
