<template>
  <div class="min-h-screen flex flex-col bg-blue-900">
    <div class="text-center mt-40vh">
      <h1 class="text-5xl uppercase font-black text-gray-200">
        f5inator
      </h1>
    </div>

    <div class="mt-10 px-8 md:px-16 text-gray-300">
      <form
        v-show="step === 0"
        class="flex flex-col items-center"
        @submit.prevent="submitUrl"
      >
        <label for="url-input" class="step-description">
          Enter a website
        </label>
        <div class="mt-3 relative">
          <div class="rounded bg-gray-400 text-lg">
            <span
              class="pl-2 font-mono font-semibold inline-block"
              :class="{
                'text-green-600': https,
                'text-blue-600': !https,
              }"
              @click="toggleHttps"
            >
              http{{ https ? 's' : '' }}://
            </span>
            <input
              v-model="url"
              id="url-input"
              type="text"
              class="bg-gray-500 text-blue-800 pl-2 py-1 -mr-2 font-semibold w-32 md:w-auto"
              required
            />
            <span class="bg-gray-500 py-1 -mr-2 px-2 inline-block">
              {{ urlValid ? '✔' : '❌' }}
            </span>
            <button
              type="submit"
              class="step-btn -mr-1 rounded-r"
            >
              Go
            </button>
          </div>
          <div
            class="absolute top-0 mt-8 ml-6"
            @click="toggleHttps"
          >
            <div
              class="ml-4 w-0 border-4"
              style="border-color: transparent transparent black transparent"
            >
            </div>
            <div class="px-2 py-1 text-center rounded-lg bg-black">
              <p class="text-xl">
                {{ https ? '🔒' : '🔓' }}
              </p>
            </div>
          </div>
        </div>
      </form>

      <div
        v-show="step === 1"
        class="mx-auto loader"
      />

      <form
        v-if="screenshot !== undefined"
        v-show="step === 2"
        class="flex flex-col items-center"
        @submit.prevent="submitCrop"
      >
        <label for="crop-btn-submit" class="step-description">
          Select an area to monitor
        </label>

        <div class="mt-3 max-h-400px overflow-y-scroll mx-auto">
          <vue-cropper
            :src="screenshot"
            :crop="onCrop"
            :viewMode="2"
            :data="cropBox"
            :autoCrop="true"
            :autoCropArea="0.2"
            :rotatable="false"
            :zoomable="false"
            class=""
          />
        </div>

        <button
          id="crop-btn-submit"
          type="submit"
          class="mt-3 step-btn rounded"
        >
          Next
        </button>
      </form>

      <div
        v-show="step === 3"
        class="mx-auto loader"
      />

      <form
        v-show="step === 4"
        class="flex flex-col items-center"
        @submit.prevent="loadScreenshot"
      >
        <span
          v-show="!changeDetected"
          class="step-description"
        >
          Watching for changes…
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
      </form>
    </div>
  </div>
</template>

<script>
import VueCropper from 'vue-cropperjs'
import compareImages from 'resemblejs/compareImages'

export default {
  components: {
    VueCropper,
  },
  data() {
    return {
      step: 0,
      https: true,
      url: '',
      cropBox: {},
      screenshot: undefined,
      referenceScreenshot: undefined,
      timer: undefined,
      notificationsAllowed: false,
      changeDetected: false,
    }
  },
  methods: {
    toggleHttps() {
      this.https = !this.https
    },
    async submitUrl() {
      this.step++
      await this.loadScreenshot()
      this.step++
    },
    async submitCrop() {
      this.step++
      await this.loadScreenshot()
      this.referenceScreenshot = this.screenshot

      if (!(Notification.permission in ['denied', 'granted'])) {
        await Notification.requestPermission()
      }
      this.notificationsAllowed = Notification.permission !== 'denied'

      this.timer = setInterval(() => this.onTick(), 60000)
      this.step++
    },
    async loadScreenshot() {
      const prefix = 'http' + (this.https ? 's' : '')

      const params = new URLSearchParams()
      params.append('url', prefix + '://' + this.url)
      for (const prop of ['x', 'y', 'height', 'width']) {
        if (prop in this.cropBox) {
          params.append(prop, Math.round(this.cropBox[prop]))
        }
      }

      const png = await fetch('/.netlify/functions/render?' + params.toString())
        .then(res => res.text())

      this.screenshot = 'data:image/png;base64,' + png
    },
    async onTick() {
      await this.loadScreenshot()

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
    onCrop(event) {
      this.cropBox = event.detail
    },
  },
  destroyed() {
    clearInterval(this.timer)
  },
  computed: {
    urlValid() {
      try {
        new URL('http://' + this.url)
        return true
      } catch (e) {
        return false
      }
    },
  },
}
</script>

<style>
@import 'cropperjs/src/index.css';

.min-h-screen {
  min-height: 100vh;
}

.mt-40vh {
  margin-top: 40vh;
}

.max-h-400px {
  max-height: 400px;
}

.step-description {
  @apply text-xl font-medium;
}

.step-btn {
  @apply bg-purple-600 px-3 py-1 font-semibold;
}

.loader {
  @apply w-16 h-16 rounded-full;
  border: 0.5rem solid theme('colors.gray.300');
  border-top: 0.5rem solid theme('colors.purple.500');
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
