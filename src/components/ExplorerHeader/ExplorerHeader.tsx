import type {CensusCategory} from '../Slide/slideData'
import titleLogo from '../../images/title.svg'

import styles from './explorerHeader.module.scss'

interface ExplorerHeaderProps {
  categories: CensusCategory[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export default function ExplorerHeader(props: ExplorerHeaderProps) {
  return (
    <header class={styles.header}>
      <button
        class={styles.brand}
        type="button"
        aria-label="Go to census cover"
        onclick={() => props.onSelect(0)}
      >
        <img src={titleLogo} alt="The HasanAbi Census" />
      </button>

      <div class={styles.controls}>
        <label class={styles.categoryControl}>
          <span>Category</span>
          <select
            aria-label="Census category"
            value={String(props.selectedIndex)}
            onchange={(event) => props.onSelect(Number(event.currentTarget.value))}
          >
            {props.categories.map((category, index) => (
              <option value={index}>{category.name}</option>
            ))}
          </select>
        </label>

        <div class={styles.view} aria-label="Current data view">
          <span class={styles.viewLabel}>View</span>
          <span class={styles.viewValue}>Snapshot</span>
        </div>
      </div>
    </header>
  )
}
