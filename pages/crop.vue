<template>
  <form
    class="flex flex-col items-center"
    @submit.prevent="$router.push(watchRoute)"
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
      <span
        v-show="($nuxt.$loading||{}).show"
        class="loader inline-flex"
      />
      <span
        v-show="!($nuxt.$loading||{}).show"
      >
        Next
      </span>
    </button>
  </form>
</template>

<script>
import VueCropper from 'vue-cropperjs'

export default {
  components: {
    VueCropper,
  },
  // TODO validate
  async asyncData({ query }) {
    const url = query.url || ''

    const pngBinary = await fetch('/.netlify/functions/render?url=' + url)
      .then(res => res.text())
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
      return {
        name: 'watch',
        query: {
          url: this.url,
          x: Math.round(this.cropBox.x),
          y: Math.round(this.cropBox.y),
          width: Math.round(this.cropBox.width),
          height: Math.round(this.cropBox.height),
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
