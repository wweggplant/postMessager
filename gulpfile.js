const gulp = require('gulp');
const rollup = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve').default;
const babel = require('@rollup/plugin-babel').default;
const del = require('del')
const rollupTypescript = require('rollup-plugin-typescript');
const pkg = require('./package.json');
var fs = require( 'fs' )
const devEnv = ['development','production'];
const distName = `${pkg.name}.${pkg.version}`

const cleanDistDir = mode => () => {
  return devEnv.includes(mode) ? del(['./dist/', './demo/js/*']): undefined
}
const cleanUnitDir = () => {
  return del(['./tests/unit/front-end/build/*'])
}
const extensions = [
  '.js', '.jsx', '.ts', '.tsx',
];

const globalClassName = 'PostMessager';
const rollupConfig = {
  input: 'src/index.ts',

  // Specify here external modules which you don't want to include in your bundle (for instance: 'lodash', 'moment' etc.)
  // https://rollupjs.org/guide/en#external-e-external

  plugins: [
    // Allows node_modules resolution
    resolve({ extensions }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Compile TypeScript/JavaScript files
    babel({
      extensions,
      babelHelpers: 'bundled',
      include: ['src/**/*'],
    }),
  ],
}
const rollupBuild = (entry,outDir,moduleName)  => {
  return  rollup.rollup(rollupConfig).then( bundle => {
    bundle.write({
      file: `./dist/${pkg.main}`,
      format: 'cjs',
    })
    bundle.write({
      file: `./dist/${pkg.module}`,
      format: 'es',
    })
    
    return bundle.write({
      file: `./dist/${pkg.browser}`,
      format: 'iife',
      name: globalClassName,
      // https://rollupjs.org/guide/en#output-globals-g-globals
      globals: {},
    })
  }).then(file =>{
    fs.copyFile(`./dist/${pkg.browser}`,`./demo/js/${pkg.browser}`,function(err){
      if(err) console.log(err)
      else console.log('copy file succeed');
    })
  })
}

const buildTs = done => {
  //这里配置多页面js配置打包就可以了，传入值改为数组拼接url可以实现多入口插件js打包
  rollupBuild('./src/index.ts', `./dist/postMessager.${pkg.version}.js`, 'PostMessager')
  done()
}

function unitTest()  {

}

gulp.task('default',gulp.series(cleanDistDir('development'), cleanUnitDir, buildTs))
