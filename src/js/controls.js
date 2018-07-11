var selectors = {
  pause: '.pause',
  title: '.title',
  controls: '.controls',
  ftracks: '.ftrack',
  currentTime: '.currentTime',
  duration: '.duration',
  song: '.song'
}

/**
 * Object for storing functions to do with the controls
 * @type {{pauses: (function(): Node[]), songs: (function(): Node[]), currentTimes: (function(): Node[]), durations: (function(): Node[]), titles: (function(): Node[]), scrubs: {inners: (function(): Node[]), drag: controls.scrubs.drag, startDrag: controls.scrubs.startDrag}, volumes: {inners: (function(): Node[]), startDrag: controls.volumes.startDrag, drag: controls.volumes.drag, show: controls.volumes.show, hide: controls.volumes.hide, changePlayerVolume: controls.volumes.changePlayerVolume}}}
 */
var controls = {
  pauses: () => {
    return findNodes(selectors.pause)
  },
  songs: () => {
    return findNodes(selectors.song)
  },
  currentTimes: () => {
    return findNodes(selectors.currentTime)
  },
  durations: () => {
    return findNodes(selectors.duration)
  },
  titles: () => {
    return findNodes(selectors.title)
  },
    /**
     * Store functions for finding and operating on song scrub bars (song progress bar)
     */
  scrubs: {
    inners: () => { return findNodes('.scrub > .slider > .outer > .inner') },
    drag: function(slider, event) {
      preventSelection()
      player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
    },
    startDrag: function(event, slider) {
      player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
      var mouseMove = this.drag.bind(this, slider)

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
    inners: () => { return findNodes('.volume > .slider > .outer > .inner') },
    startDrag: function() {
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
      slider.classList.toggle('show', true)
      if (!slider.timeout) {
        slider.addEventListener('mousedown', controls.volumes.startDrag.bind(this), true)
      }
    },
        /**
         * Hide after 1500ms
         */
    hide: function() {
      var slider = findNode('.slider', this)

      slider.timeout = setTimeout(() => {
        slider.classList.toggle('show', false)
      }, 1500)
    },
        /**
         * Change player volume based on current slider
         * @param event
         */
    changePlayerVolume: function(event) {
      var sliderOuter = findNode('.slider > .outer', this)
      var volume = (sliderOuter.getBoundingClientRect().bottom - event.clientY) / sliderOuter.offsetHeight

      volume = clamp(volume)
      player.setVolume(volume)
    }
  },
}

/**
 * Scroll text which is longer than the div it is in by applying a calculated text indent
 */
function applyScroll() {
  this.style.textIndent = `${this.clientWidth < this.scrollWidth ? this.clientWidth - this.scrollWidth : 0 }px`
}

/**
 * Remove applied text indent
 */
function removeScroll() {
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
