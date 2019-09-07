<template>
  <v-app id="inspire">
    <v-app-bar
      app
      clipped-left
    >
      <v-toolbar-title>Morgan's Player</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container
        class=""
        fluid
      >
        <v-row
          align="left"
          justify="top"
        >
          <v-col class="shrink">
            <router-view/>
          </v-col>
        </v-row>
      </v-container>
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
  data: () => ({}),
  created () {
    this.$vuetify.theme.dark = true
  }
}
</script>
