function FormDataDeclare (form) {
  //The good browsers already have this
  var fd = new FormData(form)
  if(fd.entries) {
    return fd
  }

  //Safari needs some help
  this.data = {}

  if(form) {
    var els = form.querySelectorAll('[name]')
    els.forEach(function (el) {
      var name = el.getAttribute('name')
      var val = el.value
      if(el.getAttribute('type') == 'checkbox') {
        val = el.checked
      }
      this.data[name] = val
    }.bind(this))
  }
}

FormDataDeclare.prototype.entries = function* () {
  for(var k in this.data) {
    yield [k, this.data[k]]
  }
}


/**
 * Found at https://github.com/christianalfoni/form-data-to-object
 *
 * @arg {FormData} formData The form data to convert to an object.
 *
 * @returns {Object}
 */
function formDataToObject(formData) {
  var source = {}
  for(var pair of formData.entries()) {
    source[pair[0]] = pair[1]
  }
  return Object.keys(source).reduce(function (output, key) {
    var parentKey = key.match(/[^\[]*/i);
    var paths = key.match(/\[.*?\]/g) || [];
    paths = [parentKey[0]].concat(paths).map(function (key) {
      return key.replace(/\[|\]/g, '');
    });
    var currentPath = output;
    while (paths.length) {
      var pathKey = paths.shift();
      if (pathKey in currentPath) {
        currentPath = currentPath[pathKey];
      } else {
        currentPath[pathKey] = paths.length ? isNaN(paths[0]) ? {} : [] : source[key];
        currentPath = currentPath[pathKey];
      }
    }

    return output;
  }, {});
}

/**
 * Found at https://github.com/christianalfoni/form-data-to-object
 *
 * @arg {Object} obj - The data object.
 *
 * @returns {Object}
 */
function objectToFormData(obj) {
  function recur(formData, propName, currVal) {
    if (Array.isArray(currVal) || Object.prototype.toString.call(currVal) === '[object Object]') {
      Object.keys(currVal).forEach(function(v) {
        recur(formData, propName + "[" + v + "]", currVal[v]);
      });
      return formData;
    }

    formData.append(propName, currVal);
    return formData;
  }

  var keys = Object.keys(obj);
  return keys.reduce(function(formData, propName) {
    return recur(formData, propName, obj[propName]);
  }, new FormData());
}

/**
* Fixes form data objects with numberic keys where some may have been removed
* This turns {data: {0: 'one', 2: 'three'}} into data {0: 'one', 1: 'three'}
* And also turns {itemOne: '1', itemEight: '1'} into ['itemOne', 'itemEight']
* @returns {Object}
*/
function fixFormDataIndexes (formData, fields) {
  fields.forEach(function (name) {
    var ev = 'var value = formData.' + name
    eval(ev)

    if(value != undefined) {
      var newVal = []
      //This is for arrays that might have messed up indexes
      //this happens when nodes are deleted from the DOM
      //then FormData is used to get data
      if(value instanceof Array) {
        for(var k in value) {
          newVal.push(value[k])
        }
      }
      //
      //{gold: 1, sync: 1}
      //
      //['gold', 'sync']
      else if(typeof (value) == 'object') {
        for(var key in value) {
          if(value[key] && parseInt(value[key]) != 0) {
            newVal.push(key)
          }
        }
      }
      var set = 'formData.' + name + ' = newVal'
      eval(set)
    }
    else {
      eval('formData.' + name + ' = []')
    }
  })
  return formData
}

/**
 * Wrapper to convert form element data to object.
 *
 * @arg {Element} form The form to get data from.
 *
 * @returns {Object}
 */
function formToObject (form) {
  return formDataToObject(new FormDataDeclare(form))
}

/**
 * A helper for submitting forms that has default functionality
 * you can override with options.
 *
 * @param {Object} e - The event object.
 * @param {Object} opts - Options.
 * @param {String} opts.successMsg - Optional message to display on success.
 * @param {Function} opts.success - Optional success function to run on success.
 * @param {Function} opts.error - Optional error function to run on erros.
 * @param {Function} opts.transformData - Optional function to transform json data object.
 * @param {Boolean} opts.formData - Optional flag to send data as FormData instead of JSON object.
 */
function submitForm (e, opts={}) {
  e.preventDefault();
  opts.successMsg = opts.successMsg || 'Success!';

  //Default validate returns no errors
  if(!opts.validate) {
    opts.validate = function () {
      return []
    }
  }

  //Default validate returns no errors
  //This validation occurs before the transformData function happens
  if(!opts.prevalidate) {
    opts.prevalidate = function () {
      return []
    }
  }

  //The default success function just makes a notification with given message
  if(!opts.success) {
    opts.success = function () {
      if(opts.successMsg) {
        notifySuccess(opts.successMsg);
      }
    }
  }

  //Default error adds to form and makes notification
  if(!opts.error) {
    opts.error = function (err, form) {
      formErrors(form, err);
      notifyError(err);
    }
  }

  var form = e.target;
  if(form.disabled) {
    return;
  }
  var data = formToObject(form);
  var errors = [];
  opts.prevalidate(data, errors);
  if(typeof opts.transformData == 'function') {
    data = opts.transformData(data);
  }
  opts.validate(data, errors);
  formErrors(form, errors);
  if(errors.length) {
    return;
  }
  form.disabled = true;
  form.classList.toggle('submitting', true);
  var url;
  if(typeof opts.url == 'function') {
    url = opts.url(data);
  }
  else {
    url = opts.url;
  }
  const ropts = {
    url: url,
    data: opts.formData ? objectToFormData(data) : data,
    method: opts.method,
    withCredentials: true
  };
  var button = findNode('button.ladda-button', form);
  var l = Ladda.create(button);
  l.start();
  request(ropts, function (err, result) {
    l.stop();
    form.disabled = false;
    form.classList.toggle('submitting', false);
    if(err) {
      return opts.error(err, form);
    }
    opts.success(result, data);
  })
}

var TAG_MATCHER = 'tag\:([^ ]+)'

/**
 * Handles a form submission that is meant to redirect to a page
 * with GET parameters for filtering. This would include
 * things like page, search, sortOrder, sortValue, etc
 *
 * @param {Object} e Browser submit event
 * @param {Object} opts Options
 * @param {Object} opts.url URL to redirect them to
 */
function submitQueryForm (e, opts) {
  e.preventDefault();
  if (typeof(opts) == 'string') {
    opts = {
      url: opts
    };
  }
  var data = formToObject(getEventForm(e));
  var qo = {
    limit: data.limit
  }
  if (data.search) {
    var search = data.search;
    var re = new RegExp(TAG_MATCHER, 'g')
    var matches = (search.match(re) || [])
                        .map(x => x.match(new RegExp(TAG_MATCHER))[1])
    search = search.replace(re, '').trim()
    qo.search = search
    if (matches.length) qo.tagged = matches
  }
  var url = opts.url || '/';
  go(url + '?' + objectToQueryString(qo));
}
