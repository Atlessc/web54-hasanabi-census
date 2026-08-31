export type CensusViewId =
  | "stacked"
  | "trend";

export interface CensusView {
  id: CensusViewId;
  name: string;
}

export const censusViews:
  CensusView[] = [
    {
      id: "stacked",
      name: "Stacked",
    },
    {
      id: "trend",
      name: "Trend",
    },
  ];