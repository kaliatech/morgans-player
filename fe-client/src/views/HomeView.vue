<template>
  <v-container class="fill-height"
               fluid>
    <v-row align="center"
           justify="center">
      <HelloWorld/>
    </v-row>
  </v-container>
</template>
<script>
import HelloWorld from '../components/HelloWorld'

export default {
  components: {
    HelloWorld
  }
}
</script>
