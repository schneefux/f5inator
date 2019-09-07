<template>
  <div class="flex flex-col items-center">
    <span
      v-show="!changeDetected"
      class="step-description"
    >
      Watching for changes…
    </span>
    <span v-show="!changeDetected">
      Next update in {{ secondsTillNextUpdate }} seconds.
    </span>
    <span
      v-show="changeDetected"
      class="step-description"
    >
      Change detected!
    </span>

    <img
      :src="screenshot"
      class="mt-3 max-h-400px"
    />
  </div>
</template>

<script>
import compareImages from 'resemblejs/compareImages'

export default {
  // TODO validate
  async asyncData({ query }) {
    const url = query.url || ''
    const cropBox = ['x', 'y', 'width', 'height']
      .reduce((box, prop) => prop in query ? {...box, [prop]: +query[prop]} : box, {})

    const URLSearchParams = global.URLSearchParams || require('url').URLSearchParams
    const params = new URLSearchParams(query)
    // TODO when rendering server side, fetch needs an absolute URL
    const pngBinary = await fetch('/.netlify/functions/render?' + params.toString())
      .then(res => res.text())
    const referenceScreenshot = 'data:image/png;base64,' + pngBinary

    return {
      url,
      params,
      referenceScreenshot,
      screenshot: referenceScreenshot,
    }
  },
  data() {
    return {
      screenshot: undefined,
      timer: undefined,
      changeDetected: false,
      notificationsAllowed: false,
      lastUpdate: new Date(),
      timerIntervalSeconds: 15,
      secondsTillNextUpdate: 60,
      refreshIntervalSeconds: 60,
    }
  },
  async created() {
    if (!(Notification.permission in ['denied', 'granted'])) {
      await Notification.requestPermission()
    }
    this.notificationsAllowed = Notification.permission !== 'denied'

    this.timer = setTimeout(() => this.onTick(), this.timerIntervalSeconds * 1000)
  },
  methods: {
    async onTick() {
      const secondsSinceLastUpdate = Math.floor((Date.now() - this.lastUpdate.valueOf()) / 1000)
      this.secondsTillNextUpdate = Math.max(0, this.refreshIntervalSeconds - secondsSinceLastUpdate)
      if (this.secondsTillNextUpdate === 0) {
        await this.refresh()
        this.lastUpdate = new Date()
      }
      if (!this.changeDetected) {
        this.timer = setTimeout(() => this.onTick(), this.timerIntervalSeconds * 1000)
      } else {
        this.timer = undefined
      }
    },
    async refresh() {
      const png = await fetch('/.netlify/functions/render?' + this.params.toString())
        .then(res => res.text())
      this.screenshot = 'data:image/png;base64,' + png

      const options = {
        ignore: 'antialiasing',
      }
      const diff = await compareImages(
        this.referenceScreenshot, this.screenshot, options)
      const score = diff.rawMisMatchPercentage

      if (score > 1) {
        this.changeDetected = true

        if (this.notificationsAllowed) {
          const sw = await navigator.serviceWorker.ready
          const host = new URL(this.url).host
          sw.showNotification(`${host} has changed!`)
        }
      }
    },
  },
  destroyed() {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
    }
  },
}
</script>

<style>
</style>
