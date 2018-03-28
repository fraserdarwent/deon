//Links from higher priority platforms will appear higher on the page
var RELEASE_LINK_MAP = {
  youtube: {
    cta: 'Watch',
    label: 'Watch on YouTube',
    icon: 'social-y',
    priority: 110
  },
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
    priority: 90
  },
  applemusic: {
    cta: 'Play',
    icon: 'apple',
    label: 'Apple Music',
    priority: 90
  },
  googleplay: {
    cta: 'Download',
    label: 'Get on Google Play',
    icon: 'google',
    priority: 80
  },
  amazon: {
    cta: 'Download',
    label: 'Get on Amazon',
    icon: 'amazon',
    priority: 70
  },
  deezer: {
    cta: 'Listen',
    label: 'Listen on Deezer',
    name: 'D',
    noIcon: true,
    priority: 65
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
    priority: 50,
  },
  beatport: {
    cta: 'Get',
    icon: 'link',
    label: 'Get on Beatport',
    oldLabel: 'Get From Beatport',
    priority: 30,
  },
  mixcloud: {
    cta: 'Get',
    icon: 'mixcloud',
    label: 'Get on Mixcloud',
    priority: 20
  }
}

/**
 * Returns a no-dupe list of all artists website details on the given tracks
 *
 * @param tracks List of tracks returned by /api/catalo/browse
 * with the artistDetails property
 * @returns {Array[Object]}
 */
function getAllTracksWebsiteArtists (tracks) {
  var artists = []
  var artistIds = []

  tracks.forEach((track) => {
    track.artistDetails.forEach((artist) => {
      if (artistIds.indexOf(artist._id) == -1) {
        artists.push(transformWebsiteDetails(artist))
        artistIds.push(artist._id)
      }
    })
  })

  return artists
}

/**
 * Returns a no-dupe list of all artists user details on the given tracks
 *
 * @param tracks List of tracks returned by /api/catalo/browse with the artistUsers property
 * @returns {Array[Object]}
 */
function getAllTracksArtistsUsers (tracks) {
  var users = []
  var userIds = []

  tracks.forEach((track) => {
    track.artistUsers.forEach((user) => {
      if (userIds.indexOf(user._id) == -1) {
        users.push(user)
        userIds.push(user._id)
      }
    })
  })
  return users
}

/**
 * Transforms merch products returned from shopify
 *
 * @param {Object} args Result of request to shopify
 * @returns {Object}
 */
function processReleaseMerch (args) {
  processor(args, {
    success: function (args) {
      if (!args.result) {
        render(args.template, args.node, {
          loading: false
        })
        return
      }

      const maxProducts = 8
      const result = args.result
      const scope = {
        products: result.products
      }

      shuffle(scope.products)
      scope.products = scope.products.slice(0, maxProducts)
      scope.products = scope.products.map((prod) => {
        prod.utm = '?utm_source=website&utm_medium=release_page'
        return prod
      })
      scope.activeTest = cache(PAGE_RELEASE).activeTest
      render(args.template, args.node, scope)
    }
  })
}

/**
 * Transforms the result of getting events of artists on this release.
 *
 * @param {Object} obj
 * @param {Array[Object]} obj.results The events
 * @param {Object}
 */
function transformReleaseEvents (obj) {
  const scope = transformReleasePage.scope
  const maxEvents = 10

  obj.results = transformEvents(obj.results)
  obj.results = obj.results.slice(0, maxEvents)
  obj.artistsList = scope.releaseArtists
  obj.listArtists = scope.releaseArtists.length <= 4

  return obj
}

function getArtistsTwitters (artists) {
  artists.reduce(function (handles, artist) {
    if (artist.socials) {
      artist.socials.forEach(function (social) {
        if (social.platform == 'twitter') {
          handles.push({
            handle: getTwitterLinkUsername(social.link).substr(1)
          })
        }
      })
    }
    return handles
  }, [])
}

/**
 * Transforms the new release page
 *
 * @param {Object} obj Result of the request to get the release
 * @param {Function} done
 */
function processReleasePage (args) {
  processor(args, {
    success: function (args) {
      const scope = {
        release: mapRelease(args.result)
      }

      requestJSON({
        url: endpoint + '/catalog/browse/?albumId=' + scope.release._id,
        withCredentials: true
      }, (err, body) => {
        if (err) {
          done(err)
          return
        }

        transformTracks(body.results, (err, resultTracks) => {
          tracks = resultTracks.map((track, index) => {
            track.trackNumber = index + 1
            return track
          })
          if (err) {
            done(err)
            return
          }

          const artistListMax = 6

          scope.releaseArtists = getAllTracksWebsiteArtists(tracks)
          scope.releaseArtistUsers = getAllTracksArtistsUsers(tracks)
          scope.releaseArtistsLimited = scope.releaseArtists.length <= 6 ? scope.releaseArtists.slice() : []
          scope.moreReleasesFetchUrl = endpoint +
            '/catalog/release/' + scope.release._id + '/related'

          scope.releaseArtists = getAllTracksWebsiteArtists(tracks)
          scope.releaseArtistUsers = getAllTracksArtistsUsers(tracks)
          if (scope.releaseArtists.length <= artistListMax) {
            scope.releaseArtistsLimited = scope.releaseArtists.slice()
          }
          else {
            scope.releaseArtistsLimited = []
          }

          scope.moreReleasesFetchUrl = endpoint +
            '/catalog/release/' + scope.release._id + '/related'

          scope.coverImage = scope.release.cover
          scope.tracks = tracks
          scope.hasGoldAccess = hasGoldAccess()
          setPageTitle(scope.release.title + ' by ' + scope.release.renderedArtists)

          splittests.release1FeatureOrder = new SplitTest({
            name: 'release-1-featuresorder',
            dontCheckStarter: true,
            modifiers: {
              'gold-merch-more': function (_this) {
                scope.features = [{
                  gold: true
                }, {
                  merch: true
                }, {
                  moreFromArtists: true
                }]
              },
              'merch-gold-more': function (_this) {
                scope.features = [{
                  merch: true
                }, {
                  gold: true
                }, {
                  moreFromArtists: true
                }]
              },
              'more-merch-gold': function (_this) {
                scope.features = [{
                  moreFromArtists: true
                }, {
                  merch: true
                }, {
                  gold: true
                }]
              }
              ,
              'more-gold-merch': function (_this) {
                scope.features = [{
                  moreFromArtists: true
                }, {
                  gold: true
                }, {
                  merch: true
                }]
              }
            },
            onStarted: function () {
              scope.activeTest = 'release1FeatureOrder'
              cache(PAGE_RELEASE, scope)
              renderContent(args.template, scope)
            }
          })
          splittests.release1FeatureOrder.start()
        })
      })
    }
  })
}

function completedReleasePage () {
  startCountdownTicks()

  var followButtons = document.querySelectorAll('[twitter-follow]')

  followButtons.forEach((el) => {
    twttr.widgets.createFollowButton(
      el.getAttribute('twitter-follow'),
      el,
      { size: 'large' }
    )
  })

  //TODO: Store tweet IDs in releases and check them here
  /*
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
  */
}

function processRelatedReleases (args) {
  processor(args, {
    success: function (args) {
      const pageScope = cache(PAGE_RELEASE)
      const maxReleases = 8
      const releases = args.result.results
        .map(mapRelease)
        .splice(0, maxReleases)
      const maxFromArtists = 4

      shuffle(releases)

      const scope = {
        results: releases,
        activeTest: pageScope.activeTest,
        showArtistsList: pageScope.releaseArtistUsers.length <= maxFromArtists,
        artistsList: pageScope.releaseArtists
      }

      render(args.template, args.node, scope)
    }
  })
}
