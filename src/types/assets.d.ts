declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

declare module '*.scss'

declare module '*.csv' {
  const url: string
  export default url
}