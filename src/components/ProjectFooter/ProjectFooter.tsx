import styles from './projectFooter.module.scss'

export default function ProjectFooter() {
  return (
    <footer class={styles.footer}>
      <span>Original project by</span>

      <a
        href="https://github.com/brilliantdrink"
        target="_blank"
        rel="noreferrer"
      >
        @brilliantdrink
      </a>
    </footer>
  )
}