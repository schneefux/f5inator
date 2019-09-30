<template>
  <form
    class="flex flex-col items-center"
    @submit.prevent="submit"
  >
    <div>
      <label for="crop-btn-submit" class="step-description">
        Select an area to monitor
      </label>

      <button
        id="crop-btn-submit"
        :disabled="loading"
        type="submit"
        class="ml-3 step-btn rounded"
      >
        <span
          v-show="loading"
          class="loader inline-flex"
        />
        <span v-show="!loading">
          Next
        </span>
      </button>
    </div>

    <div class="mt-3 mx-auto text-center">
      <vue-cropper
        ref="cropper"
        :src="screenshot"
        :crop="onCrop"
        :viewMode="2"
        :data="cropBox"
        :autoCrop="false"
        :rotatable="false"
        :zoomable="false"
        class="mx-auto"
      />
      <button
        :disabled="loading"
        class="step-btn rounded-b"
        @click.prevent="loadMore"
      >
        <span
          v-show="loading"
          class="loader inline-flex"
        />
        <span v-show="!loading">
          Load more
        </span>
      </button>
    </div>
  </form>
</template>

<script>
import VueCropper from 'vue-cropperjs'

async function render(url, height) {
  const params = new URLSearchParams({
    url,
    x: 0,
    y: 0,
    // defaultViewport
    width: 800,
    height,
  })

  const pngBinary = await fetch('/.netlify/functions/render?' + params.toString())
    .then(res => {
      if (res.ok) {
        return res.text()
      } else {
        throw new Error('Invalid URL.')
      }
    })
  const screenshot = 'data:image/png;base64,' + pngBinary

  return screenshot
}

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
    const url = query.url
    const height = query.height || 1200
    const screenshot = await render(url, height)

    return {
      url,
      height,
      screenshot,
    }
  },
  data() {
    return {
      cropBox: {},
      loading: false,
    }
  },
  methods: {
    onCrop(event) {
      this.cropBox = event.detail
    },
    async loadMore() {
      this.height += 600
      this.loading = true

      const screenshot = await render(this.url, this.height)
      this.$refs.cropper.replace(screenshot)

      this.loading = false
    },
    submit() {
      if (!this.loading) {
        this.loading = true
        this.$router.push(this.watchRoute)
      }
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
</style>
