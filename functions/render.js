const crypto = require('crypto')
const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
// const puppeteer = require('puppeteer')

exports.handler = async (event) => {
  const params = event.queryStringParameters
  const url = decodeURIComponent(params.url)
  const x = 'x' in params ? parseInt(params.x) : undefined
  const y = 'y' in params ? parseInt(params.y) : undefined
  const width = 'width' in params ? parseInt(params.width) : undefined
  const height = 'height' in params ? parseInt(params.height) : undefined

  let browser

  try {
    const executablePath = await chromium.executablePath

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
      // headless: true
    })

    const page = await browser.newPage()
    await page.goto(url, {
      timeout: 7000, // functions timeout is 10s
      waitUntil: ['domcontentloaded'],
    })

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
