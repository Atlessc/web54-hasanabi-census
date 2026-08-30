import {createSignal, onCleanup, onMount, Show} from 'solid-js'

import type {CensusCategory} from '../Slide/slideData'
import titleLogo from '../../images/title.svg'

import styles from './explorerHeader.module.scss'

interface ExplorerHeaderProps {
  categories: CensusCategory[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export default function ExplorerHeader(props: ExplorerHeaderProps) {
  const [categoryOpen, setCategoryOpen] = createSignal(false)

  let categoryDropdown: HTMLDivElement | undefined

  const selectedCategory = () =>
    props.categories[props.selectedIndex] ?? props.categories[0]

  const selectCategory = (index: number) => {
    props.onSelect(index)
    setCategoryOpen(false)
  }

  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault()
      setCategoryOpen(true)
    }

    if (event.key === 'Escape') {
      setCategoryOpen(false)
    }
  }

  onMount(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return

      if (
        categoryDropdown &&
        !categoryDropdown.contains(event.target)
      ) {
        setCategoryOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCategoryOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    onCleanup(() => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    })
  })

  return (
    <header class={styles.header}>
      <button
        class={styles.brand}
        type="button"
        aria-label="Go to census cover"
        onclick={() => props.onSelect(0)}
      >
        <img
          src={titleLogo}
          alt="The HasanAbi Census"
        />
      </button>

      <div class={styles.controls}>
        <div
          class={styles.categoryControl}
          ref={categoryDropdown}
        >
          <button
            class={styles.categoryTrigger}
            type="button"
            aria-label={`Census category: ${selectedCategory()?.name}`}
            aria-haspopup="menu"
            aria-expanded={categoryOpen()}
            onclick={() => setCategoryOpen(!categoryOpen())}
            onkeydown={handleTriggerKeyDown}
          >
            <span class={styles.categoryLabel}>
              Category
            </span>

            <span class={styles.categoryValue}>
              {selectedCategory()?.name}
            </span>

            <span
              class={styles.categoryCaret}
              classList={{
                [styles.categoryCaretOpen]: categoryOpen(),
              }}
              aria-hidden="true"
            />
          </button>

          <Show when={categoryOpen()}>
            <div
              class={styles.categoryMenu}
              role="menu"
              aria-label="Census categories"
            >
              {props.categories.map((category, index) => (
                <button
                  class={styles.categoryOption}
                  classList={{
                    [styles.categoryOptionSelected]:
                      props.selectedIndex === index,
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={props.selectedIndex === index}
                  onclick={() => selectCategory(index)}
                >
                  <span>{category.name}</span>

                  <Show when={props.selectedIndex === index}>
                    <span
                      class={styles.selectedMark}
                      aria-hidden="true"
                    />
                  </Show>
                </button>
              ))}
            </div>
          </Show>
        </div>

        <div
          class={styles.view}
          aria-label="Current data view"
        >
          <span class={styles.viewLabel}>
            View
          </span>

          <span class={styles.viewValue}>
            Snapshot
          </span>
        </div>
      </div>
    </header>
  )
}