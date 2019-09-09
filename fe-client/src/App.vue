<template>
  <v-app id="morgans-player">
    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>{{ title }}</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <router-view @title-change="onTitleChange"/>
    </v-content>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  components: {},
  data: () => ({
    title: 'Morgan\'s Player'
  }),
  created () {
    this.$vuetify.theme.dark = true
  },
  methods: {
    onTitleChange (newTitle) {
      this.title = newTitle
    }
  }
}
</script>
