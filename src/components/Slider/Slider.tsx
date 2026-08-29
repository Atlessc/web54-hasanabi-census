import {createEffect, createSignal, onMount, Show} from 'solid-js'
import createEmblaCarousel from 'embla-carousel-solid'
import {default as cn} from 'classnames'
import {BsBoxArrowInLeft, BsBoxArrowInRight} from 'solid-icons/bs'
import {FaSolidCaretDown} from 'solid-icons/fa'
import {createMediaQuery} from '@solid-primitives/media'
import {HomeSlide} from '../Slide'

import styles from './slider.module.scss'

import BarChartSlide from '../Slide/BarChartSlide'
import {barChartSlides} from '../Slide/slideData'

export default function Slider() {
  const [emblaRef, emblaApi] = createEmblaCarousel()
  const [canScrollNext, setCanScrollNext] = createSignal(false)
  const [canScrollPrev, setCanScrollPrev] = createSignal(false)
  const [slideIndex, setSlideIndex] = createSignal(0)

  function resetCanScroll() {
    setCanScrollNext(emblaApi()?.canScrollNext() ?? false)
    setCanScrollPrev(emblaApi()?.canScrollPrev() ?? false)
    setSlideIndex(emblaApi()?.selectedScrollSnap() ?? 0)
  }

  onMount(() => {
    const api = emblaApi()
    if (api) {
      window.addEventListener('keydown', (e) => {
        if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
        if (e.key === 'ArrowRight') api.scrollNext()
        if (e.key === 'ArrowLeft') api.scrollPrev()
      })
      resetCanScroll()
      api.on('select', resetCanScroll)
      api.on('select', () => {
        navEmblaApi()?.scrollTo(emblaApi()?.selectedScrollSnap() ?? 0)
      })
    }
    const isolateArrowButtonEvent = (e: Event) => {
      if (!(e.target instanceof Element)) return
      if (!e.target.closest('button')?.classList.contains(styles.arrow)) return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('mousedown', isolateArrowButtonEvent)
    window.addEventListener('pointerdown', isolateArrowButtonEvent)
    window.addEventListener('touchstart', isolateArrowButtonEvent)
  })


  const isSmall = createMediaQuery("(max-width: 900px)")
  const [navExpanded, setNavExpanded] = createSignal(false)
  const [navEmblaRef, navEmblaApi] = createEmblaCarousel(() => ({
    dragFree: true,
    containScroll: false,
    axis: 'y',
    watchSlides: false,
  }))
  const [navIndex, setNavIndex] = createSignal(0)

  onMount(() => {
    const api = navEmblaApi()
    if (api) {
      const itemHeight = 3 * 16
      api.on('pointerUp', () => {
        const {scrollTo, target, location} = api.internalEngine()
        const diffToTarget = target.get() - location.get()
        const factor = Math.abs(diffToTarget) < itemHeight / 2.5 ? 10 : 0.1
        const distance = diffToTarget * factor
        scrollTo.distance(distance, true)
      })
      const updateStyles = () => {
        const itemAmount = api.scrollSnapList().length
        const items = api.slideNodes()
        const maxDistance = 2.5
        api.scrollSnapList().map((snapPosition, i) => {
          const distance = Math.abs(snapPosition - api.scrollProgress())
          const absoluteDistance = distance * (itemAmount - 1)
          const proximity = (absoluteDistance / maxDistance) * -1 + 1
          items[i].style.opacity = String(proximity)
          items[i].style.setProperty('--scale', String(1 - (absoluteDistance / maxDistance) * .1))
        })
      }
      api.on('scroll', updateStyles)
      updateStyles()
      api.on('select', () => {
        emblaApi()?.scrollTo(api.selectedScrollSnap())
        setNavIndex(api.selectedScrollSnap())
      })

      window.addEventListener('pointerdown', (e) => {
        if (!e.target || !(e.target instanceof Element)) return
        if (!e.target.classList.contains(styles.item)) {
          setNavExpanded(false)
        }
      })
    }
  })

  const allSlides = [{name: 'Cover'}, ...barChartSlides]

  return <>
    <div class={styles.slider} ref={emblaRef}>
      <div class={styles.container}>
        <div class={styles.slide}><HomeSlide /></div>
        {barChartSlides.map(({name, fileUrl, ...additional}) => (
          <div class={styles.slide}>
            <BarChartSlide dataFile={fileUrl} title={name} {...additional} />
          </div>
        ))}
      </div>
      <button class={cn(styles.arrow, styles.next, !canScrollNext() && styles.hide)}
        onclick={() => emblaApi()?.scrollNext()}>
        <BsBoxArrowInRight />
      </button>
      <button class={cn(styles.arrow, styles.prev, !canScrollPrev() && styles.hide)}
        onclick={() => emblaApi()?.scrollPrev()}>
        <BsBoxArrowInLeft />
      </button>
    </div>
    <Show when={!isSmall()}>
      <nav class={styles.nav}>
        {allSlides.map(({name: slide}, index) => <>
            <span class={cn(styles.item, slideIndex() === index && styles.selected)}
              onclick={() => emblaApi()?.scrollTo(index)}>
              {slide}
            </span>
        </>)}
      </nav>
    </Show>
    <Show when={isSmall()}>
      <nav class={cn(styles.nav, styles.sliding, !navExpanded() && styles.collapsed)} ref={navEmblaRef}>
        <div class={styles.container}>
          {allSlides.map(({name: slide}, index) => <>
            <span class={cn(styles.item, (!navExpanded() && navIndex() === index) && styles.selected)} onclick={() => {
              if (navExpanded()) {
                emblaApi()?.scrollTo(index)
                navEmblaApi()?.scrollTo(index)
              }
              setNavExpanded(!navExpanded())
            }}>
              {slide}
              <Show when={!navExpanded()}>
                <FaSolidCaretDown class={styles.selectIcon} />
              </Show>
            </span>
          </>)}
        </div>
      </nav>
    </Show>
  </>
}
