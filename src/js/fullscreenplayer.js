const fullscreenplayer = {
  selector: '#fullscreenplayer',
  tables: {
    selector: '.table'
  }
}

function fullscreenplayerTable(args) {
  switch (args.state) {
  case 'start': {
    args.node.textContent = 'Loading'
    break
  }
  case 'finish': {
    console.log(args)
    args.result.results.forEach((result) => {
      result.duration = Math.floor(result.duration)
      result.bpm = Math.floor(result.bpm)
      result.artist = ''
      result.artists.forEach((artist, index) => {
        result.artist += `${artist.name}${(index + 1 < result.artists.length) ? ', ' : ''}`
      })
    })
    render('fullscreenplayerTable', args.result, args.node)
  }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  findNode('header').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
  findNode('footer').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
})
