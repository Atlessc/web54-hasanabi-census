import {
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'

import {
  createMediaQuery,
} from '@solid-primitives/media'

import type {
  CensusCategory,
} from '../Slide/slideData'

import {
  censusViews,
} from './viewData'

import type {
  CensusViewId,
} from './viewData'

import titleLogo
  from '../../images/title.svg'

import titleStackedLogo
  from '../../images/title_stacked.svg'

import styles
  from './explorerHeader.module.scss'

interface ExplorerHeaderProps {
  categories:
    CensusCategory[]

  selectedIndex:
    number

  onSelect:
    (
      index:
        number,
    ) => void

  selectedView:
    CensusViewId

  onViewChange:
    (
      view:
        CensusViewId,
    ) => void
}

export default function ExplorerHeader(
  props:
    ExplorerHeaderProps,
) {
  const [
    categoryOpen,
    setCategoryOpen,
  ] =
    createSignal(
      false,
    )

  const [
    viewOpen,
    setViewOpen,
  ] =
    createSignal(
      false,
    )

  const useStackedLogo =
    createMediaQuery(
      '(max-width: 900px)',
    )

  let categoryDropdown:
    HTMLDivElement |
    undefined

  let viewDropdown:
    HTMLDivElement |
    undefined

  const selectedCategory =
    () =>
      props.categories[
        props.selectedIndex
      ] ??
      props.categories[0]

  const selectedView =
    () =>
      censusViews.find(
        view =>
          view.id ===
          props.selectedView,
      ) ??
      censusViews[0]

  const selectCategory =
    (
      index:
        number,
    ) => {
      props.onSelect(
        index,
      )

      setCategoryOpen(
        false,
      )
    }

  const selectView =
    (
      view:
        CensusViewId,
    ) => {
      props.onViewChange(
        view,
      )

      setViewOpen(
        false,
      )
    }

  const handleCategoryKeyDown =
    (
      event:
        KeyboardEvent,
    ) => {
      if (
        event.key ===
          'Enter' ||
        event.key ===
          ' ' ||
        event.key ===
          'ArrowDown'
      ) {
        event.preventDefault()

        setViewOpen(
          false,
        )

        setCategoryOpen(
          true,
        )
      }

      if (
        event.key ===
        'Escape'
      ) {
        setCategoryOpen(
          false,
        )
      }
    }

  const handleViewKeyDown =
    (
      event:
        KeyboardEvent,
    ) => {
      if (
        event.key ===
          'Enter' ||
        event.key ===
          ' ' ||
        event.key ===
          'ArrowDown'
      ) {
        event.preventDefault()

        setCategoryOpen(
          false,
        )

        setViewOpen(
          true,
        )
      }

      if (
        event.key ===
        'Escape'
      ) {
        setViewOpen(
          false,
        )
      }
    }

  onMount(
    () => {
      const handlePointerDown =
        (
          event:
            PointerEvent,
        ) => {
          if (
            !(
              event.target
              instanceof Node
            )
          ) {
            return
          }

          if (
            categoryDropdown &&
            !categoryDropdown
              .contains(
                event.target,
              )
          ) {
            setCategoryOpen(
              false,
            )
          }

          if (
            viewDropdown &&
            !viewDropdown
              .contains(
                event.target,
              )
          ) {
            setViewOpen(
              false,
            )
          }
        }

      const handleKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            'Escape'
          ) {
            setCategoryOpen(
              false,
            )

            setViewOpen(
              false,
            )
          }
        }

      window.addEventListener(
        'pointerdown',
        handlePointerDown,
      )

      window.addEventListener(
        'keydown',
        handleKeyDown,
      )

      onCleanup(
        () => {
          window
            .removeEventListener(
              'pointerdown',
              handlePointerDown,
            )

          window
            .removeEventListener(
              'keydown',
              handleKeyDown,
            )
        },
      )
    },
  )

  return (
    <header
      class={
        styles.header
      }
    >
      <button
        class={
          styles.brand
        }

        classList={{
          [
            styles
              .brandStacked
          ]:
            useStackedLogo(),
        }}

        type=
          "button"

        aria-label=
          "Go to census home"

        onclick={
          () =>
            props.onSelect(
              0,
            )
        }
      >
        <img
          src={
            useStackedLogo()
              ? titleStackedLogo
              : titleLogo
          }

          alt=""

          aria-hidden=
            "true"
        />
      </button>

      <div
        class={
          styles.controls
        }
      >
        {/* <div
          class={
            styles.categoryControl
          }

          ref={
            categoryDropdown
          }
        >
          <button
            class={
              styles.categoryTrigger
            }

            type=
              "button"

            aria-label={
              `Census category: ${
                selectedCategory()
                  ?.name
              }`
            }

            aria-haspopup=
              "menu"

            aria-expanded={
              categoryOpen()
            }

            onclick={
              () => {
                setViewOpen(
                  false,
                )

                setCategoryOpen(
                  !categoryOpen(),
                )
              }
            }

            onkeydown={
              handleCategoryKeyDown
            }
          >
            <span
              class={
                styles.categoryLabel
              }
            >
              Category
            </span>

            <span
              class={
                styles.categoryValue
              }
            >
              {
                selectedCategory()
                  ?.name
              }
            </span>

            <span
              class={
                styles.categoryCaret
              }

              classList={{
                [
                  styles
                    .categoryCaretOpen
                ]:
                  categoryOpen(),
              }}

              aria-hidden=
                "true"
            />
          </button>

           <Show
            when={
              categoryOpen()
            }
          >
            <div
              class={
                styles.categoryMenu
              }

              role=
                "menu"

              aria-label=
                "Census categories"
            >
              {
                props.categories.map(
                  (
                    category,
                    index,
                  ) => (
                    <button
                      class={
                        styles
                          .categoryOption
                      }

                      classList={{
                        [
                          styles
                            .categoryOptionSelected
                        ]:
                          props.selectedIndex ===
                          index,
                      }}

                      type=
                        "button"

                      role=
                        "menuitemradio"

                      aria-checked={
                        props.selectedIndex ===
                        index
                      }

                      onclick={
                        () =>
                          selectCategory(
                            index,
                          )
                      }
                    >
                      <span>
                        {
                          category.name
                        }
                      </span>

                      <Show
                        when={
                          props.selectedIndex ===
                          index
                        }
                      >
                        <span
                          class={
                            styles
                              .selectedMark
                          }

                          aria-hidden=
                            "true"
                        />
                      </Show>
                    </button>
                  ),
                )
              }
            </div>
          </Show> 
        </div> */}

        <div
          class={
            styles.view
          }

          ref={
            viewDropdown
          }
        >
          <button
            class={
              styles.viewTrigger
            }

            type=
              "button"

            aria-label={
              `Census view: ${
                selectedView()
                  .name
              }`
            }

            aria-haspopup=
              "menu"

            aria-expanded={
              viewOpen()
            }

            onclick={
              () => {
                setCategoryOpen(
                  false,
                )

                setViewOpen(
                  !viewOpen(),
                )
              }
            }

            onkeydown={
              handleViewKeyDown
            }
          >
            <span
              class={
                styles.viewLabel
              }
            >
              View
            </span>

            <span
              class={
                styles.viewValue
              }
            >
              {
                selectedView()
                  .name
              }
            </span>

            <span
              class={
                styles.categoryCaret
              }

              classList={{
                [
                  styles
                    .categoryCaretOpen
                ]:
                  viewOpen(),
              }}

              aria-hidden=
                "true"
            />
          </button>

          <Show
            when={
              viewOpen()
            }
          >
            <div
              class={
                styles.viewMenu
              }

              role=
                "menu"

              aria-label=
                "Census views"
            >
              {
                censusViews.map(
                  view => (
                    <button
                      class={
                        styles
                          .viewOption
                      }

                      classList={{
                        [
                          styles
                            .viewOptionSelected
                        ]:
                          props.selectedView ===
                          view.id,
                      }}

                      type=
                        "button"

                      role=
                        "menuitemradio"

                      aria-checked={
                        props.selectedView ===
                        view.id
                      }

                      onclick={
                        () =>
                          selectView(
                            view.id,
                          )
                      }
                    >
                      <span>
                        {
                          view.name
                        }
                      </span>

                      <Show
                        when={
                          props.selectedView ===
                          view.id
                        }
                      >
                        <span
                          class={
                            styles
                              .selectedMark
                          }

                          aria-hidden=
                            "true"
                        />
                      </Show>
                    </button>
                  ),
                )
              }
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}