<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-blue-900">
    <div class="text-center mt-30vh">
      <h1 class="text-5xl uppercase font-black text-gray-200">
        f5inator
      </h1>
    </div>

    <form
      class="mt-10 flex flex-col items-center text-gray-300"
      @submit.prevent="loadUrl"
    >
      <label for="input-url" class="text-xl font-medium">
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
            id="input-url"
            type="text"
            class="bg-gray-500 text-blue-800 pl-2 py-1 -mr-2 font-semibold"
            required
          />
          <span class="bg-gray-500 py-1 -mr-2 px-2 inline-block">
            {{ urlValid ? '✔' : '❌' }}
          </span>
          <button
            type="submit"
            class="bg-purple-600 px-3 -mr-1 py-1 rounded-r font-semibold"
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
      v-if="screenshot !== undefined"
      class="px-16 mt-20"
    >
      <div class="h-400px overflow-y-scroll mx-auto">
        <vue-cropper
          :src="'data:image/png;base64,' + screenshot"
          :crop="onCrop"
          :viewMode="1"
          :data="cropData"
          :autoCrop="true"
          :autoCropArea="0.2"
          :rotatable="false"
          :zoomable="false"
          class=""
        />
      </div>
    </div>
  </div>
</template>

<script>
import VueCropper from 'vue-cropperjs'

export default {
  components: {
    VueCropper,
  },
  data() {
    return {
      https: true,
      url: '',
      screenshot: undefined,
      cropData: undefined,
    }
  },
  methods: {
    toggleHttps() {
      this.https = !this.https
    },
    async loadUrl() {
      const prefix = 'http' + (this.https ? 's' : '')
      const url = prefix + '://' + this.url
      this.screenshot = await fetch('/.netlify/functions/render?url=' + encodeURIComponent(url))
        .then(res => res.text())
    },
    onCrop(event) {
      this.cropData = event.detail
    },
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

.mt-30vh {
  margin-top: 30vh;
}

.h-400px {
  height: 400px;
}
</style>
