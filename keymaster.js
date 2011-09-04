//     keymaster.js
//     (c) 2011 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    // original console.debug
    _CONSOLE_DEBUG,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    _fallbackScope = null,
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      option: 18, '⌥': 18, alt: 18,
      ctrl: 17, control: 17,
      meta: 91, command: 91, '⌘': 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      slash: 47, backslash: 92,
      home: 36, end: 35,
      pageup: 33, pagedown: 34
    },
    // keyCode to charCode, or just in need of remapping
    // This might be subject to keyboard layout, might not work entirely, very
    // possibly to work only with us keyboard.
    _KC_MAP = {
      false: {
         93: 91, 224: 91, // right command on webkit, command on Gecko
        109: 45,          // '-' minus
        187: 61,          // '=' on Chromium
        188: 44,          // ','
        189: 45,          // '-' on Chromium
        190: 46,          // '.'
        191: 47,          // '/' slash
        192: 96,          // '`'
        219: 91,          // '['
        220: 92,          // '\' blashslash
        221: 93           // ']'
      },
      true: {
         59:  58,         // ':'
         61:  43,         // '+'
         93:  91, 224: 91,// right command on webkit, command on Gecko
        109:  95,         // '_' underscore
        187:  43,         // '+' on Chromium
        188:  60,         // '<'
        189:  95,         // '_' on Chromium
        190:  62,         // '>'
        191:  63,         // '?'
        192: 126,         // '~'
        219: 123,         // '{'
        220: 124,         // '?' blashslash
        221: 125          // '}'
      }
    }
  // setting up console.debug
  if (typeof console == 'undefined')
    console = {};
  _CONSOLE_DEBUG = console.debug || function(){};
  console.debug = function() {
    if (global.key.DEBUG)
      _CONSOLE_DEBUG.apply(this, arguments);
  }

  for (k=1; k<20; k++)
    _MODIFIERS['f' + k] = 111 + k;

  //Test a element against a selector
  function matches_sel(elem, selector, first, a, b, c){
    //Take off first part of selector
    first = (selector = selector.split(".")).shift();
    c = " " + elem.className + " ";
    
    //If there is a first section and it contains an id, check to see if that matches with the element, otherwise return a falsey value
    if (first && ~(a = first.indexOf("#"))
        && (b = first.slice(1 + a), first = first.slice(0, a), elem.id != b)
           ? 0
           //if there is anything left of the first section, test to see if it matches with the element's tag
           : first && elem.nodeName != first.toUpperCase()
             ? 0
             : 1) {
      //Loop through the rest of the selector testing for classNames
      for (a=0, b=selector.length; a<b; a++){
        if (!~c.indexOf(" " + selector[a] + " "))
          return 0;
      }

      //If everything else matched, return true
      return 1;
    }
  }

  // handle keydown event
  function dispatch(event){
    var key, tagName, charCodehandler, k, i, modifiersMatch;
    tagName = (event.target || event.srcElement).tagName;
    key = _KC_MAP[event.keyCode == 16][event.keyCode] || event.keyCode;
    console.debug('Got key:', event, tagName, event.keyCode, key);
    setModifiers(event);

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers))
      return;

    // for each potential shortcut
    for (i=0; i<_handlers[key].length; i++) {
      var handler = _handlers[key][i];
      // see if it's in the current scope
      if (handler.targetSpec.scope && handler.targetSpec.scope != _scope)
        continue;
      // ignore keypressed in any elements that support keyboard data input as long as they are not specifically targeted
      if (handler.targetSpec.match === null &&
          (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA'))
        continue;
      if (handler.targetSpec.match &&
          ((typeof handler.targetSpec.match == "string"     && !matches_sel(event.target, handler.targetSpec.match))
           || (handler.targetSpec.match instanceof Array    &&  handler.targetSpec.match.indexOf(event.target) == -1)
           || (handler.targetSpec.match instanceof Function && !handler.targetSpec.match(event, handler))
          ))
        continue;
      // check if modifiers match if any
      modifiersMatch = handler.mods.length > 0;
      for (k in _mods)
        if ((  !_mods[k] && handler.mods.indexOf(+k) >  -1)
            || (_mods[k] && handler.mods.indexOf(+k) == -1))
          modifiersMatch = false;
      // call the handler and stop the event if neccessary
      if ((handler.mods.length == 0
           && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91])
          || modifiersMatch){
        if (handler.method(event)===false){
          if (event.preventDefault)
            event.preventDefault();
          else
            event.returnValue = false;

          if (event.stopPropagation)
            event.stopPropagation();

          if (event.cancelBubble)
            event.cancelBubble = true;
        }
      }
    }
  };

  function setModifiers(event) {
    // XXX this function requires a rewrite.
    var downEvent = event.type == 'keydown';
    var key = _KC_MAP[event.keyCode == 16][event.keyCode] || event.keyCode;
    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if (key in _mods) {
      _mods[key] = downEvent;
      // 'assignKeys' from inside this closure is exported to window.key
      for (k in _MODIFIERS)
        if (_MODIFIERS[k] == key)
          assignKeys[k] = downEvent;
      return;
    }
    // this is overlapping above
    for (var k in _MODIFIERS) {
      if (k + 'Key' in event) {
        _mods[_MODIFIERS[k]] = event[k + 'Key'];
        for (km in _MODIFIERS)
          if (km == k)
            assignKeys[km] = event[k + 'Key'];
      }
    }
  }

  // parse and assign shortcut
  function assignKey(key, targetSpec, method){
    var keys, mods, i, mi;
    /*
    if (method === undefined) {
      method = targetSpec;
      targetSpec = { match: null };
    }
    if (typeof targetSpec == 'string')
      targetSpec = { scope: targetSpec };
    */
    key = key.replace(/\s/g,'');
    keys = key.split(',');
    // for each shortcut
    for (i=0; i<keys.length; i++) {
      var originalKey = keys[i];
      // set modifier keys if any
      mods = [];
      key = originalKey.split('+');
      if(key.length > 1){
        mods = key.slice(0,key.length - 1).map(function(mod){
            return _MODIFIERS[mod];
            });
        key = [key[key.length - 1]];
      }
      // convert to keycode and...
      key = key[0]
      key = key.length > 1 ? _MAP[key] : key.toUpperCase().charCodeAt(0);
      // ...store handler
      if (!(key in _handlers))
        _handlers[key] = [];
      _handlers[key].push({ targetSpec: targetSpec,
                            method: method,
                            key: originalKey,
                            mods: mods });
    }
  };

  function cloneTargetSpec(targetSpec) {
    return {scope: targetSpec.scope,
            match: (targetSpec.match instanceof Array)
                   // don't use reference of array, duplicate it
                   ? targetSpec.match.slice()
                   // null, undefined, string
                   : targetSpec.match
            };
  } 

  function assignKeys(keys, targetSpec, method) {
    if (method === undefined) {
      method = targetSpec;
      targetSpec = { match: null };
    }

    if (typeof targetSpec == "string")
      targetSpec = { scope: targetSpec };
    else if (targetSpec instanceof Array ||
             targetSpec instanceof Function)
      targetSpec = { match: targetSpec };
    else if (targetSpec.match === undefined && targetSpec.scope === undefined)
      targetSpec = { match: [targetSpec] };

    if (typeof keys == 'string')
      keys = [keys];
    // don't touch original targetSpec
    targetSpec = cloneTargetSpec(targetSpec);

    // If match is a single HTMLElement, put it in a array
    // But we don't care it really is a HTMLElement, though it should be,
    // because IE does not have the definition of HTMLElement.
    if (  targetSpec.match &&
        !(typeof targetSpec.match == "string") &&
        !(targetSpec.match instanceof Array) &&
        !(targetSpec.match instanceof Function))
      targetSpec.match = [targetSpec.match];

    for (var i=0; i<keys.length; i++) {
      var key = keys[i];
      //create specific scope for current key in sequence
      var newScope = key;
      if (targetSpec.scope !== undefined)
        newScope = targetSpec.scope + '-' + newScope;
      if (i == 0)
        newScope = 'seq-' + newScope;
      if (i < keys.length - 1) {
        (function(scope, seqBegin){
          assignKey(key, targetSpec, function (ev, key) {
            // If another seq is in progress, then this seq won't be started.
            if (_fallbackScope !== null && seqBegin)
              return;
            if (seqBegin) {
              _fallbackScope = _scope;
              console.debug('save scope: ' + _scope);
              }
            setScope(scope, true);

              // reset scope after 1 second
            _timer = setTimeout(function () {
              if (_fallbackScope === null) {
                return;
              }
              console.debug('restore scope: ' + _fallbackScope);
              setScope(_fallbackScope);
            }, 1000);
          })
        })(newScope, i==0);
      } else {
        // last key should perform the method
        assignKey(key, targetSpec, method);
      }
      targetSpec = cloneTargetSpec(targetSpec);
      targetSpec.scope = newScope;
    }
  }

  // initialize key.<modifier> to false
  for (k in _MODIFIERS)
    assignKeys[k] = false;

  // set current scope (default 'all')
  function setScope(scope, keepFallback){
    _scope = scope || 'all';
    console.debug('set scope to: ' + _scope);
    if (!keepFallback) {
      _fallbackScope = null;
      console.debug('fallback scope has been resetted');
    }
  };

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on' + event, function(){
          method(window.event);
          });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', dispatch);
  addEvent(document, 'keyup', setModifiers);

  // set window.key and window.key.setScope
  global.key = assignKeys;
  global.key.setScope = setScope;
  global.key.DEBUG = false;

  if (typeof module !== 'undefined')
    module.exports = key;

})(this);
