const puppeteer = require('puppeteer-core')
const Koa = require('koa')
const Router = require('@koa/router')
const fs = require('fs')

const service = require('../lambda/render/service')

const app = new Koa()
const router = new Router()

const tmpPath = process.env.TMP_PATH || './tmp/'

if (!fs.existsSync(tmpPath)){
    fs.mkdirSync(tmpPath)
}

router.get('/.netlify/functions/render', async (ctx) => {
  const params = ctx.request.query
  const url = decodeURIComponent(params.url)
  const x = +params.x
  const y = +params.y
  const width = +params.width
  const height = +params.height

  try {
    const screenshot = await service.render(
      { url, x, y, width, height },
      { puppeteer, launch: {
        executablePath: 'google-chrome-stable',
        headless: true,
      }, tmpPath })
    ctx.body = screenshot
    ctx.URL
    ctx.header['Content-Type'] = 'text/plain'
  } catch (error) {
    console.error(error);
    ctx.throw(400, JSON.stringify(error))
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.API_PORT || 3001)
