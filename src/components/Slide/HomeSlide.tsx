import styles from './slide.module.scss'

import {createMediaQuery} from '@solid-primitives/media'
import {default as cn} from 'classnames'
import Signature from '../Signature'

export default function HomeSlide() {
  const isLMedium = createMediaQuery("(max-width: 1600px)")
  return <>
    <div class={cn(styles.slide, styles.home)}>
      <h1>
        The&nbsp;HasanAbi{isLMedium() ? <br/> : ' '}Census
        <span class={styles.comment}>Holy Toledo!</span>
      </h1>
      <p style="text-align: center;"><i>with data from June 2020 to August 2026</i></p>
      <p style="text-align: center;"><i>Thank you littlebear36 for documenting census data</i></p>
      <Signature class={styles.signature} classSvg={''} />
    </div>
  </>
}
