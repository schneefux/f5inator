const crypto = require('crypto')
const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')
// const puppeteer = require('puppeteer')

exports.handler = async (event) => {
  const url = decodeURIComponent(event.queryStringParameters.url)
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
      waitUntil: ['domcontentloaded', 'networkidle0'],
    })

    const filename = crypto.createHash('sha256').update(url).digest('base64').replace(/\+|\/|=/g, '') + '.png'
    const screenshot = await page.screenshot({
      path: '/tmp/' + filename,
      // path: './tmp/' + filename,
      type: 'png',
      fullPage: true,
      encoding: 'base64',
      // clip: { x, y, width, height }
    })

    return {
      headers: {
        'Content-Type': 'text/plain',
      },
      statusCode: 200,
      body: screenshot,
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: error,
    }
  } finally {
    if (browser !== undefined) {
      browser.close()
    }
  }

}
