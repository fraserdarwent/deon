var selectors = {
  pause: '.pause',
  title: '.title',
  controls: '.controls',
  ftracks: '.ftrack',
  currentTime: '.currentTime',
  duration: '.duration',
  scrub: '.scrub > .slider > .outer > .inner',
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
  scrub: () => {
    return findNodes(selectors.scrub)
  },
  select: () => {
    return findNodes(selectors.select)
  },
  title: () => {
    return findNodes(selectors.title)
  },
  volume: () => {
    return findNodes(selectors.volume)
  }
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

function scrub(event, slider) {
  player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
  var mouseMove = dragPlayerSlider.bind(this, slider)

  function mouseUp() {
    document.removeEventListener('mousemove', mouseMove)
    document.removeEventListener('mouseup', mouseUp)
  }

  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('mouseup', mouseUp)
}

function dragPlayerSlider(slider, event) {
  preventSelection()
  player.seek(clamp((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth))
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

function showVolumeSlider(e, el) {
  var slider = el.firstElementChild

  slider.classList.toggle('show', true)
  if (!slider.timeout) {
    slider.addEventListener('mousedown', startDragVolumeSlider.bind(this, findNodes('.slider > .outer', slider)), true)
  }
}

function hideVolumeSlider(e, el) {
  var slider = el.firstElementChild

  clearTimeout(slider.timeout)
  slider.timeout = setTimeout(() => {
    slider.classList.toggle('show', false)
  }, 1500)
}

function startDragVolumeSlider(slider, e) {
  console.log(slider)
  changeVolumeBySlider((slider.getBoundingClientRect().bottom - e.clientY), slider)

  var dragVolumeSliderBound = dragVolumeSlider.bind(this, slider)

  document.addEventListener('mousemove', dragVolumeSliderBound)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', dragVolumeSliderBound)
  })
}

function dragVolumeSlider(slider, e) {
  preventSelection()
  changeVolumeBySlider((slider.getBoundingClientRect().bottom - e.clientY), slider)
}

function changeVolumeBySlider(height, slider) {
  hideVolumeSlider(null, slider.parentElement.parentElement)
  var volume = slider.offsetHeight < height ? 1 : (height / slider.offsetHeight)

  volume = volume < 0 ? 0 : volume
  player.setVolume(volume)
}
