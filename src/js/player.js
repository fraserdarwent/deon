/**
 * Object to store player state and functions
 * @type {{audio: HTMLAudioElement, listeners: {playing: Event, paused: Event, seletedsong: Event, changedvolume: Event, updatedPlayer: Event}, song: {}, currentTime: {percent: (function(): number), pretty: (function(): {minutes: number, seconds})}, duration: {pretty: (function(): {minutes: number, seconds})}, events: {}, dispatchEvent: player.dispatchEvent, addEventListener: player.addEventListener, select: player.select, pause: player.pause, previous: player.previous, next: player.next, seek: player.seek, setVolume: player.setVolume, updatePlayer: player.updatePlayer, mute: player.mute, updateControls: player.updateControls}}
 */
const player = {
  audio: new Audio(),
  listeners: {
    playing: new Event('playing'),
    paused: new Event('paused'),
    seletedsong: new Event('selectedsong'),
    changedvolume: new Event('changedvolume'),
    updatedPlayer: new Event('updatedPlayer')
  },
  /**
   * Object to store current song
   */
  song: {},
  /**
   * Functions for calculating and displaying the current position in song
   */
  currentTime: {
    percent: function () {
      return player.audio.currentTime / player.audio.duration * 100
    },
    pretty: function () {
      return {
        minutes: Math.floor(player.audio.currentTime / 60),
        seconds: pad(Math.floor(player.audio.currentTime - Math.floor(player.audio.currentTime / 60) * 60))
      }
    }
  },
  /**
   * Functions for displaying and displaying duration of current song
   */
  duration: {
    pretty: function () {
      return {
        minutes: Math.floor(player.audio.duration / 60),
        seconds: pad(Math.floor(player.audio.duration - Math.floor(player.audio.duration / 60) * 60))
      }
    },
  },
  /**
   * Object to store key/pair values for listeners and events
   */
  events: {},
  /**
   * Dispatch all events for the listener, if it exists
   * @param listener
   */
  dispatchEvent: function (listener) {
    if (this.events[listener.type]) {
      this.events[listener.type].forEach((event) => {
        event()
      })
    }
  },
  /**
   * Create empty array if it does not already exist
   * Add event to array of existing events
   * @param listener
   * @param event
   */
  addEventListener: function (listener, event) {
    this.events[listener.type] = this.events[listener.type] ? this.events[listener.type].push(event) : [event]
  },
  /**
   * Select a new song
   * If currently playing song is selected, pause or resume depending on state
   * @param event
   * @param element
   */
  select: function () {
    if (this.dataset && this.dataset.playLink === player.audio.src) {
      player.pause()
    } else {
      var songs = findNodes(controls.selectors.song, this.parentElement.parentElement.parentElement)

      if (songs){
        var index = parseInt(this.dataset.index)

        player.song = songs[index]
        player.dispatchEvent(player.listeners.seletedsong)
        player.song.next = index + 1 < songs.length ? getNextSong(index, songs) : null

        /**
         * Helper function to form a linked list of songs
         * @param index
         * @param songs
         * @returns {*}
         */
        function getNextSong(index, songs) {
          var song = songs[index + 1]

          song.previous = 0 < index - 1 ? songs[index] : null
          song.next = index + 1 < songs.length - 1 ? getNextSong(index + 1, songs) : null
          return song
        }
      }
    }
  },
  /**
   * Pause or resume current song based on state
   */
  pause: function () {
    if (this.audio.paused) {
      this.audio.play()
    } else {
      this.audio.pause()
    }
  },
  /**
   * Select previous song in queue by decrementing index by 1
   */
  previous: function () {
    if (this.song && this.song.previous){
      this.song = this.song.previous
      this.dispatchEvent(this.listeners.seletedsong)
    }
  },
  /**
   * Select next song in queue by incrementing index by 1
   */
  next: function () {
    if (this.song && this.song.next){
      this.song = this.song.next
      this.dispatchEvent(this.listeners.seletedsong)
    }
  },
  /**
   * Seek to position in song based on value between 0 and 1
   * @param fraction
   */
  seek: function (fraction) {
    this.audio.currentTime = fraction * this.audio.duration
  },
  /**
   * Set volume based on value between 0 and 1
   * @param volume
   */
  setVolume: function (volume) {
    this.audio.volume = volume
    this.dispatchEvent(this.listeners.changedvolume)
  },
  /**
   * Update the player timestamp and progress bar
   * Only call from requestAnimationFrame
   */
  updatePlayer: function () {
    controls.currentTimes().forEach((control) => {
      control.textContent = `${this.currentTime.pretty().minutes}:${this.currentTime.pretty().seconds}`
    })
    controls.scrubs.inners().forEach((control) => {
      control.style.width = `${this.currentTime.percent()}%`
    })
    this.dispatchEvent(this.listeners.updatedPlayer)
  },
  /**
   * Based on current volume, either store current volume and mute player, or set volume to previously stored volume
   */
  mute: function() {
    if (this.audio.volume === 0){
      this.audio.volume = this.audio.lastVolume || 0
    } else {
      this.audio.lastVolume = this.audio.volume
      this.audio.volume = 0
    }
    this.dispatchEvent(this.listeners.changedvolume)
  },
  /**
   * Update controls
   * Could be bundled in with updatePlayer, but do not want unnecessary DOM operations in that
   * @param state
   */
  updateControls: function (state) {
    controls.pauses().forEach((element) => {
      const icon = element.firstElementChild

      if (element.state){
        icon.classList.toggle(element.state, false)
      }
      icon.classList.toggle(state, true)
      element.state = state
    })
    controls.songs().forEach((element) => {
      const icon = element.firstElementChild

      if (element.state){
        icon.classList.toggle(element.state, false)
      }
      icon.classList.toggle(controls.styles.paused, true)
      element.state = controls.styles.paused
      if (element.dataset.playLink === this.audio.src){
        if (element.state){
          icon.classList.toggle(element.state, false)
        }
        icon.classList.toggle(state, true)
        element.state = state
      }
    })
  }
}

/***
 * Configure audio defaults
***/
player.audio.autoplay = true

/***
 * Add event listeners to player object
 ***/
player.addEventListener(player.listeners.seletedsong, function selectedSong() {
  this.audio.src = this.song.dataset.playLink
}.bind(player))

player.addEventListener(player.listeners.changedvolume, function changedVolume() {
  requestAnimationFrame(() => {
    controls.volumes.inners().forEach((control) => { control.style.height = `${this.audio.volume * 100}%` })
  })
}.bind(player))

player.addEventListener(player.listeners.paused, function paused() {
  this.updateControls.bind(this)(controls.styles.paused)
}.bind(player))

player.addEventListener(player.listeners.playing, function playing() {
  this.updateControls.bind(this)(controls.styles.playing)
}.bind(player))

player.addEventListener(player.listeners.updatedPlayer, function draw() {
  if (!this.audio.paused){
    requestAnimationFrame(this.updatePlayer.bind(this))
  }
}.bind(player))

/***
 * Add event listener's to player audio object
 */
player.audio.addEventListener('loadstart', function play() {
  this.updateControls.bind(this)(controls.styles.loading)
}.bind(player))

player.audio.addEventListener('timeupdate', function timeUpdate() {
  if (this.audio.paused){
    requestAnimationFrame(this.updatePlayer.bind(this))
  }
}.bind(player))

player.audio.addEventListener('playing', function play() {
  requestAnimationFrame(this.updatePlayer.bind(this))
  this.dispatchEvent(this.listeners.playing)
}.bind(player))

player.audio.addEventListener('loadedmetadata', function loadedMetadata() {
  requestAnimationFrame(() => {
    controls.titles().forEach((control) => {
      control.textContent = `${this.song.attributes.getNamedItem('data-title').textContent}`
    })
  })
}.bind(player))

player.audio.addEventListener('pause', function pause() {
  this.dispatchEvent(this.listeners.paused)
}.bind(player))

player.audio.addEventListener('durationchange', function durationChange() {
  requestAnimationFrame(() => {
    controls.durations().forEach((control) => { control.textContent = `${this.duration.pretty().minutes}:${this.duration.pretty().seconds}` })
  })
}.bind(player))

function pad(string, length) {
  if (0 < length){
    return pad(string, length - 1)
  }
  return String("0" + string)
    .slice(-2)
}
