import {
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import createEmblaCarousel
  from "embla-carousel-solid";

import cn
  from "classnames";

import {
  BsBoxArrowInLeft,
  BsBoxArrowInRight,
} from "solid-icons/bs";

import {
  HomeSlide,
} from "../Slide";

import BarChartSlide
  from "../Slide/BarChartSlide";

import LineChartSlide
  from "../Slide/LineChartSlide";

import {
  barChartSlides,
  censusCategories,
} from "../Slide/slideData";

import ExplorerHeader
  from "../ExplorerHeader/ExplorerHeader";

import type {
  CensusViewId,
} from "../ExplorerHeader/viewData";

import CategoryRail
  from "../CategoryRail/CategoryRail";

import ProjectFooter
  from "../ProjectFooter/ProjectFooter";

import styles
  from "./slider.module.scss";

export default function Slider() {
  const [
    emblaRef,
    emblaApi,
  ] =
    createEmblaCarousel();

  const [
    canScrollNext,
    setCanScrollNext,
  ] =
    createSignal(
      false,
    );

  const [
    canScrollPrev,
    setCanScrollPrev,
  ] =
    createSignal(
      false,
    );

  const [
    slideIndex,
    setSlideIndex,
  ] =
    createSignal(
      0,
    );

  const [
    selectedView,
    setSelectedView,
  ] =
    createSignal<
      CensusViewId
    >(
      "stacked",
    );

  const syncCarouselState =
    () => {
      const api =
        emblaApi();

      if (!api) {
        return;
      }

      setCanScrollNext(
        api.canScrollNext(),
      );

      setCanScrollPrev(
        api.canScrollPrev(),
      );

      setSlideIndex(
        api.selectedScrollSnap(),
      );
    };

  const selectSlide =
    (
      index:
        number,
    ) => {
      emblaApi()
        ?.scrollTo(
          index,
        );
    };

  onMount(
    () => {
      const api =
        emblaApi();

      if (!api) {
        return;
      }

      const handleKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey
          ) {
            return;
          }

          if (
            event.target
              instanceof
              HTMLInputElement ||
            event.target
              instanceof
              HTMLSelectElement ||
            event.target
              instanceof
              HTMLButtonElement
          ) {
            return;
          }

          if (
            event.key ===
            "ArrowRight"
          ) {
            api.scrollNext();
          }

          if (
            event.key ===
            "ArrowLeft"
          ) {
            api.scrollPrev();
          }
        };

      syncCarouselState();

      api.on(
        "select",
        syncCarouselState,
      );

      api.on(
        "reInit",
        syncCarouselState,
      );

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      onCleanup(
        () => {
          window
            .removeEventListener(
              "keydown",
              handleKeyDown,
            );

          api.off(
            "select",
            syncCarouselState,
          );

          api.off(
            "reInit",
            syncCarouselState,
          );
        },
      );
    },
  );

  return (
    <main
      class={
        styles.explorer
      }
    >
      <ExplorerHeader
        categories={
          censusCategories
        }

        selectedIndex={
          slideIndex()
        }

        onSelect={
          selectSlide
        }

        selectedView={
          selectedView()
        }

        onViewChange={
          setSelectedView
        }
      />

      <section
        class={
          styles.visualization
        }

        aria-label=
          "Census visualization"
      >
        <div
          class={
            styles.slider
          }

          ref={
            emblaRef
          }
        >
          <div
            class={
              styles.container
            }
          >
            <div
              class={
                styles.slide
              }
            >
              <HomeSlide />
            </div>

            {
              barChartSlides.map(
                (
                  {
                    name,
                    fileUrl,
                    ...additional
                  },

                  index,
                ) => (
                  <div
                    class={
                      styles.slide
                    }
                  >
                    <Show
                      when={
                        selectedView() ===
                        "trend"
                      }

                      fallback={
                        <BarChartSlide
                          dataFile={
                            fileUrl
                          }

                          title={
                            name
                          }

                          {...additional}
                        />
                      }
                    >
                      <LineChartSlide
                        dataFile={
                          fileUrl
                        }

                        title={
                          name
                        }

                        active={
                          slideIndex() ===
                          index + 1
                        }

                        {...additional}
                      />
                    </Show>
                  </div>
                ),
              )
            }
          </div>
        </div>

        <button
          class={
            cn(
              styles.arrow,
              styles.prev,

              !canScrollPrev() &&
                styles.hide,
            )
          }

          type=
            "button"

          aria-label=
            "Previous census category"

          disabled={
            !canScrollPrev()
          }

          onclick={
            () =>
              emblaApi()
                ?.scrollPrev()
          }
        >
          <BsBoxArrowInLeft />
        </button>

        <button
          class={
            cn(
              styles.arrow,
              styles.next,

              !canScrollNext() &&
                styles.hide,
            )
          }

          type=
            "button"

          aria-label=
            "Next census category"

          disabled={
            !canScrollNext()
          }

          onclick={
            () =>
              emblaApi()
                ?.scrollNext()
          }
        >
          <BsBoxArrowInRight />
        </button>
      </section>

      <CategoryRail
        categories={
          censusCategories
        }

        selectedIndex={
          slideIndex()
        }

        onSelect={
          selectSlide
        }
      />

      <ProjectFooter />
    </main>
  );
}