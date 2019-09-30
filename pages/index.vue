<template>
  <form
    class="flex flex-col items-center"
    @submit.prevent="submit"
  >
    <label for="location-input" class="step-description">
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
          v-model="location"
          id="location-input"
          type="text"
          class="bg-gray-500 text-blue-800 pl-2 py-1 -mr-2 font-semibold w-32 md:w-auto"
          required
        />
        <span class="bg-gray-500 py-1 -mr-2 px-2 inline-block">
          {{ locationValid ? '✔' : '❌' }}
        </span>
        <button
          type="submit"
          class="step-btn -mr-1 rounded-r"
        >
          <span
            v-show="loading"
            class="loader inline-flex"
          />
          <span v-show="!loading">
            Go
          </span>
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
</template>

<script>
export default {
  head() {
    return {
      titleTemplate: '',
    }
  },
  data() {
    return {
      https: true,
      location: '',
      loading: false,
    }
  },
  methods: {
    toggleHttps() {
      this.https = !this.https
    },
    submit() {
      if (!this.loading) {
        this.loading = true
        this.$router.push(this.cropRoute)
      }
    },
  },
  computed: {
    cropRoute() {
      return {
        name: 'crop',
        query: {
          url: (this.https ? 'https://' : 'http://') + this.location,
        },
      }
    },
    locationValid() {
      try {
        new URL('http://' + this.location)
        return true
      } catch (e) {
        return false
      }
    },
  },
}
</script>

<style>
</style>
