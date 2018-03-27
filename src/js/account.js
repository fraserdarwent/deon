function transformSubmittedAccountData (data) {
  var str = data.birthday_year + '-' + data.birthday_month + '-' + data.birthday_day
  if (!data.birthday_year || data.birthday_year <= 1900) {
    data.birthday = null
  }
  else {
    data.birthday = new Date(str)
  }
  delete data.birthday_day
  delete data.birthday_month
  delete data.birthday_year
  console.log('data', data)
  console.log('str', str)
  return data;
}

function validateAccountData (data, exclude) {
  exclude = exclude || {}
  var errors = []
  if (!exclude.birthday) {
    if (!data.birthday || data.birthday.toString() == 'Invalid Date' || data.birthday.getFullYear() < 1900 || data.birthday.getFullYear() > new Date().getFullYear()) {
      errors.push('Invalid birthday entered');
    }
  }
  if (!exclude.location) {
    if (!data.googleMapsPlaceId) {
      errors.push('Location is required');
    }
  }
  return errors;
}

/*===============================
=            ACTIONS            =
===============================*/
function submitSaveAccount (e, el) {
  const wasLegacy = isLegacyLocation()

  submitForm(e, {
    url: endpoint + '/self',
    method: 'PATCH',
    transformData: transformSubmittedAccountData,
    validate: validateAccountData,
    success: function (result, data) {
      toasty(strings.accountUpdated)
      findNode('[name="password"]').value = ""
      loadSession(function (err, obj) {
        if (wasLegacy && !isLegacyLocation()) {
          reloadPage()
        }
        siteNotices.completeProfileNotice.start()
      })
    }
  })
}

function submitSaveAccountSettings (e, el) {
  submitForm(e, {
    url: endpoint + '/self/settings',
    method: 'PATCH',
    success: function (result, data) {
      toasty(strings.settingsUpdated)
      session.settings = data
    }
  })
}

function saveAccount (e, el) {
  throw new Error('Depecrated')
  /*
  var data = getTargetDataSet(el, true, true)
  data = transformSubmittedAccountData(data);
  if (!data) return
  var wasLegacy = isLegacyLocation()
  var errors = validateAccountData(data);
  if (errors.length > 0) {
    errors.forEach(function (err) {
      toasty(new Error(err));
    })
    return
  }
  update('self', null, data, function (err, obj) {
    if (err) return window.alert(err.message)
    toasty(strings.accountUpdated)
    document.querySelector('[name="password"]').value = ""
    resetTargetInitialValues(el, obj)
    loadSession(function (err, obj) {
      if (wasLegacy && !isLegacyLocation()) {
        reloadPage()
      }
      siteNotices.completeProfileNotice.start();
    })
  })
  */
}

function saveShopEmail (e, el) {
  var data = getTargetDataSet(el, true, true)
  if (!data) return
  update('self', null, data, function (err, obj) {
    if (err) return window.alert(err.message)
    toasty(strings.shopEmailUpdated)
    session.user.shopEmail = data.shopEmail
  })
}
function saveRedditUsername (e, el) {
  var data = getTargetDataSet(el, false, true)
  if (!data) {
    data = {redditUsername: null}
  }
  requestJSON({
    url: endpoint + '/self/update-reddit',
    method: 'PUT',
    data: data,
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return window.alert(err.message)
    toasty('Flair set')
    session.user.redditUsername = data.redditUsername
  })
}

function enableTwoFactor (e, el) {
  var data = getTargetDataSet(el, false, true)
  if (!data) return
  data.number = String(data.number)
  requestJSON({
    url: endpoint + '/self/two-factor',
    method: 'PUT',
    data: data,
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return window.alert(err.message)
    window.location.hash = '#two-factor'
    reloadPage()
    toasty(strings.twoFactorPending)
  })
}

function confirmTwoFactor (e, el) {
  var data = getTargetDataSet(el, false, true)
  if (!data) return
  data.number = String(data.number)
  requestJSON({
    url: endpoint + '/self/two-factor/confirm',
    method: 'PUT',
    data: data,
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return window.alert(err.message)
    reloadPage()
    window.location.hash = '#two-factor'
    toasty(strings.twoFactorConfirmed)
  })
}

function disableTwoFactor (e, el) {
  requestJSON({
    url: endpoint + '/self/two-factor/disable',
    method: 'PUT',
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return window.alert(err.message)
    reloadPage()
    toasty(strings.twoFactorDisabled)
  })
}

function processAccountPage (args) {
  pageProcessor(args, {
    transform: function (args) {
      const scope = {}
      const result = args.result
      console.log('result', result);
      const account = result

      scope.countries = getAccountCountries(account.location)
      if (!account.twoFactorId && !account.pendingTwoFactorId) {
        scope.enableTwoFactor = {
          countries: CountryCallingCodes
        }
        scope.twoFactor = false
      }
      else if (account.pendingTwoFactorId) {
        scope.confirmingTwoFactor = true
        scope.twoFacotr = false
      }
      else if (account.twoFactorId) {
        scope.twoFactor = true
      }
      if (account.birthday) {
        const date = new Date(account.birthday)

        scope.birthday_year = date.getUTCFullYear()
        scope.birthday_day = ('0' + (date.getUTCDate()).toString()).substr(-2)
        scope.birthday_month = ('0' + (date.getUTCMonth() + 1).toString()).substr(-2)
      }
      scope.hasGoldAccess = hasGoldAccess()
      scope.endhost = endhost
      scope.locationLegacy = isLegacyLocation()
      console.log('account.emailOptIns', account.emailOptIns)
      scope.emailOptIns = transformEmailOptins(account.emailOptIns)
      scope.account = account
      console.log('scope', scope)
      return scope
    }
  })
}

function mapAccount (o) {
}


function processSocialSettings (args) {
  processor(args, {
    transform: function (args) {
      const scope = {
        facebookEnabled: !!args.result.facebookId,
        googleEnabled: !!args.result.googleId
      }
      return scope
    }
  })
}

function transformAccountGold (o, done) {
  var thankyous = [
    "Very cool!",
    "Thank you!",
    "Thanks for the support :)",
    "We appreciate it :)",
    "That's awesome!",
    "Noice."
  ]
  var obj = {
    self: o,
    hasGoldAccess: hasGoldAccess(),
    hasFreeGold: hasFreeGold(),
    displayName: getSessionName(),
    thankYou: thankyous[randomChooser(thankyous.length)-1],
    isSignedIn: isSignedIn()
  }

  if (!obj.isSignedIn) {
    return done(null, obj);
  }

  requestJSON({
    url: endpoint + '/self',
    withCredentials: true
  }, function (err, selfResult) {
    if (err) {
      return done(err);
    }

    obj.self = selfResult;

    if (!obj.hasGoldAccess) {
      return done(null, obj);
    }

    requestSelfShopCodes(function (err, result) {
      if (err) {
        return done(err);
      }
      obj = Object.assign(obj, result);
      done(null, obj);
    });
  });
}

function completedAccountGold () {
  scrollToHighlightHash();
  startCountdownTicks();
}

function transformEmailOptins (optinsArray) {
    console.log('optinsArray', optinsArray);
  if (!optinsArray) return {}
  return optinsArray.reduce(function (atlas, value) {
    atlas[value.type] = value.in
    return atlas
  }, {})
}

function completedAccount () {
  scrollToHighlightHash()
  hookValueSelects();
  initLocationAutoComplete()
}

function transformVerify (obj) {
  obj.code = window.location.pathname.split('/')[2]
  obj.isSignedIn = isSignedIn()
  return obj
}

function completedVerify () {
  initLocationAutoComplete()
}

function verifyInvite (e, el) {
  var data = getTargetDataSet(el)

  if (!data.googleMapsPlaceId) {
    return alert('Location is required.')
  }

  if (!data.password) {
    return alert('Password is required.')
  }

  requestJSON({
    url: endhost + '/invite/complete',
    method: 'POST',
    data: data
  }, function (err, result) {
    if (err) {
      return toasty(new Error(err))
    }
    toasty('Account verified, please sign in')
    go('/signin')
  })
}

function processAccountSettings (args) {
  const downloadFormatOptions = [
    {
      name: "MP3 320kbps",
      value: "mp3_320"
    }, {
      name: "MP3 128kbps",
      value: "mp3_128"
    }, {
      name: "MP3 V0",
      value: "mp3_v0"
    }, {
      name: "MP3 V2",
      value: "mp3_v2"
    }, {
      name: "WAV",
      value: "wav"
    }, {
      name: "FLAC",
      value: "flac"
    },
  ]

  processor(args, {
    transform: function (args) {
      const scope = {}
      const result = args.result

      scope.downloadOptions = downloadFormatOptions.map((opt) => {
        opt = Object.assign({}, opt)
        opt.selected = opt.value == result.preferredDownloadFormat
        return opt
      })

      scope.settings = result

      return scope
    }
  })
}

