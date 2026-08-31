export type CensusViewId =
  | 'snapshot'
  | 'trend'

export interface CensusView {
  id: CensusViewId
  name: string
}

export const censusViews:
  CensusView[] = [
  {
    id: 'snapshot',
    name: 'Snapshot',
  },
  {
    id: 'trend',
    name: 'Trend',
  },
]