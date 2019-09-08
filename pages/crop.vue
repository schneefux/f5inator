<template>
  <form
    class="flex flex-col items-center"
    @submit.prevent="$router.push(watchRoute)"
  >
    <div>
      <label for="crop-btn-submit" class="step-description">
        Select an area to monitor
      </label>

      <button
        id="crop-btn-submit"
        type="submit"
        class="ml-3 step-btn rounded"
      >
        <span
          v-show="($nuxt.$loading||{}).show"
          class="loader inline-flex"
        />
        <span v-show="!($nuxt.$loading||{}).show">
          Next
        </span>
      </button>
    </div>

    <div class="mt-3 max-h-400px overflow-y-scroll mx-auto">
      <vue-cropper
        :src="screenshot"
        :crop="onCrop"
        :viewMode="2"
        :data="cropBox"
        :autoCrop="false"
        :rotatable="false"
        :zoomable="false"
      />
    </div>
  </form>
</template>

<script>
import VueCropper from 'vue-cropperjs'

export default {
  head() {
    return {
      title: 'Configure ' + new URL(this.url).host,
    }
  },
  components: {
    VueCropper,
  },
  async validate({ query }) {
    try {
      new URL(query.url)
      return true
    } catch (err) {
      return false
    }
  },
  async asyncData({ query }) {
    const url = query.url || ''

    const pngBinary = await fetch('/.netlify/functions/render?url=' + url)
      .then(res => {
        if (res.ok) {
          return res.text()
        } else {
          throw new Error('Invalid URL.')
        }
      })
    const screenshot = 'data:image/png;base64,' + pngBinary

    return {
      url,
      screenshot,
    }
  },
  data() {
    return {
      cropBox: {},
    }
  },
  methods: {
    onCrop(event) {
      this.cropBox = event.detail
    },
  },
  computed: {
    watchRoute() {
      const hasCropbox = ['x', 'y', 'width', 'height'].every(prop => prop in this.cropBox)

      return {
        name: 'watch',
        query: {
          url: this.url,
          ...hasCropbox ? {
            x: Math.round(this.cropBox.x),
            y: Math.round(this.cropBox.y),
            width: Math.round(this.cropBox.width),
            height: Math.round(this.cropBox.height),
          } : {},
        },
      }
    },
  },
}
</script>

<style>
@import 'cropperjs/src/index.css';

.max-h-400px {
  max-height: 400px;
}
</style>
