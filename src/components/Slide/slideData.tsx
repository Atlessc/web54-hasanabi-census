import {JSX} from 'solid-js'

import ageFile from '../../data/age.csv'
import genderFile from '../../data/gender.csv'
import politicsFile from '../../data/politics.csv'
import ethnicityFile from '../../data/ethnicity.csv'
import religionFile from '../../data/religion.csv'
import sexualityFile from '../../data/sexuality.csv'
import heightFile from '../../data/height.csv'
import transFile from '../../data/trans.csv'
import locationFile from '../../data/location.csv'
import salaryFile from '../../data/salary.csv'
import educationFile from '../../data/education.csv'
import sexHaversFile from '../../data/sex-havers.csv'
import weebFile from '../../data/weeb.csv'
import eatingFile from '../../data/eating.csv'
import neurodivergenceFile from '../../data/neurodivergence.csv'
import gamingFile from '../../data/gaming.csv'
import watchedFile from '../../data/watched.csv'
import activismFile from '../../data/activism.csv'
import housingFile from '../../data/housing.csv'
import discoveryFile from '../../data/discovery.csv'

import styles from './slide.module.scss'
import {colorsAge, colorsHeight} from './colors'

const madge =
  'https://cdn.betterttv.net/emote/6083d2f139b5010444d0540e/3x.webp'

export type CensusCategoryId =
  | 'home'
  | 'age'
  | 'gender'
  | 'political-ideology'
  | 'ethnicity'
  | 'religion'
  | 'sexuality'
  | 'height'
  | 'trans-chatters'
  | 'location'
  | 'salary'
  | 'education'
  | 'vcard'
  | 'weebs'
  | 'diet'
  | 'neurodiversity'
  | 'gayming-frogs'
  | 'years-watched'
  | 'political-activism'
  | 'housing'
  | 'discovery'

export interface CensusCategory {
  id: CensusCategoryId
  name: string
}

export interface SlideData extends CensusCategory {
  fileUrl: string
  note?: string | JSX.Element
  colors?: string[]
}

export const homeCategory: CensusCategory = {
  id: 'home',
  name: 'Home',
}

export const barChartSlides: SlideData[] = [
  {
    id: 'age',
    name: 'Age',
    fileUrl: ageFile,
    colors: colorsAge,
  },
  {
    id: 'gender',
    name: 'Gender',
    fileUrl: genderFile,
  },
  {
    id: 'political-ideology',
    name: 'Political Ideology',
    fileUrl: politicsFile,
  },
  {
    id: 'ethnicity',
    name: 'Ethnicity',
    fileUrl: ethnicityFile,
  },
  {
    id: 'religion',
    name: 'Religion',
    fileUrl: religionFile,
  },
  {
    id: 'sexuality',
    name: 'Sexuality',
    fileUrl: sexualityFile,
  },
  {
    id: 'height',
    name: 'Height',
    fileUrl: heightFile,
    note: (
      <>
        (Categories changed for 2023{' '}
        <img
          src={madge}
          class={styles.inlineIcon}
          alt=""
        />{' '}
        )
      </>
    ),
    colors: colorsHeight,
  },
  {
    id: 'trans-chatters',
    name: 'Trans Chatters',
    fileUrl: transFile,
  },
  {
    id: 'location',
    name: 'Location',
    fileUrl: locationFile,
  },
  {
    id: 'salary',
    name: 'Salary',
    fileUrl: salaryFile,
  },
  {
    id: 'education',
    name: 'Education',
    fileUrl: educationFile,
  },
  {
    id: 'vcard',
    name: 'VCARD',
    fileUrl: sexHaversFile,
  },
  {
    id: 'weebs',
    name: 'Weebs',
    fileUrl: weebFile,
  },
  {
    id: 'diet',
    name: 'Diet',
    fileUrl: eatingFile,
  },
  {
    id: 'neurodiversity',
    name: 'Neurodiversity',
    fileUrl: neurodivergenceFile,
  },
  {
    id: 'gayming-frogs',
    name: 'Gayming Frogs',
    fileUrl: gamingFile,
  },
  {
    id: 'years-watched',
    name: 'Years Watched',
    fileUrl: watchedFile,
  },
  {
    id: 'political-activism',
    name: 'Political Activism',
    fileUrl: activismFile,
  },
  {
    id: 'housing',
    name: 'Housing',
    fileUrl: housingFile,
  },
  {
    id: 'discovery',
    name: 'Discovery',
    fileUrl: discoveryFile,
  },
]

export const censusCategories: CensusCategory[] = [
  homeCategory,
  ...barChartSlides.map(({id, name}) => ({
    id,
    name,
  })),
]