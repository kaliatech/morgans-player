<template>
  <v-container>
    <v-row>
      <v-col>
        <h3>
          {{ playlistName }} <span v-if="selectedS3Obj"> - {{ selectedS3Obj.key }}</span>
        </h3>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-if="playlistHasVideos === false">
        <audio ref="audioPlayer" class="media-player audio-player playlist-audio-only" controls @pause="onMediaPause"
               @ended="onMediaEnded"
               @play="onMediaPlay" :style="selectedS3Obj && !isVideoFile(selectedS3Obj.key) ? '' : 'display:none'">
          <source v-if="selectedS3Obj" :src="selectedS3Obj.signedUrl" type="audio/mpeg"/>
        </audio>
      </v-col>
      <v-col v-if="playlistHasVideos === true">
        <audio ref="audioPlayer" class="media-player audio-player playlist-has-videos" controls @pause="onMediaPause"
               @ended="onMediaEnded"
               @play="onMediaPlay" :style="selectedS3Obj && !isVideoFile(selectedS3Obj.key) ? '' : 'display:none'">
          <source v-if="selectedS3Obj" :src="selectedS3Obj.signedUrl" type="audio/mpeg"/>
        </audio>
        <video ref="videoPlayer" class="media-player video-player playlist-has-videos" controls @pause="onMediaPause"
               @ended="onMediaEnded"
               @play="onMediaPlay" :style="selectedS3Obj && isVideoFile(selectedS3Obj.key) ? '' : 'display:none'">
          <source v-if="selectedS3Obj" :src="selectedS3Obj.signedUrl" :type="getMimeType(selectedS3Obj.key)"/>
        </video>
      </v-col>
    </v-row>
    <v-row>
      <v-col>

        <v-card
          v-if="data.s3Objs"
          class="mx-auto"
          tile>

          <v-list-item v-for="s3Obj in data.s3Objs" :key="s3Obj.key" two-line @click="onPlayPauseClick(s3Obj)"
                       :class="selectedS3Obj === s3Obj ? 'v-list-item--active' : ''">
            <v-list-item-avatar>
              <v-icon v-if="selectedS3Obj === s3Obj && mediaState === MEDIA_STATE.PLAYING" dark large>mdi-pause
              </v-icon>
              <v-icon v-else dark large>mdi-play-circle</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{ s3Obj.title }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ formatFilesize(s3Obj.size) }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'

import filesize from 'filesize'

const MEDIA_STATE = {
  'PLAYING': 'playing',
  'PAUSED': 'paused',
  'STOPPED': 'stopped'
}

export default {
  components: {},
  data: () => {
    return {
      playlistName: '',
      data: {},
      selectedS3Obj: null,
      mediaState: MEDIA_STATE.STOPPED,
      MEDIA_STATE: MEDIA_STATE,
      mediaPlayer: null
    }
  },
  computed: {
    playlistHasVideos () {
      if (!this.data || !this.data.s3Objs) {
        return false
      }
      return this.data.s3Objs.some((it) => this.isVideoFile(it.key))
    }
  },
  created () {
    this.playlistName = this.$route.params.playlist
    this.$emit('title-change', 'Loading "' + this.playlistName + '"...')
    console.log('Making network call...')

    const config = {
      headers: {
        accept: 'application/json'
      }
    }
    // TODO: Make this env specific
    axios.get('https://1wjtfz73pe.execute-api.us-west-1.amazonaws.com/beta/playlist/' + this.playlistName, config)
      .then((resp) => {
        let respData = resp.data
        respData.s3Objs = respData.s3Objs.filter((s3Obj) => !s3Obj.key.endsWith('playlist.json'))
        respData.s3Objs.forEach((s3Obj) => {
          s3Obj.title = s3Obj.key.replace(respData.path + '/', '')
        })
        this.data = respData
        if (!this.data.playlist.title) {
          this.data.playlist.title = this.playlistName
        }
        this.$emit('title-change', this.data.playlist.title)
      })
      .catch((err) => {
        console.log('Error with network call', err)
      })
  },
  // computed: {
  //   selectedS3Obj () {
  //     if (this.data && this.data.keys) {
  //       return this.data.keys[this.selectedS3ObjIdx]
  //     }
  //     return null
  //   }
  // },
  watch: {
    selectedS3Obj: function (newVal, oldVal) {
      if (this.mediaPlayer) {
        this.mediaPlayer.pause()
      }

      this.$nextTick(() => {
        if (!this.$refs) {
          return
        }
        if (this.isVideoFile(this.selectedS3Obj.key)) {
          this.mediaPlayer = this.$refs.videoPlayer
        } else {
          this.mediaPlayer = this.$refs.audioPlayer
        }
        this.mediaPlayer.load()
        this.mediaPlayer.play()
        this.mediaState = MEDIA_STATE.PLAYING
      })
    }
  },
  methods: {
    onPlayPauseClick (s3Obj) {
      if (s3Obj === this.selectedS3Obj && this.mediaState === MEDIA_STATE.PLAYING) {
        this.mediaState = MEDIA_STATE.PAUSED
        this.mediaPlayer.pause()
      } else if (s3Obj === this.selectedS3Obj) {
        this.mediaPlayer.play()
        this.mediaState = MEDIA_STATE.PLAYING
      } else {
        this.selectedS3Obj = s3Obj
      }
    },
    onMediaPlay () {
      this.mediaState = MEDIA_STATE.PLAYING
    },
    onMediaPause () {
      this.mediaState = MEDIA_STATE.PAUSED
    },
    onMediaEnded () {
      this.mediaState = MEDIA_STATE.STOPPED
      if (this.data.s3Objs.slice(-1) !== this.selectedS3Obj) {
        this.selectedS3Obj = this.data.s3Objs[this.data.s3Objs.indexOf(this.selectedS3Obj) + 1]
      }
    },
    isVideoFile (filename) {
      return this.getMimeType(filename).startsWith('video')
    },
    getMimeType (filename) {
      if (!filename) {
        return ''
      }
      const ext = filename.split('.').pop()
      switch (ext) {
        case 'mov':
          return 'video/quicktime'
        case 'mp3':
          return 'audio/mpeg'
        case 'mp4':
          return 'video/mp4'
        case 'wav':
          return 'audio/wav'
        default:
          return ''
      }
    },
    formatFilesize (size) {
      return filesize(size, { round: 1 })
    }
  }
}
</script>
<style>
  .v-list-item {
    border-bottom: 2px solid gray;
  }

  .media-player {
    width: 100%;
  }

  .playlist-audio-only {
  }

  .playlist-has-videos {
    height: 20rem;
  }

  @-webkit-keyframes spin /* Safari and Chrome */
  {
    from {
      -webkit-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    to {
      -webkit-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  @keyframes spin {
    from {
      -ms-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -webkit-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    to {
      -ms-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -webkit-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  .spin {
    -webkit-animation: spin 2s linear infinite;
    -moz-animation: spin 2s linear infinite;
    -ms-animation: spin 2s linear infinite;
    -o-animation: spin 2s linear infinite;
    animation: spin 2s linear infinite;
  }
</style>
