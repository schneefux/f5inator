const chromium = require('chrome-aws-lambda')
const puppeteer = require('puppeteer-core')

const service = require('./service')

exports.handler = async (event) => {
  const params = event.queryStringParameters
  const url = decodeURIComponent(params.url)
  const x = +params.x
  const y = +params.y
  const width = +params.width
  const height = +params.height

  try {
    const screenshot = await service.render(
      { url, x, y, width, height },
      { puppeteer, launch: {
        executablePath: await chromium.executablePath,
        args: chromium.args,
        executablePath: executablePath,
        headless: chromium.headless,
      }, tmpPath: '/tmp/' })
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
  }
}
