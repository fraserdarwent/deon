var sel = {
  play: '[role="play"]',
  playPlaylist: '[role="play-playlist"]',
  playRelease: '[role="play-release"]',
  scrub: '[role="scrub-progress"]',
  link: '[role="track-link"]',
  title: '[role="track-title"]',
  volume: '[role="volumeControl"]',
  volumeI: '[role="volumeControl"] > i',
  volumeInnerSlider: '.volume-slider-inner',
  volumeOuterSlider: '.volume-slider-outer',
  volumeSliderContainer: '.volume-slider-container',
  controls: '.controls'
}

/**
 * Object for storing functions to do with the controls
 * @type {{selectors: {pause: string, title: string, controls: string, ftracks: string, currentTime: string, duration: string, song: string}, pauses: {styles: {fa: {paused: string, playing: string, loading: string}}, find: (function(): Node[])}, songs: {find: (function(): Node[]), styles: {fa: {paused: string, playing: string, loading: string}}}, find: (function(): Node[]), currentTimes: (function(): Node[]), durations: (function(): Node[]), titles: (function(): Node[]), scrubs: {inners: (function(): Node[]), drag: controls.scrubs.drag, startDrag: controls.scrubs.startDrag}, volumes: {inners: (function(): Node[]), startDrag: controls.volumes.startDrag, drag: controls.volumes.drag, show: controls.volumes.show, hide: controls.volumes.hide, changePlayerVolume: controls.volumes.changePlayerVolume}}}
 */
var controls = {
  selectors: {
    pause: '.pause',
    title: '.title',
    controls: '.controls',
    ftracks: '.ftrack',
    currentTime: '.currentTime',
    duration: '.duration',
    song: '.song'
  },
  pauses: {
    styles: {
      fa: {
        paused: 'fa-play',
        playing: 'fa-pause',
        loading: 'fa-refresh'
      },
    },
    find: () => {
      return findNodes(controls.selectors.pause)
    }
  },
  songs: {
    find: () => {
      return findNodes(controls.selectors.song)
    },
    styles: {
      fa: {
        paused: 'fa-play-circle',
        playing: 'fa-pause-circle',
        loading: 'fa-refresh'
      }
    }
  },
  find: () => {
    return findNodes(controls.selectors.controls)
  },
  currentTimes: () => {
    return findNodes(controls.selectors.currentTime)
  },
  durations: () => {
    return findNodes(controls.selectors.duration)
  },
  titles: () => {
    return findNodes(controls.selectors.title)
  },
  /**
     * Store functions for finding and operating on song scrub bars (song progress bar)
     */
  scrubs: {
    inners: () => {
      return findNodes('.scrub > .slider > .outer > .inner')
    },
    drag: function (slider, event) {
      preventSelection()
      player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
    },
    startDrag: function (event, slider) {
      player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
      var mouseMove = controls.scrubs.drag.bind(this, slider)

      function mouseUp() {
        document.removeEventListener('mousemove', mouseMove)
        document.removeEventListener('mouseup', mouseUp)
      }

      document.addEventListener('mousemove', mouseMove)
      document.addEventListener('mouseup', mouseUp)
    }
  },
  /**
     * Store functions for finding and operating on volume sliders
     */
  volumes: {
    inners: () => {
      return findNodes('.volume > .slider > .outer > .inner')
    },
    startDrag: function () {
      controls.volumes.changePlayerVolume.bind(this)(event)

      var dragVolumeSliderBound = controls.volumes.drag.bind(this)

      document.addEventListener('mousemove', dragVolumeSliderBound)
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', dragVolumeSliderBound)
      })
    },
    drag: function () {
      preventSelection()
      controls.volumes.changePlayerVolume.bind(this)(event)
    },
    /**
       * Reset hide timeout
       * Start drag
       */
    show: function () {
      var slider = findNode('.slider', this)

      clearTimeout(slider.timeout)
      slider.classList.toggle('hide', false)
      if (!slider.timeout) {
        slider.addEventListener('mousedown', controls.volumes.startDrag.bind(this), true)
      }
    },
    /**
       * Hide after 1500ms
       */
    hide: function () {
      var slider = findNode('.slider', this)

      slider.timeout = setTimeout(() => {
        slider.classList.toggle('hide', true)
      }, 1500)
    },
    /**
       * Change player volume based on current slider
       * @param event
       */
    changePlayerVolume: function (event) {
      var sliderOuter = findNode('.slider > .outer', this)
      var volume = (sliderOuter.getBoundingClientRect().bottom - event.clientY) / sliderOuter.offsetHeight

      volume = clamp(volume)
      player.setVolume(volume)
    }
  }
}
/**
 * Scroll text which is longer than the div it is in by applying a calculated text indent
 */

function applyScroll() {
  this.style.transition = 'text-indent 2s linear'
  this.style.textIndent = `${this.clientWidth < this.scrollWidth ? this.clientWidth - this.scrollWidth : 0 }px`
}

/**
 * Remove applied text indent
 */
function removeScroll() {
  this.style.transition = 'none'
  this.style.textIndent = '0px'
}

/**
 * Prevent selection
 * Used whilst dragging sliders
 */
function preventSelection() {
  var selection = {}

  if (window.getSelection) {
    selection = window.getSelection()
    if (selection.rangeCount) {
      selection.removeAllRanges()
      return
    }
  } else if (document.selection) {
    selection = document.selection.createRange()
    if (selection.text > '') {
      document.selection.empty()
      return
    }
  }
}

/**
 * Clamp input between 0 and 1
 * @param i
 * @returns {*}
 */
function clamp(i) {
  if (1 < i){
    i = 1
  }
  if (i < 0){
    i = 0
  }
  return i
}

/**
 *Old code
**/
function startVolumeSliderShow (e) {
  clearTimeout(startVolumeSliderHide.timeout)
  var controls = findNode(sel.controls)

  controls.classList.toggle('show-slider', true)
}

function volumeSliderRemain (e) {
  clearTimeout(startVolumeSliderHide.timeout)
}

function startVolumeSliderHide () {
  if (startVolumeDrag.dragging) {
    return false
  }
  startVolumeSliderHide.timeout = setTimeout(function () {
    volumeSliderHide()
  }, 500)
}
startVolumeSliderHide.timeout = null

function volumeSliderHide () {
  var controls = findNode(sel.controls)

  controls.classList.toggle('show-slider', false)
}

function calculateVolumeDrag (e) {
  if (!e.path) {
    addEventPath(e)
  }
  if (!startVolumeDrag.dragging || e.path[0].matches('.volume-slider-handle')) {
    return
  }
  var outer = findNode(sel.volumeOuterSlider)
  var style = window.getComputedStyle(outer)
  var height = parseInt(style.getPropertyValue('height'))
  var offset = e.offsetY
  var newVolume = offset / height

  //Dragging off the edge sometimes messes up, so we'll round for the user here
  //TODO: Change this to check to see if the mouse is outside the range of offsetY (past the slider container)
  if (height - offset <= 1) {
    newVolume = 1
  }

  // player.setStoredVolume(newVolume)
  player.setVolume(newVolume)
  setCookie('volume', newVolume)
  setVolumeDisplay()
}

function stopVolumeDrag (e) {
  window.removeEventListener("mouseup", stopVolumeDrag)
  window.removeEventListener("mousemove", preventSelection, false)
  startVolumeDrag.dragging = false
}

function setVolumeDisplay () {
  var volume = player.audio.volume
  var icon = findNode(sel.volumeI)
  var innerSlide = findNode(sel.volumeInnerSlider)
  var height = volume * 100

  if (height < 2) {
    height = 2
  }
  icon.classList.toggle('fa-volume-off', volume == 0)
  icon.classList.toggle('fa-volume-down', volume < 0.75 && volume > 0)
  icon.classList.toggle('fa-volume-up', volume >= 0.75)
  innerSlide.style.height = parseInt(height) + '%'
}
function startVolumeDrag (e) {
  startVolumeDrag.dragging = true
  calculateVolumeDrag(e)
  window.addEventListener("mouseup", stopVolumeDrag)
  window.addEventListener("mousemove", preventSelection, false)
}

document.addEventListener('DOMContentLoaded', player.setVolume(1))
