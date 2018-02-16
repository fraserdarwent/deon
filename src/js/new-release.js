//Links from higher priority platforms will appear higher on the page
var RELEASE_LINK_MAP = {
  spotify: {
    label: 'Listen on Spotify',
    icon: 'spotify',
    cta: 'Play',
    priority: 100
  },
  itunes: {
    cta: 'Download',
    label: 'Download on iTunes',
    icon: 'apple',
    priority: 90,
    oldLabel: 'Download On iTunes'
  },
  applemusic: {
    cta: 'Play',
    icon: 'apple',
    label: 'Apple Music',
    priority: 80
  },
  googleplay: {
    cta: 'Download',
    label: 'Get on Google Play',
    oldLabel: 'Get on Google Play',
    icon: 'google',
    priority: 70
  },
  bandcamp: {
    cta: 'Download',
    label: 'Buy on Bandcamp',
    oldLabel: 'Buy from Bandcamp',
    icon: 'bandcamp',
    priority: 60
  },
  soundcloud: {
    cta: 'Listen',
    label: 'Listen on SoundCloud',
    icon: 'soundcloud',
    priority: 50
  },
  youtube: {
    cta: 'Watch',
    label: 'Watch on YouTube',
    icon: 'youtube',
    priority: 40
  },
  beatport: {
    cta: 'Get',
    icon: 'link',
    label: 'Get on Beatport',
    oldLabel: 'Get From Beatport',
    priority: 30
  },
  mixcloud: {
    cta: 'Get',
    icon: 'link',
    label: 'Get on Mixcloud',
    priority: 20
  }
}

/*
Buy from Bandcamp': /bandcamp\.com/,
    'Download On iTunes': /apple\.com/,
    'Get From Beatport': /beatport\.com/,
    'Get on Google Play': /play\.google\.com/
*/

function getAllTracksWebsiteArtists (tracks) {
  var artists = [];
  var artistIds = [];
  tracks.forEach(function (track) {
    track.artistDetails.forEach(function (artist) {
      if (artistIds.indexOf(artist._id) == -1) {
        artists.push(transformWebsiteDetails(artist));
        artistIds.push(artist._id);
      }
    })
  })

  return artists;
}

function getAllTracksArtistsUsers (tracks) {
  var users = [];
  var userIds = [];
  tracks.forEach(function (track) {
    track.artistUsers.forEach(function (user) {
      if (userIds.indexOf(user._id) == -1) {
        users.push(user);
        userIds.push(user._id);
      }
    })
  })
  return users;
}

function transformReleaseMerch (obj) {
  shuffle(obj.products)
  obj.products = obj.products.slice(0,8)
  return obj
}

function transformReleaseEvents (obj) {
  obj.results = transformEvents(obj.results)
  obj.results = obj.results.slice(0, 10)
  obj.artistsList = transformReleasePage.scope.releaseArtists
  obj.listArtists = transformReleasePage.scope.releaseArtists.length <= 4;
  obj.activeTest= 'newReleasePageTest';

  return obj;
}

function completedReleaseEvents () {
  var h3 = document.querySelector('.release-events h3')
  console.log('h3', h3);
  if (!h3) {
    document.querySelector('.release-events').classList.toggle('hide', true)
    document.querySelector('.feature-separator').classList.toggle('hide', true)
  }
}

var newReleasePageTest;
function transformReleasePageSplit (obj, done, matches) {
  obj = {}
  obj.releaseId = matches[1]

  newReleasePageTest = new SplitTest({
    name: 'new-release-page',
    checkStart: false,
    //force: 'new',
    onStarted: function (alt) {
      obj.activeAlts = {}
      obj.activeAlts[alt] = true; //For easy reference in the template
      obj.activeAlt = alt
      obj.activeTest = 'newReleasePageTest'
      return done(null, obj);
    },
    modifiers: ['old', 'new']
  });
  newReleasePageTest.start();
}

var releasePageLayoutTest;
function transformReleasePage (obj, done) {
  history.scrollRestoration = "manual"

  var scope = {}
  scope.release = mapRelease(obj);

  requestJSON({
    url: endpoint + '/catalog/browse/?albumId=' + scope.release._id,
    withCredentials: true
  }, function (err, result) {
    if(err) {
      return done(err);
    }
    transformTracks(result, function (err, tracks) {
      tracks = tracks.map(function (track, index) {
        track.trackNumber = index + 1;
        return track;
      })
      if(err) {
        return done(err);
      }
      scope.releaseArtists = getAllTracksWebsiteArtists(tracks);
      scope.releaseArtistUsers = getAllTracksArtistsUsers(tracks);

      scope.titleFontSize = 46;
      var width = getTextWidth(scope.release.title, 'bold ' + scope.titleFontSize + 'px Montserrat')
      var maxTitleWidth = 490

      if (window.innerWidth < 490)  {
        maxTitleWidth = window.innerWidth * 0.8
      }

      var attempts = 0
      while(width > maxTitleWidth && attempts < 100) {
        scope.titleFontSize -= 2
        width = getTextWidth(scope.release.title, 'bold ' + scope.titleFontSize + 'px Montserrat')
        attempts++
      }

      var maxArtists = 6;
      if (scope.releaseArtists.length > maxArtists) {
        scope.moreArtists = scope.releaseArtists.length - maxArtists;
        shuffle(scope.releaseArtists);
        scope.releaseArtists = scope.releaseArtists.map(function (artist, index) {
          artist.shown = index < maxArtists
          return artist
        })
      }
      else {
        scope.moreArtists = false;
        scope.releaseArtists = scope.releaseArtists.map(function (artist, index) {
          artist.shown = true
          return artist
        })
      }

      scope.artistTwitters = scope.releaseArtists.reduce(function (handles, artist) {
        artist.socials.forEach(function (social) {
          if(social.platform == 'twitter') {
            handles.push({
              handle: getTwitterLinkUsername(social.link).substr(1)
            })
          }
        })

        return handles
      }, [])

      scope.numArtistBeakpoints = [];
      scope.coverImage = (scope.release.cover);
      scope.tracks = tracks;
      scope.hasManyTracks = scope.tracks.length > 1
      scope.showMerch = true;
      for(var i = 0; i <= scope.releaseArtists.length; i++) {
        scope.numArtistBeakpoints.push('gte-' + (i + 1))
      }
      if(scope.releaseArtists.length >= 6) {
        scope.showMerch = false;
      }
      setPageTitle(scope.release.title + ' by ' + scope.release.renderedArtists)
      scope.hasGoldAccess = hasGoldAccess()
      scope.activeTest = 'newReleasePageTest'
      scope.artistIds = scope.releaseArtists.map(function (wd) {
        return wd._id
      }).join(',')

      var feature = window.location.hash.substr(1);
      //feature = 'artistsEvents';
      scope.feature = {
        merch: false,
        tweet: false,
        gold: false,
        twitterFollowButtons: false,
        moreFromArtists: false,
        artistsEvents: false
      }

      if (feature) {
        scope.feature[feature] = true
      }
      else {
        scope.feature = false
        /*
        var keys = Object.keys(scope.feature);
        shuffle(keys)
        scope.feature[keys[0]] = true
        */
      }
      transformReleasePage.scope = scope;
      done(null, scope);
    });
  });
}

function completedReleasePage () {
  var prevHeight = 0;
  var samesame = 0;
  function checkHeight () {
    var currentHeight = document.body.scrollHeight;
    if (currentHeight == prevHeight) {
      samesame++
    }
    else {
      samesame = 0;
    }

    if (samesame == 10) {
      EPPZScrollTo.scrollTo(document.querySelector('.release-page'), 0, 1000);
    }
    else {
      setTimeout(checkHeight, 10);
    }

    prevHeight = currentHeight;
  }

  checkHeight();
  startCountdownTicks();

  var bg = document.querySelector('.release-bg')

  function parallaxScroll () {
    var pos = EPPZScrollTo.documentVerticalScrollPosition()
    if (bg) {
      bg.style.backgroundPositionY = (pos * 1.6 * -1) + 'px';
    }
  }

  window.addEventListener("openroute", function () {
    window.removeEventListener('scroll', parallaxScroll, {once: true})
  })

  window.addEventListener('scroll', parallaxScroll)

  var followButtons = document.querySelectorAll('[twitter-follow]');
  followButtons.forEach(function (el) {
    var handle = el.getAttribute('twitter-follow')
    twttr.widgets.createFollowButton(
      handle,
      el,
      {
        size: 'large'
      }
    );
  })

  //TODO: Store tweet IDs in releases and check them here
  var tweetContainer = document.getElementById('release-official-tweet')
  if (tweetContainer) {
    twttr.widgets.createTweet(
      '963485399766122501',
      tweetContainer,
      {
        theme: 'light'
      }
    )
  }

  //If the "More From These Artists" container exists, then we will populate with
  //a random sampling of tracks that aren't on this page
  var moreFromContainer = document.querySelector('.more-from-artists')
  if (moreFromContainer) {
    requestJSON({
      url: endpoint + '/catalog/browse?types=Single,EP,Album&limit=50&artistIds=' + transformReleasePage.scope.releaseArtistUsers.map(function (artist) {
        return artist._id
      })
    }, function (err, result) {
      if (err) {
        console.log(err)
        moreFromContainer.classList.toggle('hide', true)
        return
      }

      var tracks = transformTracks(result, function (err, tracks) {
        //Randomize them
        shuffle(tracks)

        //Filter out any tracks that are this release
        tracks = tracks.filter(function (track) {
          var isThisRelease = track.release._id == transformReleasePage.scope.release._id
          return !isThisRelease
        });

        if (tracks.length >= 8) {
          tracks = tracks.splice(0, 8)
        }
        else {
          tracks = tracks.splice(0, 6)
        }

        if (tracks.length > 0) {
          var scope = {
            results: tracks,
            listArtists: transformReleasePage.scope.releaseArtistUsers.length <= 4,
            artistsList: transformReleasePage.scope.releaseArtists
          }
          render(moreFromContainer, getTemplate('more-from-artists'), scope)
        }
        else {
          moreFromContainer.classList.toggle('hide', true)
        }
      });
    })
  }
}

function clickCycleReleaseArtists () {
  var artists = document.querySelectorAll('.release-artist-container');
  if (!artists[artists.length - 1].classList.contains('hide')) {
    artists.forEach(function (el, index) {
      el.classList.toggle('hide', index >= 6)
    })
  }
  else {
    var numShown = 0;
    var startShowing = false
    artists.forEach(function (el) {
      if (!el.classList.contains('hide')) {
        startShowing = true;
        el.classList.toggle('hide', true)
      }
      else {
        if (startShowing && numShown < 6) {
          el.classList.toggle('hide', false)
          numShown++
        }
      }
    })
  }
}
