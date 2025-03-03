// this file runs the tests in test/browser*

// you can add "CHROME_BIN=/usr/bin/chromium" to .env file
// to not have to type it every time
require('dotenv').config()

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
console.log({argv})
const {file, benchmarkOptionsName} = argv

if (!file) {
  throw Error('karma missing argument --file')
}
if (!benchmarkOptionsName) {
  throw Error('karma missing argument --benchmarkOptionsName')
}

// same as .mocharc.js
const mochaConfig = {
  // set large value for manual debugging
  timeout: 600_000,
}
if (process.env.CI) {
  // set small value for timing out CI
  mochaConfig.timeout = 300_000
}

// possible to add flags when launching the browser
const CustomChrome = {
  base: 'ChromeHeadless',
  flags: ['--disable-web-security', '--no-sandbox'],
  debug: true,
}

const DebugChrome = {
  base: 'Chrome',
  flags: ['--disable-web-security', '--auto-open-devtools-for-tabs', '--window-size=800,600', '--no-sandbox'],
  debug: true,
}

// choose which browser you prefer
let browsers = [
  // 'FirefoxHeadless',
  'CustomChrome',
  // 'DebugChrome',
]

// use headless for manual debugging
if (process.env.HEADLESS) {
  browsers = ['CustomChrome']
}

// add firefox during CI
// make sure non-headless DebugChrome is not included as it breaks the CI
if (process.env.CI) {
  browsers = ['CustomChrome', 'FirefoxHeadless']
}

// inject browser code before each test file
let codeToInjectBefore = ''

// add benchmarkOptionsName from CLI arg --benchmarkOptionsName
codeToInjectBefore += `
  window.benchmarkOptionsName = '${benchmarkOptionsName}';
`

// inject debug env variable to be able to do `DEBUG=plebbit:* npm run test`
if (process.env.DEBUG) {
  codeToInjectBefore += `
      localStorage.debug = '${process.env.DEBUG.replaceAll(`"`, '')}';
    `
}

// import webpacked node_modules and a custom file from CLI arg --file
const files = [
  'webpacked/**/node_modules*',
  'webpacked/' + file
]

module.exports = function (config) {
  config.set({
    frameworks: ['mocha'],
    client: {
      mocha: mochaConfig,
    },
    plugins: [
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-mocha'),
      require('karma-spec-reporter'),
      injectCodeBeforePlugin,
    ],

    basePath: '../',
    files,
    exclude: [],

    preprocessors: {
      // inject code to run before each test
      '**/*.js': ['inject-code-before'],
    },

    // chrome with disabled security
    customLaunchers: {CustomChrome, DebugChrome},

    // list of browsers to run the tests in
    browsers,

    // don't watch, run once and exit
    singleRun: true,
    autoWatch: false,

    // how the test logs are displayed
    reporters: ['spec'],

    port: 9371,
    colors: true,
    logLevel: config.LOG_INFO,
    // logLevel: config.LOG_DEBUG,
    browserNoActivityTimeout: mochaConfig.timeout,
    browserDisconnectTimeout: mochaConfig.timeout,
    browserDisconnectTolerance: 5,
  })
}

function injectCodeBeforeFactory() {
  return (content, file, done) => done(codeToInjectBefore + content)
}

const injectCodeBeforePlugin = {
  'preprocessor:inject-code-before': ['factory', injectCodeBeforeFactory],
}
