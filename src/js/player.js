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
   * Boolean to store whether the user currently has shuffle selected
   */
  shuffling: true,
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
    if (player.events[listener.type]) {
      player.events[listener.type].forEach((event) => {
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
   */
  select: function () {
    if (this.dataset && this.dataset.playLink === player.audio.src) {
      player.pause()
    } else {
      const songs = findNodes(controls.songs.selector, this.closest('.context'))

      if (songs) {
        const index = parseInt(this.dataset.index)

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
          const song = songs[index + 1]

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
    if (player.audio.paused) {
      player.audio.play()
    } else {
      player.audio.pause()
    }
  },
  /**
   * Invert shuffling
   */
  shuffle: function () {
    this.shuffling = !this.shuffling
  },
  /**
   * Select previous song in queue by going back up linked list
   */
  previous: function () {
    if (player.song && player.song.previous) {
      player.song = player.song.previous
      player.dispatchEvent(player.listeners.seletedsong)
    }
  },
  /**
   * Select next song in queue by following linked list or selecting at random
   */
  next: function () {
    if (player.song && player.song.next) {
      if (player.shuffling) {
        //Select random song
      }
    } else {
      player.song = this.song.next
    }
    player.dispatchEvent(player.listeners.seletedsong)
  },
  /**
   * Seek to position in song based on value between 0 and 1
   * @param fraction
   */
  seek: function (fraction) {
    player.audio.currentTime = fraction * player.audio.duration
  },
  /**
   * Set volume based on value between 0 and 1
   * @param volume
   */
  setVolume: function (volume) {
    player.audio.volume = volume
    player.dispatchEvent(player.listeners.changedvolume)
  },
  /**
   * Update the player timestamp and progress bar
   * Only call from requestAnimationFrame
   */
  updatePlayer: function () {
    findNodes(controls.currentTimes.selector).forEach((control) => {
      control.textContent = `${player.currentTime.pretty().minutes}:${player.currentTime.pretty().seconds}`
    })
    findNodes(controls.scrubs.inners.selector).forEach((control) => {
      control.style.width = `${player.currentTime.percent()}%`
    })
    player.dispatchEvent(player.listeners.updatedPlayer)
  },
  /**
   * Based on current volume, either store current volume and mute player, or set volume to previously stored volume
   */
  mute: function () {
    if (player.audio.volume === 0) {
      this.audio.volume = player.audio.lastVolume || 0
    } else {
      this.audio.lastVolume = player.audio.volume
      this.audio.volume = 0
    }
    player.dispatchEvent(player.listeners.changedvolume)
  },
  /**
   * Update controls
   * Could be bundled in with updatePlayer, but do not want unnecessary DOM operations in that
   * @param state
   * @TODO
   * Re-work this functionality so saving of state is not required i.e. directly write the value of the <i>
   */
  updateControls: function (state) {
    findNodes(controls.songs.selector).forEach((element) => {
      const icon = findNode('i', element)

      if (element.state) {
        icon.classList.toggle(element.state, false)
      }
      icon.classList.toggle(controls.pauses.styles.fa[state], true)
      element.state = controls.pauses.styles.fa[state]
    })

    findNodes(controls.songs.selector).forEach((element) => {
      const icon = element.firstElementChild

      if (element.state) {
        icon.classList.toggle(element.state, false)
      }
      icon.classList.toggle(controls.songs.styles.fa.paused, true)
      element.state = controls.songs.styles.fa.paused
      if (element.dataset.playLink === this.audio.src) {
        if (element.state) {
          icon.classList.toggle(element.state, false)
        }
        icon.classList.toggle(controls.songs.styles.fa[state], true)
        element.state = controls.songs.styles.fa[state]
      }
    })
  }
}

/**
 * Configure audio defaults
 */
player.audio.autoplay = true

/**
 * Add event listeners to player object
 */
player.addEventListener(player.listeners.seletedsong, function selectedSong() {
  player.audio.src = player.song.dataset.playLink
})

player.addEventListener(player.listeners.changedvolume, function changedVolume() {
  requestAnimationFrame(() => {
    findNodes(controls.volumes.inners.selector).forEach((control) => {
      control.style.height = `${player.audio.volume * 100}%`
    })
  })
})

player.addEventListener(player.listeners.paused, function paused() {
  player.updateControls('paused')
})

player.addEventListener(player.listeners.playing, function playing() {
  player.updateControls('playing')
})

player.addEventListener(player.listeners.updatedPlayer, function draw() {
  if (!player.audio.paused) {
    requestAnimationFrame(player.updatePlayer)
  }
})

/**
 * Add event listener's to player audio object
 */
player.audio.addEventListener('loadstart', function play() {
  player.updateControls('loading')
})

player.audio.addEventListener('timeupdate', function timeUpdate() {
  if (player.audio.paused) {
    requestAnimationFrame(player.updatePlayer)
  }
})

player.audio.addEventListener('playing', function play() {
  requestAnimationFrame(player.updatePlayer)
  player.dispatchEvent(player.listeners.playing)
})

player.audio.addEventListener('loadedmetadata', function loadedMetadata() {
  requestAnimationFrame(() => {
    findNodes(controls.scrubs.sliders.selector).forEach((control => {
      control.classList.toggle('hidden', false)
    }))
    findNodes(controls.selector).forEach((control => {
      control.classList.toggle('playing', true)
    }))
    findNodes(controls.titles.selector).forEach((control) => {
      control.textContent = `${player.song.attributes.getNamedItem('data-title').textContent}`
    })
  })
})

player.audio.addEventListener('pause', function pause() {
  player.dispatchEvent(player.listeners.paused)
})

player.audio.addEventListener('durationchange', function durationChange() {
  requestAnimationFrame(() => {
    findNodes(controls.durations.selector).forEach((control) => {
      control.textContent = `${player.duration.pretty().minutes}:${player.duration.pretty().seconds}`
    })
  })
})

function pad(string, length) {
  if (0 < length) {
    return pad(string, length - 1)
  }
  return String("0" + string)
    .slice(-2)
}
