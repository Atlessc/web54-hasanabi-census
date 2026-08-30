import {createEffect, createSignal, onMount} from 'solid-js'
import createEmblaCarousel from 'embla-carousel-solid'
import cn from 'classnames'

import type {CensusCategory} from '../Slide/slideData'
import styles from './categoryRail.module.scss'

interface CategoryRailProps {
  categories: CensusCategory[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export default function CategoryRail(props: CategoryRailProps) {
  const [emblaRef, emblaApi] = createEmblaCarousel(() => ({
    dragFree: true,
    containScroll: 'trimSnaps',
    align: 'center',
  }))
  const [canScrollPrev, setCanScrollPrev] = createSignal(false)
  const [canScrollNext, setCanScrollNext] = createSignal(false)

  const updateControls = () => {
    setCanScrollPrev(emblaApi()?.canScrollPrev() ?? false)
    setCanScrollNext(emblaApi()?.canScrollNext() ?? false)
  }

  onMount(() => {
    const api = emblaApi()
    if (!api) return

    updateControls()
    api.on('scroll', updateControls)
    api.on('reInit', updateControls)
  })

  createEffect(() => {
    const index = props.selectedIndex
    emblaApi()?.scrollTo(index)
  })

  return (
    <nav class={styles.rail} aria-label="Census categories">
      <button
        class={styles.railArrow}
        type="button"
        aria-label="Scroll categories left"
        disabled={!canScrollPrev()}
        onclick={() => emblaApi()?.scrollPrev()}
      >
        ‹
      </button>

      <div class={styles.viewport} ref={emblaRef}>
        <div class={styles.track}>
          {props.categories.map((category, index) => (
            <button
              class={cn(styles.item, props.selectedIndex === index && styles.selected)}
              type="button"
              aria-current={props.selectedIndex === index ? 'page' : undefined}
              onclick={() => props.onSelect(index)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <button
        class={styles.railArrow}
        type="button"
        aria-label="Scroll categories right"
        disabled={!canScrollNext()}
        onclick={() => emblaApi()?.scrollNext()}
      >
        ›
      </button>
    </nav>
  )
}
