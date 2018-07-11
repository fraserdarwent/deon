const player = {
  audio: new Audio(),
  listeners: {
    playing: new Event('playing'),
    paused: new Event('paused'),
    seletedsong: new Event('selectedsong'),
    changedvolume: new Event('changedvolume'),
    updatedPlayer: new Event('updatedPlayer')
  },
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
  select: function (event, element) {
    if (element.dataset.playLink === this.audio.src) {
      this.pause()
    } else {
      var songs = element.parentElement.parentElement.parentElement.querySelectorAll(selectors.song)

      if (songs){
        var index = parseInt(element.dataset.index)
        this.song = songs[index]
        this.dispatchEvent(this.listeners.seletedsong)
        this.song.next = getNextSong(index, songs)
        function getNextSong(index, songs) {
          if (index + 1 < songs.length){
            var nextIndex = index + 1
            var song = songs[nextIndex]
    //Previous song
            song.next = getNextSong(nextIndex, songs)
            return song
          }
          return null
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
    this.song = this.song.previous
  },
  /**
   * Select next song in queue by incrementing index by 1
   */
  next: function () {
    this.song = this.song.next
    this.dispatchEvent(this.listeners.seletedsong)
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
    controls.currentTime().forEach((control) => {
      control.textContent = `${this.currentTime.pretty().minutes}:${this.currentTime.pretty().seconds}`
    })
    controls.scrub().forEach((control) => {
      control.style.width = `${this.currentTime.percent()}%`
    })
    this.dispatchEvent(this.listeners.updatedPlayer)
  },
  /**
   * Based on current volume, either store current volume and mute player, or set volume to previously stored volume
   */
  mute: function(){
    if (this.audio.volume === 0){
      this.audio.volume = this.audio.lastVolume ? this.audio.lastVolume : 1
    } else {
      this.audio.lastVolume = this.audio.volume
      this.audio.volume = 0
    }
    this.dispatchEvent(this.listeners.changedvolume)
  },
  /**
   * Set the content of the select button for the current playing song and pause buttons to parameter
   * @param content
   */
  setButtons: function (content) {
    controls.pause().forEach((button) => {
      button.textContent = content
    })
    controls.select().forEach((button) => {
      button.textContent = button.attributes.getNamedItem('data-play-link') === this.songQueue.songs[this.songQueue.currentIndex].attributes.getNamedItem('data-play-link') ? content : 'play'
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
  requestAnimationFrame(function changedVolume(){
    controls.volume().forEach((control) => { control.style.height = `${this.audio.volume * 100}%` })
  }.bind(this))
}.bind(player))

player.addEventListener(player.listeners.paused, function paused() {
  this.setButtons.bind(this)('play')
}.bind(player))

player.addEventListener(player.listeners.playing, function playing() {
  this.setButtons.bind(this)('pause')
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
  this.setButtons.bind(this)('loading')
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
  controls.title().forEach((control) => { control.textContent = `${this.song.attributes.getNamedItem('data-title').textContent}` })
}.bind(player))

player.audio.addEventListener('pause', function pause() {
  this.dispatchEvent(this.listeners.paused)
}.bind(player))

player.audio.addEventListener('durationchange', function durationChange(){
  requestAnimationFrame(function durationchange(){
    controls.duration().forEach((control) => { control.textContent = `${this.duration.pretty().minutes}:${this.duration.pretty().seconds}` })
  }.bind(this))
}.bind(player))

function pad(string, length) {
  if (0 < length){
    return pad(string, length - 1)
  }
  return String("0" + string)
    .slice(-2)
}

//     position = {
//       minutes: ,
//       seconds:
//     }
//
//     duration = {
//       minutes: Math.floor(player.audio.duration / 60),
//       seconds: pad(Math.floor(player.audio.duration - Math.floor(player.audio.duration / 60) * 60))
//     }

//     MusicPlayer.prototype.advance = function (amount) {
//         var items = this.items
//         if (!items || !items.length)
//             return
//
//         if (this.shuffle) {
//             // Handle case where already played song and now shuffling
//             if (this.playable && !this.played.length) {
//                 this.played.push(this.index)
//             }
//
//             var playedIndex = this.played.length - 1 + amount
//                 , exhausted = playedIndex >= items.length || playedIndex < 0
//
//             if (exhausted) {
//                 this.played = []
//             }
//
//             if (playedIndex >= 0 && playedIndex < this.played.length) {
//                 this.index = playedIndex
//             }
//             else {
//                 while (this.played.indexOf(this.index) > -1) {
//                     this.index = Math.floor(Math.random() * items.length)
//                 }
//             }
//
//             this.played.push(this.index)
//         }
//         else {
//             this.played = []
//             this.index = (this.index + amount) % items.length
//             if (this.index < 0)
//                 this.index += this.items.length
//         }
//
//         if ((this.items || []).length > 1 && (this.items[this.index] || {}).skip)
//             return this.advance(amount)
//         this.play(this.index)
//     }

// var MusicPlayer = (function () {
//
//     function createEvent(event, props) {
//         if (typeof CustomEvent === 'function') {
//             return new CustomEvent(event, props)
//         }
//
//         var evt = document.createEvent('CustomEvent')
//         evt.initCustomEvent(event, false, false, props.detail)
//         return evt
//     }
//
//     function MusicPlayer () {
//         constructEmitter(this)
//         MusicPlayer.define(this)
//         if(window._phantom) {
//             this.audio = new (function () {
//                 this.addEventListener = Function.prototype
//             })()
//         }
//         else {
//             this.audio = new Audio()
//         }
//
//         this.shouldUseMediaSession = 'mediaSession' in navigator
//         this.audio.addEventListener('error', onError.bind(this))
//         this.audio.addEventListener('stalled', onStalled.bind(this))
//         this.audio.addEventListener('ended', onEnded.bind(this))
//         this.audio.addEventListener('timeupdate', onTimeUpdate.bind(this))
//         this.audio.addEventListener('loadedmetadata', onStateChange.bind(this))
//         this.audio.addEventListener('loadeddata', onStateChange.bind(this))
//         this.audio.addEventListener('loadstart', onStateChange.bind(this))
//         this.audio.addEventListener('canplay', onStateChange.bind(this))
//         this.audio.addEventListener('canplaythrough', onStateChange.bind(this))
//         this.audio.addEventListener('updatePlayer', onStateChange.bind(this))
//         this.audio.addEventListener('pause', onStateChange.bind(this))
//         this.repeatMode = 'none'
//         this.shuffle = false
//         this.clear()
//
//         if (this.shouldUseMediaSession) {
//             var self = this
//
//             // The `pause` event actually handles both playing and pausing -- so no need to define both
//             navigator.mediaSession.setActionHandler('pause', () => self.pause())
//             navigator.mediaSession.setActionHandler('previoustrack', () => self.previous())
//             navigator.mediaSession.setActionHandler('nexttrack', () => self.next())
//         }
//     }
//
//     MusicPlayer.prototype.add = function (item) {
//         if (!item || !item.source)
//             return -1
//
//         var duplicate = this.items.findIndex(function(aitem) { return aitem.source == item.source })
//         if (duplicate > -1)
//             return duplicate
//
//         this.items.push(item)
//         this.dispatchEvent(createEvent('add', {detail: {item: item}}))
//         return this.items.length - 1
//     }
//
//     MusicPlayer.prototype.removeAt = function (index) {
//         if (index >= 0 && index < this.items.length)
//             this.items.splice(index, 1)
//     }
//
//     MusicPlayer.prototype.addAndPlay = function (item) {
//         var index = this.add(item)
//         if (index > -1)
//             this.play(index)
//     }
//
//     // If index is undefined, it will start the first song or resume currently playing song.
//     MusicPlayer.prototype.play = function (index) {
//         if (!this.items || !this.items.length || ((index != null) && (!this.items[index] || !this.items[index].source)))
//             return
//
//         var pi = this.index
//         index = index == undefined ? +this.index : +index
//         this.index = index
//
//         if (this.items[index].block) {
//             this.trigger('trackBlocked')
//             return
//         }
//
//         if (this.audio.src != this.items[index].source || pi != index) {
//             this.audio.src = this.items[index].source
//         }
//         this.audio.autoplay = true
//         this.audio.play()
//         this.index = index
//
//         if (this.shouldUseMediaSession) {
//             // Set up media session metadata
//             var track = this.items[index]
//
//             // This `if` is here to prevent the MediaSession from
//             // abruptly disappearing from the device and then
//             // reappearing
//             if (navigator.mediaSession.metadata === null) {
//                 navigator.mediaSession.metadata = new MediaMetadata({
//                     title: track.title,
//                     artist: track.artistTitle
//                 })
//             } else {
//                 navigator.mediaSession.metadata.title = track.title
//                 navigator.mediaSession.metadata.artist = track.artistTitle
//             }
//         }
//
//         this.trigger('play')
//     }
//
//     MusicPlayer.prototype.trigger = function (name) {
//         this.dispatchEvent(createEvent(name, {detail: {item: this.currentItem}}))
//     }
//
//     MusicPlayer.prototype.clear = function () {
//         this.index = 0
//         this.played = []
//         this.items = []
//     }
//
//     MusicPlayer.prototype.set = function (items) {
//         this.clear()
//         this.items = items
//     }
//
//     MusicPlayer.prototype.restart = function () {
//         this.seek(0)
//         this.trigger('restart')
//         if (!this.playing) this.play()
//     }
//
//     MusicPlayer.prototype.pause = function () {
//         this.audio.pause()
//         this.trigger('pause')
//     }
//
//     MusicPlayer.prototype.stop = function () {
//         if (this.shouldUseMediaSession)
//             navigator.mediaSession.metadata = null
//         this.audio.pause()
//         this.seek(0)
//         this.trigger('stop')
//     }
//
//     MusicPlayer.prototype.toggle = function (index) {
//         if (index == undefined || index == this.index) {
//             return this.audio.paused ? this.play() : this.pause()
//         }
//         this.play(index)
//     }
//
//     MusicPlayer.prototype.seek = function (percent) {
//         if (this.audio.error || !this.seekable)
//             return
//
//         percent = clamp(percent, 0, 1)
//         this.audio.currentTime = percent * this.audio.duration
//     }
//
//     MusicPlayer.prototype.setVolume = function (percent) {
//         percent = clamp(percent, 0, 1)
//         this.audio.volume = percent
//     }
//
//     MusicPlayer.prototype.getVolume = function () {
//         return clamp(this.audio.volume, 0, 1)
//     }
//
//     MusicPlayer.prototype.setStoredVolume = function (v) {
//         this.storedVolume = v
//     }
//
//     MusicPlayer.prototype.getStoredVolume = function () {
//         return this.storedVolume
//     }
//
//     MusicPlayer.prototype.next = function () {
//         var old = this.currentItem
//         this.advance(1)
//         this.dispatchEvent(createEvent('next', {detail: {
//                 was: old,
//                 item: this.currentItem
//             }}))
//     }
//
//     MusicPlayer.prototype.previous = function () {
//         var old = this.currentItem
//         this.advance(-1)
//         this.dispatchEvent(createEvent('previous', {detail: {
//                 was: old,
//                 item: this.currentItem
//             }}))
//     }
//
//     MusicPlayer.prototype.advance = function (amount) {
//         var items = this.items
//         if (!items || !items.length)
//             return
//
//         if (this.shuffle) {
//             // Handle case where already played song and now shuffling
//             if (this.playable && !this.played.length) {
//                 this.played.push(this.index)
//             }
//
//             var playedIndex = this.played.length - 1 + amount
//                 , exhausted = playedIndex >= items.length || playedIndex < 0
//
//             if (exhausted) {
//                 this.played = []
//             }
//
//             if (playedIndex >= 0 && playedIndex < this.played.length) {
//                 this.index = playedIndex
//             }
//             else {
//                 while (this.played.indexOf(this.index) > -1) {
//                     this.index = Math.floor(Math.random() * items.length)
//                 }
//             }
//
//             this.played.push(this.index)
//         }
//         else {
//             this.played = []
//             this.index = (this.index + amount) % items.length
//             if (this.index < 0)
//                 this.index += this.items.length
//         }
//
//         if ((this.items || []).length > 1 && (this.items[this.index] || {}).skip)
//             return this.advance(amount)
//         this.play(this.index)
//     }
//
//     MusicPlayer.define = function (obj) {
//         Object.defineProperty(obj, 'currentItem', {
//             get: function () {
//                 return this.items[this.index]
//             }
//         })
//
//         Object.defineProperty(obj, 'playable', {
//             get: function () {
//                 return this.audio.readyState >= 3
//             }
//         })
//
//         Object.defineProperty(obj, 'playing', {
//             get: function () {
//                 return this.playable && !this.audio.paused
//             }
//         })
//
//         Object.defineProperty(obj, 'loading', {
//             get: function () {
//                 return (this.audio.readyState >= 1 && this.audio.readyState <= 2) || this.audio.networkState == 2
//             }
//         })
//
//         Object.defineProperty(obj, 'seekable', {
//             get: function () {
//                 return this.audio.readyState >= 1 && this.audio.seekable
//             }
//         })
//
//         Object.defineProperty(obj, 'updatePlayer', {
//             get: function () {
//                 return this.audio.duration ? this.audio.currentTime / this.audio.duration : 0
//             }
//         })
//
//         Object.defineProperty(obj, 'finished', {
//             get: function () {
//                 return this.repeat == 'none' && ((!this.shuffle && this.index >= this.items.length - 1) ||
//                     this.played.length >= this.items.length - 1)
//             }
//         })
//
//         Object.defineProperty(obj, 'repeat', {
//             get: function () {
//                 return this.repeatMode
//             },
//             set: function (value) {
//                 this.repeatMode = value
//                 this.audio.loop = value == 'one'
//             }
//         })
//     }
//
//     function onError(e) {
//         cloneAndDispatch.call(this, e)
//         if (this.items.length > 1)
//             setTimeout(this.next.bind(this), 250)
//     }
//
//     function onStalled(e) {
//         cloneAndDispatch.call(this, e)
//     }
//
//     function onEnded(e) {
//         e.detail = { item: this.currentItem }
//         cloneAndDispatch.call(this, e)
//         if (this.finished)
//             return
//         if (this.repeat == 'one')
//             return this.play()
//         this.next()
//     }
//
//     function cloneAndDispatch(e) {
//         if (typeof e.constructor === 'function') {
//             var ev = new e.constructor(e.type, e)
//             ev.detail = e.detail
//             this.dispatchEvent(ev)
//         }
//     }
//
//     function clamp(a, min, max) {
//         return Math.max(Math.min(a, max), min)
//     }
//
//     function onStateChange(e) {
//         this.dispatchEvent(createEvent('statechange', {detail: { player: this }}))
//     }
//
//     function onTimeUpdate(e) {
//         cloneAndDispatch.call(this, e)
//     }
//
//     function constructEmitter(obj) {
//         obj.target = document.createDocumentFragment();
//
//         ['addEventListener', 'dispatchEvent', 'removeEventListener']
//             .forEach(function(method) {
//                 obj[method] = obj.target[method].bind(obj.target)
//             })
//     }
//
//     return MusicPlayer
// })()
//
