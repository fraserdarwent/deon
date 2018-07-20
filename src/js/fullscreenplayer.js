const fullscreenplayer = {
  selector: '#fullscreenplayer',
  tables: {
    selector: '.table'
  },
  loadMore: function () {
    const table = this.closest('tbody')

    table.setAttribute('data-source', `$endpoint/catalog/browse?skip=${table.childElementCount}`)
    loadNodeSources(this.closest('table'))
  }
}

function fullscreenplayerTable(args) {
  switch (args.state) {
  case 'start': {
    // args.node.textContent = 'Loading'
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

      const div = render('fullscreenplayerTableRow', result, document.createElement('tbody'))

      args.node.appendChild(div.firstElementChild)
    })
  }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  findNode('header').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
  findNode('footer').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
})
