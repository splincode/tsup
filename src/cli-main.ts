import { readFileSync } from 'fs'
import { join } from 'path'
import { cac } from 'cac'
import flat from 'flat'
import { Format, Options } from '.'

function ensureArray(input: string): string[] {
  return Array.isArray(input) ? input : input.split(',')
}

export async function main(options: Options = {}) {
  const cli = cac('tsup')

  cli
    .command('[...files]', 'Bundle files', {
      ignoreOptionDefaultValue: true,
    })
    .option('-d, --out-dir <dir>', 'Output directory', { default: 'dist' })
    .option('--format <format>', 'Bundle format, "cjs", "iife", "esm"', {
      default: 'cjs',
    })
    .option('--minify', 'Minify bundle')
    .option('--minify-whitespace', 'Minify whitespace')
    .option('--minify-identifiers', 'Minify identifiers')
    .option('--minify-syntax', 'Minify syntax')
    .option(
      '--keep-names',
      'Keep original function and class names in minified code'
    )
    .option('--target <target>', 'Bundle target, "es20XX" or "esnext"', {
      default: 'es2017',
    })
    .option('--babel', 'Transform the result with Babel')
    .option(
      '--legacy-output',
      'Output different formats to different folder instead of using different extensions'
    )
    .option('--dts [entry]', 'Generate declaration file')
    .option('--dts-resolve', 'Resolve externals types used for d.ts files')
    .option(
      '--sourcemap [option]',
      'Generate sourcemap, "external", "inline", "both"'
    )
    .option(
      '--watch [path]',
      'Watch mode, if path is not specified, it watches the current folder ".". Repeat "--watch" for more than one path'
    )
    .option('--ignore-watch <path>', 'Ignore custom paths in watch mode')
    .option(
      '--onSuccess <command>',
      'Execute command after successful build, specially useful for watch mode'
    )
    .option('--env.* <value>', 'Define compile-time env variables')
    .option(
      '--inject <file>',
      'Replace a global variable with an import from another file'
    )
    .option('--define.* <value>', 'Define compile-time constants')
    .option('--external <name>', 'Mark specific packages as external')
    .option('--global-name <name>', 'Global variable name for iife format')
    .option('--jsxFactory <jsxFactory>', 'Name of JSX factory function', {
      default: 'React.createElement',
    })
    .option('--jsxFragment <jsxFragment>', 'Name of JSX fragment function', {
      default: 'React.Fragment',
    })
    .option(
      '--inlineDynamicImports',
      'Create a single bundle that inlines dynamic imports'
    )
    .option('--replaceNodeEnv', 'Replace process.env.NODE_ENV')
    .option('--no-splitting', 'Disable code splitting')
    .option('--clean', 'Clean output directory')
    .option(
      '--silent',
      'Supress non-error logs (excluding "onSuccess" process output)'
    )
    .option('--pure <express>', 'Mark specific expressions as pure')
    .option('--metafile', 'Emit esbuild metafile (a JSON file)')
    .action(async (files: string[], flags) => {
      const { build } = await import('.')
      Object.assign(options, {
        ...flags,
      })
      if (files.length > 0) {
        options.entryPoints = files
      }
      if (flags.format) {
        const format = ensureArray(flags.format) as Format[]
        options.format = format
      }
      if (flags.external) {
        const external = ensureArray(flags.external)
        options.external = external
      }
      if (flags.dts || flags.dtsResolve) {
        options.dts = {}
        if (typeof flags.dts === 'string') {
          options.dts.entry = flags.dts
        }
        if (flags.dtsResolve) {
          options.dts.resolve = flags.dtsResolve
        }
      }
      if (flags.inject) {
        const inject = ensureArray(flags.inject)
        options.inject = inject
      }
      if (flags.define) {
        const define: any = flat(flags.define)
        options.define = define
      }
      await build(options)
    })

  cli.help()

  const pkgPath = join(__dirname, '../package.json')
  cli.version(JSON.parse(readFileSync(pkgPath, 'utf8')).version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
