<template>
  <div class="flex flex-col items-center">
    <span
      v-show="!changeDetected"
      class="step-description"
    >
      Watching for changes…
    </span>
    <span v-show="timer !== undefined">
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
      refreshRateSeconds: 60,
      secondsTillNextUpdate: 60,
    }
  },
  async created() {
    if (!(Notification.permission in ['denied', 'granted'])) {
      await Notification.requestPermission()
    }
    this.notificationsAllowed = Notification.permission !== 'denied'

    this.timer = setInterval(() => this.onTick(), 15000)
  },
  methods: {
    onTick() {
      const secondsSinceLastUpdate = Math.floor(Date.now() - this.lastUpdate.valueOf() / 1000)
      const secondsTillNextUpdate = Math.max(0, this.refreshRateSeconds - secondsSinceLastUpdate)
      this.secondsTillNextUpdate = secondsTillNextUpdate
      if (secondsTillNextUpdate === 0) {
        this.refresh()
      }
    },
    async refresh() {
      const png = await fetch('/.netlify/functions/render?' + this.params.toString())
        .then(res => res.text())

      this.screenshot = 'data:image/png;base64,' + png
      this.lastUpdate = new Date()

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
          sw.showNotification(`${this.url} has changed!`)
        }

        clearInterval(this.timer)
        this.timer = undefined
      }
    },
  },
  destroyed() {
    clearInterval(this.timer)
  },
}
</script>

<style>
</style>
