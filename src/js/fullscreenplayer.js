const fullscreenplayer = {
  selector: '#fullscreenplayer',
  tables: {
    selector: '.table'
  },
  loadMore: function () {
    const table = this.closest(fullscreenplayer.tables.selector)

    table.setAttribute('data-source', `$endpoint/catalog/browse?skip=${findNodes(controls.songs.selector, table).length}`)
    loadNodeSource(table)
  }
}

function fullscreenplayerTable(args) {
  switch (args.state) {
  case 'start': {
    findNode('.load', args.node).innerHTML = 'Loading...'
    break
  }
  case 'finish': {
    findNode('.load', args.node).innerHTML = 'Load more'
    console.log(args)
    args.result.results.forEach((result) => {
      result.duration = Math.floor(result.duration)
      result.bpm = Math.floor(result.bpm)
      result.artist = ''
      result.artists.forEach((artist, index) => {
        result.artist += `${artist.name}${(index + 1 < result.artists.length) ? ', ' : ''}`
      })
      const div = render('fullscreenplayerTableRow', result, document.createElement('div'))

      args.node.innerHTML += div.innerHTML
    })
  }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  findNode('header').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
  findNode('footer').classList.toggle('hidden', window.location.pathname.match(/^\/player/))
})
