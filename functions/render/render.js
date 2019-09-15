const crypto = require('crypto')
const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
// const puppeteer = require('puppeteer')
const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

exports.handler = async (event) => {
  const params = event.queryStringParameters
  const url = decodeURIComponent(params.url)
  const x = 'x' in params ? parseInt(params.x) : undefined
  const y = 'y' in params ? parseInt(params.y) : undefined
  const width = 'width' in params ? parseInt(params.width) : undefined
  const height = 'height' in params ? parseInt(params.height) : undefined

  let browser

  try {
    console.time('startup')
    const executablePath = await chromium.executablePath

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
      // headless: true
    })
    const page = await browser.newPage()
    await page.setRequestInterception(true)

    const blockedHostsTxt = await readFile(require.resolve('./blocked_hosts'), 'utf-8')
    const blockedHosts = blockedHostsTxt.split('\n')
    page.on('request', request => {
      const matches = request.url().match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i)
      if (matches && blockedHosts.includes(matches[1])) {
        request.abort()
      } else {
        request.continue()
      }
    })
    console.timeEnd('startup')

    console.time('navigation')
    try {
      await page.goto(url, {
        timeout: 2000, // functions timeout is 10s
        waitUntil: ['domcontentloaded'],
      })
    } catch (err) {
      if (err instanceof puppeteer.errors.TimeoutError) {
        console.warn('reached timeout, domcontent is not fully loaded yet')
      } else {
        throw err
      }
    }
    console.timeEnd('navigation')

    console.time('screenshot')
    const filename = crypto.createHash('sha256').update(url).digest('base64').replace(/\+|\/|=/g, '') + '.png'
    const fullPage = [x, y, width, height].includes(undefined)
    const clip = fullPage ? undefined : { x, y, width, height }
    const screenshot = await page.screenshot({
      path: '/tmp/' + filename,
      // path: './tmp/' + filename,
      type: 'png',
      encoding: 'base64',
      fullPage,
      clip,
    })
    console.timeEnd('screenshot')

    return {
      headers: {
        'Content-Type': 'text/plain',
      },
      statusCode: 200,
      body: screenshot,
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    }
  } finally {
    if (browser !== undefined) {
      browser.close()
    }
  }

}
