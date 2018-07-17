const fullscreenplayer = {
  selector: '#fullscreenplayer',
  tables: {
    selector: '.table'
  }
}

function fullscreenplayerTable(args){
  switch (args.state) {
  case 'start':{
    args.node.textContent = 'Loading'
    break
  }
  case 'finish':{
      console.log(args)
      render('fullscreenplayerTable', args.result, args.node)
  }
  }
}
