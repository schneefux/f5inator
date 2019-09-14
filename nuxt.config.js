export default {
  mode: 'spa',
  head: {
    titleTemplate: '%s - f5inator',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Monitor a website and get a notification when it changes.' }
    ],
  },
  loading: { color: '#9f7aea' },
  css: [
  ],
  plugins: [
  ],
  buildModules: [
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
  ],
  modules: [
    '@nuxtjs/pwa',
  ],
  purgeCSS: {
    whitelistPatterns: [/cropper-.*/, /line-.*/, /point-.*/],
  },
  generate: {
    fallback: true,
  },
}
