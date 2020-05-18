const crypto = require('crypto')
const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)
const unlink = promisify(fs.unlink)

module.exports.render = async function render({ url, x, y, width, height },
    { puppeteer, launch, tmpPath }) {
  let browser

  try {
    console.time(`${url} startup`)
    browser = await puppeteer.launch(launch)
    const page = await browser.newPage()
    page.setViewport({ width: 600, height: Math.max(800, y + height) })
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
    console.timeEnd(`${url} startup`)

    console.time(`${url} navigation`)
    try {
      await page.goto(url, {
        timeout: 4000, // functions timeout is 10s
        waitUntil: ['domcontentloaded'],
      })
    } catch (err) {
      if (err instanceof puppeteer.errors.TimeoutError) {
        console.warn('reached timeout, domcontent is not fully loaded yet')
      } else {
        throw err
      }
    }
    console.timeEnd(`${url} navigation`)

    console.time(`${url} screenshot`)
    const filename = crypto.createHash('sha256').update(url).digest('base64').replace(/\+|\/|=/g, '') + '.png'
    const path = tmpPath + filename
    const screenshot = await page.screenshot({
      path,
      type: 'png',
      encoding: 'base64',
      clip: {
        x,
        y,
        width,
        height,
      },
    })
    await unlink(path)
    console.timeEnd(`${url} screenshot`)

    return screenshot
  } finally {
    if (browser !== undefined) {
      browser.close()
    }
  }
}
