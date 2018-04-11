var humblePromoName = 'Humble Streamer Bundle March 2017'
function processHumbleBundleRedeemPage (args) {
  loadSession((err, sess) => {
    const obj = {}

    obj.showSignInStep = true
    obj.showGoldStep = false
    obj.showTwitchStep = false
    obj.isSignedIn = isSignedIn()
    obj.doneSignInStep = obj.isSignedIn
    obj.doneGoldStep = hasGoldAccess()
    obj.doneTwitchStep = false
    if(obj.doneSignInStep) {
      obj.showGoldStep = true
    }
    if(obj.doneGoldStep) {
      obj.showTwitchStep = true
    }
    obj.signInUrl = '/signin?redirect=' + encodeURIComponent('/humble')
    obj.signUpUrl = '/sign-up?redirect=' + encodeURIComponent('/humble')

    if(obj.showTwitchStep) {
      //Fetch this user's whitelists
      requestJSON({
        url: endpoint + '/self/whitelist/used-promo/' + encodeURIComponent(humblePromoName),
        withCredentials: true
      }, (err, resp) => {
        if (terror(err)) {
          renderContent(args.template, obj)
          return
        }
        obj.doneTwitchStep = resp.used
        renderContent(args.template, obj)
      })
    }
    else {
      renderContent(args.template, obj)
    }
  })
}

function transformHumbleBundleRedeemPage (obj, done) {

}

function submitHumbleTwitch (e, el) {
  e.preventDefault()
  var data = getDataSet(el)
  var button = document.querySelector('button[role=submit-humble-twitch]')
  if(!data.username) {
    return
  }
  button.disabled = true
  button.innerHTML = 'Submitting...'
  data.username = serviceUrlToChannelId(data.username)
  requestJSON({
    url: endpoint + '/self/whitelist/redeem-via-trial-code',
    method: 'POST',
    withCredentials: true,
    data: {
      identity: data.username,
      vendor: 'Twitch',
      promo: humblePromoName
    }
  }, function (err, resp) {
    button.disabled = false
    button.innerHTML = 'Submit'
    if(err) {
      alert(err)
      return
    }
    else {
      toasty('License created! Redirecting...')
      go('/account/services')
    }
  })
}