var selectors = {
  play: '[role="play"]',
  playPause: '.playpause',
  playPlaylist: '[role="play-playlist"]',
  playRelease: '[role="play-release"]',
  scrub: '.fscrub .progress',
  link: '[role="track-link"]',
  titles: '.title',
  volumeI: '[role="volumeControl"] > i',
  volumeInnerSlider: '.fvolumeslider .slider .progress',
  volumeOuterSlider: '.volume-slider-outer',
  volumeSliderContainer: '.volume-slider-container',
  controls: '.controls',
  ftracks: '.ftrack',
  currentTime: '.currentTime',
  duration: '.duration',
  progress: '.fscrub .progress',
  selectPlayPause: '.selectPlayPause',
  volumes: '.volume'
}

var controls = {
  get: {
    playPause:  () => { return findNodes(selectors.playPause) },
    next: () => { return findNodes(selectors.next) },
    previous: () => { return findNodes(selectors.previous) },
    currentTime: () => { return findNodes(selectors.currentTime) },
    duration: () => { return findNodes(selectors.duration) },
    progress: () => { return findNodes(selectors.progress) },
    selectPlayPause: () => { return findNodes(selectors.selectPlayPause) },
    title: () => { return findNodes(selectors.titles) },
    volume: () => { return findNodes(selectors.volumes) }
  }
}

//
// document.addEventListener('DOMContentLoaded', (e) => {
//   player = new MusicPlayer()
//   var events = Object.keys(playerEvents)
//
//   events.forEach((name) => {
//     player.addEventListener(name, playerEvents[name])
//   })
//   playerAnalyticEvents.forEach((name) => {
//     player.addEventListener(name, recordPlayerEvent)
//   })
//   player.addEventListener('error', recordPlayerError)
//   player.addEventListener('trackBlocked', () => {
//     toasty(new Error('Track blocked by your settings because it is not eligible for content creator licensing.'))
//   })
//
//   player.addEventListener('play', recordPlayerPlayLegacy)
//   requestAnimationFrame(updatePlayerProgress)
//   var volume = getCookie('volume')
//
//   if (!volume) {
//     volume = 1
//   }
//   updateVolumeControls(volume)
//   bindVolumeEvents()
//   document.addEventListener('keydown', (e) => {
//     if (e.keyCode == 32) {
//       const spaceFields = ['INPUT', 'TEXTAREA', 'BUTTON']
//
//       if (spaceFields.indexOf(e.target.tagName) != -1) {
//         return
//       }
//
//       e.preventDefault()
//
//       if (player.items.length) {
//         togglePlay()
//       }
//       else {
//         const playButton = findNode('[onclick^="playSongs"],[onclick^="playSong"]')
//
//         if (playButton) {
//           playButton.click()
//         }
//       }
//     }
//   })
// })
//
// function bindVolumeEvents() {
//   var containers = findNodes(sel.volumeSliderContainer)
//
//   if (containers) {
//     containers.forEach((container) => {
//       container.addEventListener('touchstart', initVolumeMobile.bind(null, container))
//     })
//   }
// }
//
// function recordPlayerEvent(e) {
//   var opts = e.detail.item
//
//   opts.label = opts.title + ' by ' + opts.artistTitle
//   opts.category = 'Music Player'
//   opts.releaseId = opts.releaseId
//   opts.trackId = opts.trackId
//   recordEvent('Deon AP ' + capitalizeFirstLetter(e.type), opts)
// }
//
// function recordPlayerError(e) {
//   e.category = 'Music Player'
//   recordEvent('Deon AP Error', e)
// }
//
// function recordPlayerPlayLegacy(e) {
//   recordEvent('Audio Player Play Server Side', e.detail.item)
// }
//
// function toggle() {
//   player.dispatchEvent(player.events.toggle)
//   updateControls()
// }
//
// function next() {
//   player.next()
//   updateControls()
// }
//
// function previous() {
//   player.previous()
//   // updateControls()
// }
//
// function toggleRepeat(e, el) {
//   var options = ['none', 'one', 'all']
//   var i = (options.indexOf(player.repeat) + 1) % options.length
//
//   player.repeat = options[i]
//   el.classList.toggle('repeat-one', player.repeat == 'one')
//   el.classList.toggle('repeat-all', player.repeat == 'all')
// }
//
// function toggleShuffle(e, el) {
//   player.shuffle = !player.shuffle
//   el.classList.toggle('active', player.shuffle)
// }
//
// function playSong(e, el) {
//   if (!el) {
//     return
//   }
//   const index = el.hasAttribute('data-index') ? +el.dataset.index : undefined
//
//   if (index != undefined) {
//     loadAndPlayTracks(index)
//   }
// }
//
// function toggleVolume() {
//   player.setStoredVolume(0)
//   player.setVolume(0)
//   updateVolumeControls(0)
// }
//
// function initVolumeMobile(e, el) {
//   // if they're on touch devices, let's put the volume at 100%
//   e.preventDefault()
//   player.setVolume(1)
// }
//

//
// function updateVolumeControls(volume) {
//   var sliders = findNodes(sel.volumeInnerSlider)
//
//   if (sliders) {
//     sliders.forEach((slider) => {
//       slider.style.height = `${volume * 100}%`
//     })
//   }
//
//   var icons = findNodes(sel.volumeI)
//
//   if (icons) {
//     icons.forEach((icon) => {
//       icon.classList.toggle('fa-volume-off', volume === 0)
//       icon.classList.toggle('fa-volume-down', volume < 0.75 && volume > 0)
//       icon.classList.toggle('fa-volume-up', volume >= 0.75)
//     })
//   }
//
//   player.setStoredVolume(volume)
//   player.setVolume(volume)
//   setCookie('volume', volume)
// }
//

//

//
// function loadAndPlayTracks(index) {
//   var tracks = buildTracks()
//
//   if (areTracksLoaded(tracks)) {
//     player.toggle(index)
//   }
//   else {
//     player.set(tracks)
//     player.play(index)
//
//     var el = findNode(sel.link)
//
//     if (el) {
//       el.setAttribute('href', window.location.pathname + window.location.search)
//     }
//   }
//
//   updateControls()
// }
//
// function buildTracks() {
//   var els = Array.prototype.slice.call(document.querySelectorAll('[data-play-link]'))
//
//   els = els.sort(function (el1, el2) {
//     var idx1 = parseInt(el1.dataset.index)
//     var idx2 = parseInt(el2.dataset.index)
//
//     if (idx1 == idx2) {
//       return 0
//     }
//     return idx1 > idx2 ? 1 : -1
//   })
//   return els.map(mapTrackElToPlayer)
// }
//
// function areTracksLoaded(tracks) {
//   return tracks.every(function (track, index) {
//     return player.items[index] && player.items[index].source == track.source
//   })
// }
//
// function playSongs(e, el) {
//   loadAndPlayTracks()
// }
//
// function onNewSong(e) {
//   var els = findNodes(sel.title)
//   var elContainers = findNodes(sel.link)
//   var controls = findNodes(sel.controls)
//
//   if (els) {
//     els.forEach((el) => {
//       el.textContent = prepareTrackTitle(e.detail.item)
//     })
//   }
//   if (elContainers) {
//     elContainers.forEach((elContainer) => {
//       elContainer.classList.add('playing-track')
//     })
//   }
//
//   if (controls) {
//     controls.forEach((control) => {
//       control.classList.add('playing')
//     })
//   }
//   if (typeof autoBrowseMore == 'function') {
//     autoBrowseMore()
//   }
// }
//
// function prepareTrackTitle(item) {
//   var artistNames = item.artist
//
//   if (!artistNames) {
//     return item.title
//   }
//
//   var trackTitle = ""
//
//   artistNames = artistNames.split(", ")
//     .filter(function (n) {
//       return n != ""
//     })
//
//   if (artistNames.length > 2) {
//     trackTitle = "Various Artists"
//   } else {
//     trackTitle = artistNames.join(" & ")
//   }
//   trackTitle += " - " + item.title
//   return trackTitle
// }
//
//
// function updateControls() {
//   var playEls = findNodes(sel.play)
//
//   if (playEls) {
//     playEls.forEach((playEl) => {
//       playEl.classList.toggle('fa-play', !player.playing && !player.loading)
//       playEl.classList.toggle('fa-pause', player.playing)
//       playEl.classList.toggle('fa-spin', player.loading && !player.playing)
//       playEl.classList.toggle('fa-refresh', player.loading && !player.playing)
//     })
//   }
//
//   var buttons = document.querySelectorAll('[role="play-song"],[role="play-release"]')
//
//   for (var i = 0; i < buttons.length; i++) {
//     buttons[i].classList.remove('active')
//   }
//
//   var playing = player.playing || player.loading
//   var item = player.items[player.index]
//   var selector = '[role="play-song"][data-play-link="' + (item ? item.source : '') + '"]'
//
//   var allMatches = document.querySelectorAll(selector)
//   var el
//
//   if (item) {
//     if (allMatches.length > 1) {
//       //try to find one with a matching index first
//       el = findNode(selector + '[data-index="' + player.index + '"]')
//     }
//     if (!el) {
//       el = allMatches[0]
//     }
//   }
//
//   if (el) {
//     el.classList.toggle('active', playing)
//   }
//
//   var pel = findNode(sel.playPlaylist)
//
//   if (pel) {
//     var playlistPlaying = playing && !isPlaylistLoaded(pel.dataset.playlistId)
//
//     pel.classList.toggle('fa-pause', playlistPlaying)
//     pel.classList.toggle('fa-play', !playlistPlaying)
//   }
//
//   var rel = findNode(sel.playRelease)
//
//   if (rel) {
//     rel.classList.toggle('active', playing && isReleaseLoaded(rel.dataset.releaseId))
//   }
// }
//
// function isPlaylistLoaded(id) {
//   return player.items.length && player.items[0].playlistId == id
// }
//
// function isReleaseLoaded(id) {
//   return player.items.length && player.items[0].releaseId == id
// }
//
// function mapTrackElToPlayer(el) {
//   return {
//     source: el.dataset.playLink,
//     skip: isSignedIn() && !el.hasAttribute('data-licensable') && (session.settings || {}).hideNonLicensableTracks,
//     block: isSignedIn() && !el.hasAttribute('data-licensable') && (session.settings || {}).blockNonLicensableTracks,
//     title: el.dataset.title,
//     index: el.dataset.index,
//     artist: el.dataset.artist,
//     artistTitle: el.dataset.artistsTitle,
//     trackId: el.dataset.trackId,
//     playlistId: el.dataset.playlistId,
//     releaseId: el.dataset.releaseId
//   }
// }
//
// function updatePlayerProgress() {
//   requestAnimationFrame(updatePlayerProgress)
//   var scrubs = findNodes(sel.scrub)
//   var positionTexts = findNodes(sel.position)
//   var durationTexts = findNodes(sel.duration)
//
//   function pad(time) {
//     return String("0" + time)
//       .slice(-2)
//   }
//
//   if (positionTexts && durationTexts && player.audio.currentTime && player.audio.duration) {
//     position = {
//       minutes: Math.floor(player.audio.currentTime / 60),
//       seconds: pad(Math.floor(player.audio.currentTime - Math.floor(player.audio.currentTime / 60) * 60))
//     }
//
//     duration = {
//       minutes: Math.floor(player.audio.duration / 60),
//       seconds: pad(Math.floor(player.audio.duration - Math.floor(player.audio.duration / 60) * 60))
//     }
//
//     positionTexts.forEach((positionText) => {
//       positionText.textContent = `${position.minutes}:${position.seconds}`
//     })
//
//     durationTexts.forEach((durationText) => {
//       durationText.textContent = `${duration.minutes}:${duration.seconds}`
//     })
//   }
//   if (scrubs) {
//     scrubs.forEach((scrub) => {
//       scrub.style.width = player.progress * 100 + '%'
//     })
//   }
// }
//

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

function scrub(slider, event) {
  player.seek(normalize((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth, slider))

  var dragPlayerSliderBound = dragPlayerSlider.bind(this, slider)
  document.addEventListener('mousemove', dragPlayerSliderBound)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', dragPlayerSliderBound)
  })
}
function dragPlayerSlider(slider, event) {
  preventSelection()
  player.seek(normalize((event.clientX - slider.getBoundingClientRect().left) / slider.clientWidth, slider))
}

function normalize(location) {
  location = 1 < location ? 1 : location
  return location < 0 ? 0 : location
}

function showVolumeSlider(e, el) {
  var slider = el.firstElementChild

  slider.classList.toggle('show', true)
  if (!slider.timeout) {
    slider.addEventListener('mousedown', startDragVolumeSlider.bind(this, slider.firstElementChild), true)
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
