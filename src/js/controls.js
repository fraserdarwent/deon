var selectors = {
  pause: '.pause',
  title: '.title',
  controls: '.controls',
  ftracks: '.ftrack',
  currentTime: '.currentTime',
  duration: '.duration',
  song: '.song'
}

var controls = {
  pause: () => {
    return findNodes(selectors.pause)
  },
  song: () => {
    return findNodes(selectors.song)
  },
  next: () => {
    return findNodes(selectors.next)
  },
  previous: () => {
    return findNodes(selectors.previous)
  },
  currentTime: () => {
    return findNodes(selectors.currentTime)
  },
  duration: () => {
    return findNodes(selectors.duration)
  },
  startDrag: () => {
    return findNodes(selectors.startDrag)
  },
  select: () => {
    return findNodes(selectors.select)
  },
  title: () => {
    return findNodes(selectors.title)
  },
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
    show: function () {
      var slider = findNode('.slider', this)

      clearTimeout(slider.timeout)
      slider.classList.toggle('show', true)
      if (!slider.timeout) {
        slider.addEventListener('mousedown', controls.volumes.startDrag.bind(this), true)
      }
    },
    hide: function() {
      var slider = findNode('.slider', this)

      slider.timeout = setTimeout(() => {
        slider.classList.toggle('show', false)
      }, 1500)
    },
    changePlayerVolume: function(event) {
      var sliderOuter = findNode('.slider > .outer', this)
      var volume = (sliderOuter.getBoundingClientRect().bottom - event.clientY) / sliderOuter.offsetHeight

      volume = clamp(volume)
      player.setVolume(volume)
    }
  },
}

function applyScroll(event, element) {
  element.style.textIndent = `${element.clientWidth < element.scrollWidth ? element.clientWidth - element.scrollWidth : 0 }px`
}

function removeScroll(event, element) {
  element.style.textIndent = '0px'
}

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

function clamp(i) {
  if (1 < i){
    i = 1
  }
  if (i < 0){
    i = 0
  }
  return i
}
