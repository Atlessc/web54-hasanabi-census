import fs from 'fs'
import path from 'path'
import * as esbuild from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssModules from 'postcss-modules'
import { solidPlugin } from 'esbuild-plugin-solid'

const packageJson = (
  await import('./package.json', { with: { type: 'json' } })
).default

const isDev = process.env.NODE_ENV === 'development'
const isWatch = process.env.NODE_ENV === 'watch'
const isDevelopmentBuild = isDev || isWatch

const config = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  jsx: 'automatic',

  define: {
    VERSION: JSON.stringify(packageJson.version),
  },

  loader: {
    '.ttf': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.webp': 'file',
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'dataurl',
    '.mp3': 'file',
    '.txt': 'file',
    '.csv': 'file',
  },

  outdir: 'docs',

  minify: !isDevelopmentBuild,
  treeShaking: !isDevelopmentBuild,
  sourcemap: isDevelopmentBuild ? 'inline' : false,

  plugins: [
    solidPlugin(),

    sassPlugin({
      filter: /\.module\.scss$/,
      async transform(source, _, from) {
        let cssModule

        const { css } = await postcss(
          autoprefixer,
          postcssModules({
            getJSON: (_, json) => {
              cssModule = JSON.stringify(json, null, 2)
            },
          }),
        ).process(source, { from })

        return {
          contents: css,
          pluginData: {
            exports: cssModule,
          },
          loader: 'js',
        }
      },
    }),

    sassPlugin({
      filter: /\.scss$/,
      async transform(source, _, from) {
        return (
          await postcss(autoprefixer).process(source, {
            from,
          })
        ).css
      },
    }),

    {
      name: 'html-file',

      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            return
          }

          const outdir = build.initialOptions.outdir

          if (!outdir) {
            return
          }

          const cssPath = path.join(outdir, 'index.css')

          if (!fs.existsSync(cssPath)) {
            return
          }

          const css = fs.readFileSync(cssPath, 'utf8')

          const liveReloadScript = isDev
            ? `
    <script>
      new EventSource('/esbuild').addEventListener('change', () => {
        location.reload()
      })
    </script>`
            : ''

          const html = `\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The HasanAbi Census</title>
    <script src="index.js" defer></script>${liveReloadScript}
    <style>${css}</style>
</head>
<body>
    <div id="app"></div>
</body>
</html>
`

          fs.writeFileSync(
            path.join(outdir, 'index.html'),
            html,
            'utf8',
          )
        })
      },
    },
  ],
}

if (isDev) {
  const context = await esbuild.context(config)

  // Ensure docs/index.html exists before the browser makes its first request.
  await context.rebuild()

  await context.watch()

  const { hosts, port } = await context.serve({
    servedir: 'docs',
    host: '127.0.0.1',
    port: 8000,
  })

  console.log('')
  console.log('HasanAbi Census dev server running:')
  console.log(`http://${hosts[0]}:${port}`)
  console.log('')
} else if (isWatch) {
  const context = await esbuild.context(config)

  await context.rebuild()
  await context.watch()

  console.log('Watching for changes...')
} else {
  await esbuild.build(config)
}