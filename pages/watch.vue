<template>
  <div class="flex flex-col items-center">
    <p
      v-show="!changeDetected"
      class="step-description"
    >
      Watching for changes on {{ host }}…
    </p>
    <p>
      Next update: In {{ tillNextUpdateFormatted }}.
    </p>
    <div
      v-show="!changeDetected"
      class="text-sm"
    >
      <span>
        Updating every {{ refreshIntervalFormatted }}.
      </span>
      <button
        v-show="refreshIntervalSeconds > 120"
        class="ml-2 mt-2 step-btn rounded"
        @click="increaseUpdateFrequency"
      >
        Update faster
      </button>
    </div>
    <p
      v-show="changeDetected"
      class="step-description"
    >
      Change detected!
    </p>

    <img
      :src="screenshot"
      class="mt-4 max-h-400px"
    />
  </div>
</template>

<script>
import compareImages from 'resemblejs/compareImages'

function formatIntervalSeconds(seconds) {
  if (seconds > 90) {
    return Math.ceil(seconds / 60) + ' minutes'
  }

  return seconds + ' seconds'
}

export default {
  head() {
    return {
      title: 'Watching ' + this.host,
    }
  },
  async validate({ query }) {
    try {
      new URL(query.url)
      // should include all 4 properties or none
      return [0, 4].includes(
        ['x', 'y', 'width', 'height']
          .filter(prop => prop in query)
          .length
      )
    } catch (err) {
      return false
    }
  },
  async asyncData({ query }) {
    const params = new URLSearchParams(query)
    const pngBinary = await fetch('/.netlify/functions/render?' + params.toString())
      .then(res => {
        if (res.ok) {
          return res.text()
        } else {
          throw new Error('Invalid URL.')
        }
      })
    const referenceScreenshot = 'data:image/png;base64,' + pngBinary

    return {
      url: query.url,
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
      secondsTillNextUpdate: 1800,
      refreshIntervalSeconds: 1800,
    }
  },
  async created() {
    if (!(Notification.permission in ['denied', 'granted'])) {
      await Notification.requestPermission()
    }
    this.notificationsAllowed = Notification.permission !== 'denied'

    this.timer = setTimeout(() => this.onTick(), this.timerIntervalSeconds * 1000)
  },
  computed: {
    refreshIntervalFormatted() {
      return formatIntervalSeconds(this.refreshIntervalSeconds)
    },
    tillNextUpdateFormatted() {
      return formatIntervalSeconds(this.secondsTillNextUpdate)
    },
    host() {
      return new URL(this.url).host
    },
  },
  methods: {
    increaseUpdateFrequency() {
      const reducedInterval = Math.ceil(this.refreshIntervalSeconds / 1.5 / 60) * 60
      this.refreshIntervalSeconds = reducedInterval

      if (this.timer !== undefined) {
        clearInterval(this.timer)
      }
      this.onTick()
    },
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

      if (score > 0) {
        this.changeDetected = true

        if (this.notificationsAllowed) {
          const sw = await navigator.serviceWorker.ready
          sw.showNotification(`${this.host} has changed!`)
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
