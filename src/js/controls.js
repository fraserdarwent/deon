var selectors = {
  pause: '.pause',
  title: '.title',
  controls: '.controls',
  ftracks: '.ftrack',
  currentTime: '.currentTime',
  duration: '.duration',
  startDrag: '.scrub > .slider > .outer > .inner',
  song: '.song',
  volume: '.volume > .slider > .outer > .inner'
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
    find: findNodes(selectors.volume),
    show: function (e, el) {
      var slider = el.firstElementChild

      slider.classList.toggle('show', true)
      if (!slider.timeout) {
        slider.addEventListener('mousedown', this.drag.bind(this, findNodes('.slider > .outer', slider)), true)
      }
    },
    hide: function(e, el) {
      var slider = el.firstElementChild

      clearTimeout(slider.timeout)
      slider.timeout = setTimeout(() => {
        slider.classList.toggle('show', false)
      }, 1500)
    },
    startDrag: function(slider, e) {
      this.changePlayerVolume((slider.getBoundingClientRect().bottom - e.clientY), slider)

      var dragVolumeSliderBound = this.drag.bind(this, slider)

      document.addEventListener('mousemove', dragVolumeSliderBound)
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', dragVolumeSliderBound)
      })
    },
    drag: function (slider, e) {
      preventSelection()
      this.changePlayerVolume((slider.getBoundingClientRect().bottom - e.clientY), slider)
    },
    changePlayerVolume: function(height, slider) {
      this.hide(null, slider.parentElement.parentElement)
      var volume = slider.offsetHeight < height ? 1 : (height / slider.offsetHeight)

      volume = volume < 0 ? 0 : volume
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
