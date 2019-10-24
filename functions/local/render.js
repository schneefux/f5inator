const puppeteer = require('puppeteer')
const Koa = require('koa')
const Router = require('@koa/router')

const service = require('../lambda/render/service')

const app = new Koa()
const router = new Router()

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
        headless: true,
      }, tmpPath: './tmp' })
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
