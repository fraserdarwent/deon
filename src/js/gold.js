function transformGoldBuyPage (obj, done) {
  obj = obj || {};
  obj.goldSubscribe = transformGoldSubscribeForm();
  return obj;
}

function completedGoldBuyPage () {
  initLocationAutoComplete();
}

function processGoldBuyPage (args) {
  renderContent('gold-buy-page', {
    goldSubscribe: transformGoldSubscribeForm()
  })
  completedGoldBuyPage()
}

/**
 * Gives you the variables needed to render a gold subscribe form
 */
function transformGoldSubscribeForm (obj) {
  obj = obj || {}
  obj.isSignedIn = isSignedIn();
  obj.hasGold = hasGoldAccess();
  submitCheckoutGold.subs = [{type: 'gold', name: 'Gold Membership', amount: 500}];

  return obj;
}

function enableGoldCheckoutForm () {
  var checkoutButton = document.querySelector('[role=checkout]');
  checkoutButton.disabled = false;
  checkoutButton.textContent = 'Complete Checkout'
}

function submitCheckoutGold (e) {
  e.preventDefault();
  var form = e.target;
  var data = getDataSet(form);

  var checkoutButton = document.querySelector('[role=checkout]');
  var checkoutText = checkoutButton.textContent;
  checkoutButton.disabled = true;
  checkoutButton.innerHTML = 'Loading...'

  var checkout = function () {
    var paymentMethod = data.method;
    submitCheckoutGold[paymentMethod]();
  }

  if(isSignedIn()) {
    checkout();
  }
  else {
    var signOnMethod = data['sign-on-method'];
    var signOnContainer = document.querySelector('[role=sign-on-form]');
    //After successfully signin in or signup either through us, Facebook, or Google, this is checked
    var signOnCallback = function (err, obj, xhr) {
      if(err) {
        enableGoldCheckoutForm();
        return toasty(new Error(err.message));
      }
      signOnContainer.classList.toggle('hide', true);
      //onSignIn will update their session information and rerender headers and the like
      onSignIn(function () {
        //This will look at their current gold subscription from the server
        getUserServicesScope(function (err, opts) {
          if(err) {
            return window.alert(err.message);
          }
          //If they can't subscribe we don't let them continue
          //This can happen if they already have a subscription or they have free gold
          if(!opts.user.gold.canSubscribe){
            toasty('You already have a Gold subscription. Going to your services...');
            go('/account/services');
            return
          }
          if(signOnMethod == 'sign-up') {
            toasty('Account created! Continuing...')
          }
          else {
            toasty('Signed in! Continuing...')
          }
          checkout();
        });
      });
    }

    if(signOnMethod == 'sign-up') {
      data = transformSubmittedAccountData(data);
      var errors = validateSignUp(data, []);
      if(data.password != data.password_confirm) {
        errors.push('Passwords don\'t match');
      }
      if(errors.length > 0) {
        formErrors(form, errors)
        enableGoldCheckoutForm();
        return
      }
      signUp(data, '/signup', signOnCallback);
    }
    else {
      signIn(data, signOnCallback);
    }

  }
}
submitCheckoutGold.paypal = function () {
  requestJSON({
    url: endpoint + '/self/subscription/services',
    method: 'POST',
    withCredentials: true,
    data: {
      provider: 'paypal',
      returnUrl: location.origin + '/account/services/processing?type=gold',
      cancelUrl: location.origin + '/account/services/canceled-payment?type=gold',
      services: submitCheckoutGold.subs
    }
  }, function (err, body, xhr) {
    if (err) {
      return recordErrorAndAlert(err, 'Checkout Subscriptions PayPal')
    }
    if (!body.redirect) {
      return recordErrorAndGo(Error('Missing paypal redirect'), 'Checkout Subscriptions PayPal', '/account/services/error')
    }
    recordSubscriptionEvent('PayPal Successful');
    window.location = body.redirect
  })
}

submitCheckoutGold.stripe = function () {
  var handler = StripeCheckout.configure({
    key: STRIPE_PK,
    image: '/img/default.png',
    locale: 'auto',
    token: function(token) {
      requestJSON({
        url: endpoint + '/self/subscription/services',
        method: 'POST',
        withCredentials: true,
        data: {
          provider: 'stripe',
          token: token.id,
          services: submitCheckoutGold.subs
        }
      }, function (err, body, xhr) {
        if (err) return recordErrorAndAlert(err, 'Checkout Subscriptions Stripe')
        go('/account/services/subscribed?type=gold');
      })
    },
    closed: function () {
      enableGoldCheckoutForm();
    },
    opened: function () {
      enableGoldCheckoutForm();
    }
  })
  handler.open({
    name: 'Monstercat',
    description: 'Monstercat Gold',
    amount: submitCheckoutGold.subs[0].amount,
    email: session.user.email,
    panelLabel: "Subscribe {{amount}}"
  })
}

function submitGoldApplyCoupon (e) {
  var form = e.target;
  e.preventDefault();
  var data = formToObject(form);
  if(!data.trialCode) {
    return
  }

  var button = form.querySelector("[role=apply-coupon]");
  button.disabled = true;
  button.textContent = 'Loading';

  return requestJSON({
    url: endpoint + "/self/services/gold/code/" + data.trialCode,
    withCredentials: true
  }, function (err, obj, xhr) {
    button.disabled = false
    button.textContent = 'Apply'
    if (xhr.status == 404) return toasty(new Error(strings.codeNotFound))
    if (err) return toasty( new Error(err.message))
    if (!obj) return toasty( new Error(strings.error))
    if (!obj.valid) return toasty( new Error(strings.codeNotValid))
    var priceAreaEl = document.querySelector('.price-area');
    var freeDaysEl = document.querySelector('[role=trial-free-days]');
    freeDaysEl.innerHTML = obj.durationDays + ' days free';
    priceAreaEl.classList.toggle('coupon-code', true);
    priceAreaEl.classList.toggle('no-auto-renew', !obj.autoRenews);
    submitCheckoutGold.subs[0].amount = 0;
    submitCheckoutGold.subs[0].trialCode = obj.code;
    button.textContent = 'Done!'
    button.disabled = true;
    toasty('Coupon code applied!')
  });
}

function clickGoldSetSignOn (e, method) {
  var elements = document.querySelectorAll('[sign-on]');
  elements.forEach(function (el) {
    el.classList.toggle('hide', el.getAttribute('sign-on') != method)
  });

  document.querySelector('[name=sign-on-method]').value = method;
}

function transformGoldSubscription (obj) {
  var nobj = {
    nextBillingDate: formatDate(obj.availableUntil),
  }
  if (!obj.subscriptionActive) {
    nobj.canceled = true;
    nobj.endDate = formatDate(obj.availableUntil);
  }
  else{
    nobj.canceled = false;
  }
  return nobj
}

function processGoldPage (args) {
  processor(args, {
    start: function (args) {
      const scope = {}
      let featureBlocks = []

      featureBlocks.push({
        id: 'download-access',
        title: 'Download Access',
        description: 'Download tracks in MP3, FLAC, and WAV format.',
        image: '/img/gold-landing/1-DownloadAccess-v2.jpg',
        cta: 'Download Music',
        download: true
      }, {
        id: 'early-streaming',
        title: 'Early Streaming Access',
        description: 'Listen to releases on Monstercat.com 20 hours before they are released to everyone else.',
        cta: 'Listen Early',
        image: '/img/gold-landing/2-StreamingAccess.jpg',
      }, {
        id: 'support-the-artists',
        title: 'Support the Artists',
        description: 'Artists are paid out from Gold subscriptions based on how much people listen to their songs.',
        cta: 'Support the Artists',
        image: '/img/gold-landing/3-SupportArtists.jpg',
      }, {
        id: 'shop-discounts',
        title: 'Discounts in the Shop',
        description: 'Every month you have Gold you get a discount code for 10% off in <a href="https://shop.monstercat.com">the shop</a>. Goes up to 15% off after a year and 20% off after two years.',
        cta: 'Get Discounts',
        image: 'https://assets.monstercat.com/monstercat.com/merch40.jpg?image_width=1024'
      }, {
        id: 'discord',
        title: 'Gold-only Discord Chat',
        description: 'Come chat with us and other superfans in our Discord server.',
        cta: 'Join the Chat',
        image: '/img/gold-landing/5-Discord.jpg',
        discord: true
      }, {
        id: 'reddit',
        title: 'Subreddit Flair on /r/Monstercat',
        description: 'Show your bling off in the Monstercat subreddit.',
        cta: 'Get Your Flair',
        image: '/img/gold-landing/6-Reddit.png',
        reddit: true
      })

      featureBlocks = featureBlocks.map((i, index) => {
        i.isOdd = !(index % 2 == 0)
        return i
      })
      scope.featureBlocks = featureBlocks
      scope.hasGoldAccess = hasGoldAccess()
      scope.sessionName = getSessionName()
      scope.getGoldUrl = getGetGoldLink()

      if(scope.hasGoldAccess) {
        scope.redditUsername = session.user.redditUsername
      }
      else {
        scope.redditUsername = false
      }
      renderContent(args.template, scope)
    }
  })
}
