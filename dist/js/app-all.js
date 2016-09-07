/**  合并后的app-all.js, apph5页面的js文件从828行开始 **/

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >=
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch(event){
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  function isPointerEventType(e, type){
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  $(document).ready(function(){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body
    }

    $(document)
      .bind('MSGestureEnd', function(e){
        var swipeDirectionFromVelocity =
          e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null
        if (swipeDirectionFromVelocity) {
          touch.el.trigger('swipe')
          touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
        }
      })
      .on('touchstart MSPointerDown pointerdown', function(e){
        if((_isPointerType = isPointerEventType(e, 'down')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        if (e.touches && e.touches.length === 1 && touch.x2) {
          // Clear out touch movement data if we have it sticking around
          // This can occur if touchcancel doesn't fire due to preventDefault, etc.
          touch.x2 = undefined
          touch.y2 = undefined
        }
        now = Date.now()
        delta = now - (touch.last || now)
        touch.el = $('tagName' in firstTouch.target ?
          firstTouch.target : firstTouch.target.parentNode)
        touchTimeout && clearTimeout(touchTimeout)
        touch.x1 = firstTouch.pageX
        touch.y1 = firstTouch.pageY
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true
        touch.last = now
        longTapTimeout = setTimeout(longTap, longTapDelay)
        // adds the current touch contact for IE gesture recognition
        if (gesture && _isPointerType) gesture.addPointer(e.pointerId)
      })
      .on('touchmove MSPointerMove pointermove', function(e){
        if((_isPointerType = isPointerEventType(e, 'move')) &&
          !isPrimaryTouch(e)) return
        firstTouch = _isPointerType ? e : e.touches[0]
        cancelLongTap()
        touch.x2 = firstTouch.pageX
        touch.y2 = firstTouch.pageY

        deltaX += Math.abs(touch.x1 - touch.x2)
        deltaY += Math.abs(touch.y1 - touch.y2)
      })
      .on('touchend MSPointerUp pointerup', function(e){
        if((_isPointerType = isPointerEventType(e, 'up')) &&
          !isPrimaryTouch(e)) return
        cancelLongTap()

        // swipe
        if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
            (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

          swipeTimeout = setTimeout(function() {
            if (touch.el){
              touch.el.trigger('swipe')
              touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
            }
            touch = {}
          }, 0)

        // normal tap
        else if ('last' in touch)
          // don't fire tap when delta position changed by more than 30 pixels,
          // for instance when moving to a point and back to origin
          if (deltaX < 30 && deltaY < 30) {
            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
            // ('tap' fires before 'scroll')
            tapTimeout = setTimeout(function() {

              // trigger universal 'tap' with the option to cancelTouch()
              // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
              var event = $.Event('tap')
              event.cancelTouch = cancelAll
              // [by paper] fix -> "TypeError: 'undefined' is not an object (evaluating 'touch.el.trigger'), when double tap
              if (touch.el) touch.el.trigger(event)

              // trigger double tap immediately
              if (touch.isDoubleTap) {
                if (touch.el) touch.el.trigger('doubleTap')
                touch = {}
              }

              // trigger single tap after 250ms of inactivity
              else {
                touchTimeout = setTimeout(function(){
                  touchTimeout = null
                  if (touch.el) touch.el.trigger('singleTap')
                  touch = {}
                }, 250)
              }
            }, 0)
          } else {
            touch = {}
          }
          deltaX = deltaY = 0

      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)
  })

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })
})(Zepto)

/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
*/

function Swipe(container, options) {

  "use strict";

  // utilities
  var noop = function() {}; // simple no operation function
  var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

  // check browser capabilities
  var browser = {
    addEventListener: !!window.addEventListener,
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
    transitions: (function(temp) {
      var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
      for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
      return false;
    })(document.createElement('swipe'))
  };

  // quit if no root element
  if (!container) return;
  var element = container.children[0];
  var slides, slidePos, width, length;
  options = options || {};
  var index = parseInt(options.startSlide, 10) || 0;
  var speed = options.speed || 300;
  options.continuous = options.continuous !== undefined ? options.continuous : true;

  function setup() {

    // cache slides
    slides = element.children;
    length = slides.length;

    // set continuous to false if only one slide
    if (slides.length < 2) options.continuous = false;

    //special case if two slides
    if (browser.transitions && options.continuous && slides.length < 3) {
      element.appendChild(slides[0].cloneNode(true));
      element.appendChild(element.children[1].cloneNode(true));
      slides = element.children;
    }

    // create an array to store current positions of each slide
    slidePos = new Array(slides.length);

    // determine width of each slide
    width = container.getBoundingClientRect().width || container.offsetWidth;

    element.style.width = (slides.length * width) + 'px';

    // stack elements
    var pos = slides.length;
    while(pos--) {

      var slide = slides[pos];

      slide.style.width = width + 'px';
      slide.setAttribute('data-index', pos);

      if (browser.transitions) {
        slide.style.left = (pos * -width) + 'px';
        move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
      }

    }

    // reposition elements before and after index
    if (options.continuous && browser.transitions) {
      move(circle(index-1), -width, 0);
      move(circle(index+1), width, 0);
    }

    if (!browser.transitions) element.style.left = (index * -width) + 'px';

    container.style.visibility = 'visible';

  }

  function prev() {

    if (options.continuous) slide(index-1);
    else if (index) slide(index-1);

  }

  function next() {

    if (options.continuous) slide(index+1);
    else if (index < slides.length - 1) slide(index+1);

  }

  function circle(index) {

    // a simple positive modulo using slides.length
    return (slides.length + (index % slides.length)) % slides.length;

  }

  function slide(to, slideSpeed) {

    // do nothing if already on requested slide
    if (index == to) return;

    if (browser.transitions) {

      var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

      // get the actual position of the slide
      if (options.continuous) {
        var natural_direction = direction;
        direction = -slidePos[circle(to)] / width;

        // if going forward but to < index, use to = slides.length + to
        // if going backward but to > index, use to = -slides.length + to
        if (direction !== natural_direction) to =  -direction * slides.length + to;

      }

      var diff = Math.abs(index-to) - 1;

      // move all the slides between index and to in the right direction
      while (diff--) move( circle((to > index ? to : index) - diff - 1), width * direction, 0);

      to = circle(to);

      move(index, width * direction, slideSpeed || speed);
      move(to, 0, slideSpeed || speed);

      if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

    } else {

      to = circle(to);
      animate(index * -width, to * -width, slideSpeed || speed);
      //no fallback for a circular continuous if the browser does not accept transitions
    }

    index = to;
    offloadFn(options.callback && options.callback(index, slides[index]));
  }

  function move(index, dist, speed) {

    translate(index, dist, speed);
    slidePos[index] = dist;

  }

  function translate(index, dist, speed) {

    var slide = slides[index];
    var style = slide && slide.style;

    if (!style) return;

    style.webkitTransitionDuration =
    style.MozTransitionDuration =
    style.msTransitionDuration =
    style.OTransitionDuration =
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform =
    style.MozTransform =
    style.OTransform = 'translateX(' + dist + 'px)';

  }

  function animate(from, to, speed) {

    // if not an animation, just reposition
    if (!speed) {

      element.style.left = to + 'px';
      return;

    }

    var start = +new Date;

    var timer = setInterval(function() {

      var timeElap = +new Date - start;

      if (timeElap > speed) {

        element.style.left = to + 'px';

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        clearInterval(timer);
        return;

      }

      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

    }, 4);

  }

  // setup auto slideshow
  var delay = options.auto || 0;
  var interval;

  function begin() {

    interval = setTimeout(next, delay);

  }

  function stop() {

    delay = 0;
    clearTimeout(interval);

  }


  // setup initial vars
  var start = {};
  var delta = {};
  var isScrolling;

  // setup event capturing
  var events = {

    handleEvent: function(event) {

      switch (event.type) {
        case 'touchstart': this.start(event); break;
        case 'touchmove': this.move(event); break;
        case 'touchend': offloadFn(this.end(event)); break;
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend': offloadFn(this.transitionEnd(event)); break;
        case 'resize': offloadFn(setup); break;
      }

      if (options.stopPropagation) event.stopPropagation();

    },
    start: function(event) {

      var touches = event.touches[0];

      // measure start values
      start = {

        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,

        // store time to determine touch duration
        time: +new Date

      };

      // used for testing first move event
      isScrolling = undefined;

      // reset delta and end measurements
      delta = {};

      // attach touchmove and touchend listeners
      element.addEventListener('touchmove', this, false);
      element.addEventListener('touchend', this, false);

    },
    move: function(event) {

      // ensure swiping with one touch and not pinching
      if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

      if (options.disableScroll) event.preventDefault();

      var touches = event.touches[0];

      // measure change in x and y
      delta = {
        x: touches.pageX - start.x,
        y: touches.pageY - start.y
      }

      // determine if scrolling test has run - one time test
      if ( typeof isScrolling == 'undefined') {
        isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
      }

      // if user is not trying to scroll vertically
      if (!isScrolling) {

        // prevent native scrolling
        event.preventDefault();

        // stop slideshow
        stop();

        // increase resistance if first or last slide
        if (options.continuous) { // we don't add resistance at the end

          translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);

        } else {

          delta.x =
            delta.x /
              ( (!index && delta.x > 0               // if first slide and sliding left
                || index == slides.length - 1        // or if last slide and sliding right
                && delta.x < 0                       // and if sliding at all
              ) ?
              ( Math.abs(delta.x) / width + 1 )      // determine resistance level
              : 1 );                                 // no resistance if false

          // translate 1:1
          translate(index-1, delta.x + slidePos[index-1], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(index+1, delta.x + slidePos[index+1], 0);
        }

      }

    },
    end: function(event) {

      // measure duration
      var duration = +new Date - start.time;

      // determine if slide attempt triggers next/prev slide
      var isValidSlide =
            Number(duration) < 250               // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds =
            !index && delta.x > 0                            // if first slide and slide amt is greater than 0
            || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

      if (options.continuous) isPastBounds = false;

      // determine direction of swipe (true:right, false:left)
      var direction = delta.x < 0;

      // if not scrolling vertically
      if (!isScrolling) {

        if (isValidSlide && !isPastBounds) {

          if (direction) {

            if (options.continuous) { // we need to get the next in this direction in place

              move(circle(index-1), -width, 0);
              move(circle(index+2), width, 0);

            } else {
              move(index-1, -width, 0);
            }

            move(index, slidePos[index]-width, speed);
            move(circle(index+1), slidePos[circle(index+1)]-width, speed);
            index = circle(index+1);

          } else {
            if (options.continuous) { // we need to get the next in this direction in place

              move(circle(index+1), width, 0);
              move(circle(index-2), -width, 0);

            } else {
              move(index+1, width, 0);
            }

            move(index, slidePos[index]+width, speed);
            move(circle(index-1), slidePos[circle(index-1)]+width, speed);
            index = circle(index-1);

          }

          options.callback && options.callback(index, slides[index]);

        } else {

          if (options.continuous) {

            move(circle(index-1), -width, speed);
            move(index, 0, speed);
            move(circle(index+1), width, speed);

          } else {

            move(index-1, -width, speed);
            move(index, 0, speed);
            move(index+1, width, speed);
          }

        }

      }

      // kill touchmove and touchend event listeners until touchstart called again
      element.removeEventListener('touchmove', events, false)
      element.removeEventListener('touchend', events, false)

    },
    transitionEnd: function(event) {

      if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

      }

    }

  }

  // trigger setup
  setup();

  // start auto slideshow if applicable
  if (delay) begin();


  // add event listeners
  if (browser.addEventListener) {

    // set touchstart event on element
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }

    // set resize event on window
    window.addEventListener('resize', events, false);

  } else {

    window.onresize = function () { setup() }; // to play nice with old IE

  }

  // expose the Swipe API
  return {
    setup: function() {

      setup();

    },
    slide: function(to, speed) {

      // cancel slideshow
      stop();

      slide(to, speed);

    },
    prev: function() {

      // cancel slideshow
      stop();

      prev();

    },
    next: function() {

      // cancel slideshow
      stop();

      next();

    },
    stop: function() {

      // cancel slideshow
      stop();

    },
    getPos: function() {

      // return current index position
      return index;

    },
    getNumSlides: function() {

      // return total number of slides
      return length;
    },
    kill: function() {

      // cancel slideshow
      stop();

      // reset element
      element.style.width = '';
      element.style.left = '';

      // reset slides
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];
        slide.style.width = '';
        slide.style.left = '';

        if (browser.transitions) translate(pos, 0, 0);

      }

      // removed event listeners
      if (browser.addEventListener) {

        // remove current event listeners
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);

      }
      else {

        window.onresize = null;

      }

    }
  }

}


if ( window.jQuery || window.Zepto ) {
  (function($) {
    $.fn.Swipe = function(params) {
      return this.each(function() {
        $(this).data('Swipe', new Swipe($(this)[0], params));
      });
    }
  })( window.jQuery || window.Zepto )
}

!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=t(e,document):"function"==typeof define&&define.amd?define([],function(){return t(e,document)}):e.plyr=t(e,document)}("undefined"!=typeof window?window:this,function(e,t){"use strict";function n(){var e,n,r,s=navigator.userAgent,a=navigator.appName,o=""+parseFloat(navigator.appVersion),i=parseInt(navigator.appVersion,10),l=!1,u=!1,c=!1,p=!1;return-1!==navigator.appVersion.indexOf("Windows NT")&&-1!==navigator.appVersion.indexOf("rv:11")?(l=!0,a="IE",o="11"):-1!==(n=s.indexOf("MSIE"))?(l=!0,a="IE",o=s.substring(n+5)):-1!==(n=s.indexOf("Chrome"))?(c=!0,a="Chrome",o=s.substring(n+7)):-1!==(n=s.indexOf("Safari"))?(p=!0,a="Safari",o=s.substring(n+7),-1!==(n=s.indexOf("Version"))&&(o=s.substring(n+8))):-1!==(n=s.indexOf("Firefox"))?(u=!0,a="Firefox",o=s.substring(n+8)):(e=s.lastIndexOf(" ")+1)<(n=s.lastIndexOf("/"))&&(a=s.substring(e,n),o=s.substring(n+1),a.toLowerCase()===a.toUpperCase()&&(a=navigator.appName)),-1!==(r=o.indexOf(";"))&&(o=o.substring(0,r)),-1!==(r=o.indexOf(" "))&&(o=o.substring(0,r)),i=parseInt(""+o,10),isNaN(i)&&(o=""+parseFloat(navigator.appVersion),i=parseInt(navigator.appVersion,10)),{name:a,version:i,isIE:l,isFirefox:u,isChrome:c,isSafari:p,isIos:/(iPad|iPhone|iPod)/g.test(navigator.platform),isTouch:"ontouchstart"in t.documentElement}}function r(e,t){var n=e.media;if("video"===e.type)switch(t){case"video/webm":return!(!n.canPlayType||!n.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/,""));case"video/mp4":return!(!n.canPlayType||!n.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/,""));case"video/ogg":return!(!n.canPlayType||!n.canPlayType('video/ogg; codecs="theora"').replace(/no/,""))}else if("audio"===e.type)switch(t){case"audio/mpeg":return!(!n.canPlayType||!n.canPlayType("audio/mpeg;").replace(/no/,""));case"audio/ogg":return!(!n.canPlayType||!n.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/,""));case"audio/wav":return!(!n.canPlayType||!n.canPlayType('audio/wav; codecs="1"').replace(/no/,""))}return!1}function s(e){if(!t.querySelectorAll('script[src="'+e+'"]').length){var n=t.createElement("script");n.src=e;var r=t.getElementsByTagName("script")[0];r.parentNode.insertBefore(n,r)}}function a(e,t){return Array.prototype.indexOf&&-1!==e.indexOf(t)}function o(e,t,n){return e.replace(new RegExp(t.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g,"\\$1"),"g"),n)}function i(e,t){e.length||(e=[e]);for(var n=e.length-1;n>=0;n--){var r=n>0?t.cloneNode(!0):t,s=e[n],a=s.parentNode,o=s.nextSibling;return r.appendChild(s),o?a.insertBefore(r,o):a.appendChild(r),r}}function l(e){e&&e.parentNode.removeChild(e)}function u(e,t){e.insertBefore(t,e.firstChild)}function c(e,t){for(var n in t)e.setAttribute(n,P["boolean"](t[n])&&t[n]?"":t[n])}function p(e,n,r){var s=t.createElement(e);c(s,r),u(n,s)}function d(e){return e.replace(".","")}function m(e,t,n){if(e)if(e.classList)e.classList[n?"add":"remove"](t);else{var r=(" "+e.className+" ").replace(/\s+/g," ").replace(" "+t+" ","");e.className=r+(n?" "+t:"")}}function f(e,t){return e?e.classList?e.classList.contains(t):new RegExp("(\\s|^)"+t+"(\\s|$)").test(e.className):!1}function y(e,n){var r=Element.prototype,s=r.matches||r.webkitMatchesSelector||r.mozMatchesSelector||r.msMatchesSelector||function(e){return-1!==[].indexOf.call(t.querySelectorAll(e),this)};return s.call(e,n)}function b(e,t,n,r,s){g(e,t,function(t){n&&n.apply(e,[t]),r.apply(e,[t])},s)}function v(e,t,n,r,s){var a=t.split(" ");if(P["boolean"](s)||(s=!1),e instanceof NodeList)for(var o=0;o<e.length;o++)e[o]instanceof Node&&v(e[o],arguments[1],arguments[2],arguments[3]);else for(var i=0;i<a.length;i++)e[r?"addEventListener":"removeEventListener"](a[i],n,s)}function g(e,t,n,r){e&&v(e,t,n,!0,r)}function h(e,t,n,r){if(e&&t){P["boolean"](n)||(n=!1);var s=new CustomEvent(t,{bubbles:n,detail:r});e.dispatchEvent(s)}}function k(e,t){return e?(t=P["boolean"](t)?t:!e.getAttribute("aria-pressed"),e.setAttribute("aria-pressed",t),t):void 0}function w(e,t){return 0===e||0===t||isNaN(e)||isNaN(t)?0:(e/t*100).toFixed(2)}function x(){var e=arguments;if(e.length){if(1===e.length)return e[0];for(var t=Array.prototype.shift.call(e),n=e.length,r=0;n>r;r++){var s=e[r];for(var a in s)s[a]&&s[a].constructor&&s[a].constructor===Object?(t[a]=t[a]||{},x(t[a],s[a])):t[a]=s[a]}return t}}function T(){var e={supportsFullScreen:!1,isFullScreen:function(){return!1},requestFullScreen:function(){},cancelFullScreen:function(){},fullScreenEventName:"",element:null,prefix:""},n="webkit o moz ms khtml".split(" ");if(P.undefined(t.cancelFullScreen))for(var r=0,s=n.length;s>r;r++){if(e.prefix=n[r],!P.undefined(t[e.prefix+"CancelFullScreen"])){e.supportsFullScreen=!0;break}if(!P.undefined(t.msExitFullscreen)&&t.msFullscreenEnabled){e.prefix="ms",e.supportsFullScreen=!0;break}}else e.supportsFullScreen=!0;return e.supportsFullScreen&&(e.fullScreenEventName="ms"===e.prefix?"MSFullscreenChange":e.prefix+"fullscreenchange",e.isFullScreen=function(e){switch(P.undefined(e)&&(e=t.body),this.prefix){case"":return t.fullscreenElement===e;case"moz":return t.mozFullScreenElement===e;default:return t[this.prefix+"FullscreenElement"]===e}},e.requestFullScreen=function(e){return P.undefined(e)&&(e=t.body),""===this.prefix?e.requestFullScreen():e[this.prefix+("ms"===this.prefix?"RequestFullscreen":"RequestFullScreen")]()},e.cancelFullScreen=function(){return""===this.prefix?t.cancelFullScreen():t[this.prefix+("ms"===this.prefix?"ExitFullscreen":"CancelFullScreen")]()},e.element=function(){return""===this.prefix?t.fullscreenElement:t[this.prefix+"FullscreenElement"]}),e}function S(v,S){function C(e,t,n,r){h(e,t,n,x({},r,{plyr:We}))}function L(t,n){S.debug&&e.console&&(n=Array.prototype.slice.call(n),P.string(S.logPrefix)&&S.logPrefix.length&&n.unshift(S.logPrefix),console[t].apply(console,n))}function O(){return{url:S.iconUrl,absolute:0===S.iconUrl.indexOf("http")||Ye.browser.isIE}}function j(){var e=[],t=O(),n=(t.absolute?"":t.url)+"#"+S.iconPrefix;return a(S.controls,"play-large")&&e.push('<button type="button" data-plyr="play" class="plyr__play-large">','<svg><use xlink:href="'+n+'-play" /></svg>','<span class="plyr__sr-only">'+S.i18n.play+"</span>","</button>"),e.push('<div class="plyr__controls">'),a(S.controls,"restart")&&e.push('<button type="button" data-plyr="restart">','<svg><use xlink:href="'+n+'-restart" /></svg>','<span class="plyr__sr-only">'+S.i18n.restart+"</span>","</button>"),a(S.controls,"rewind")&&e.push('<button type="button" data-plyr="rewind">','<svg><use xlink:href="'+n+'-rewind" /></svg>','<span class="plyr__sr-only">'+S.i18n.rewind+"</span>","</button>"),a(S.controls,"play")&&e.push('<button type="button" data-plyr="play">','<svg><use xlink:href="'+n+'-play" /></svg>','<span class="plyr__sr-only">'+S.i18n.play+"</span>","</button>",'<button type="button" data-plyr="pause">','<svg><use xlink:href="'+n+'-pause" /></svg>','<span class="plyr__sr-only">'+S.i18n.pause+"</span>","</button>"),a(S.controls,"fast-forward")&&e.push('<button type="button" data-plyr="fast-forward">','<svg><use xlink:href="'+n+'-fast-forward" /></svg>','<span class="plyr__sr-only">'+S.i18n.forward+"</span>","</button>"),a(S.controls,"progress")&&(e.push('<span class="plyr__progress">','<label for="seek{id}" class="plyr__sr-only">Seek</label>','<input id="seek{id}" class="plyr__progress--seek" type="range" min="0" max="100" step="0.1" value="0" data-plyr="seek">','<progress class="plyr__progress--played" max="100" value="0" role="presentation"></progress>','<progress class="plyr__progress--buffer" max="100" value="0">',"<span>0</span>% "+S.i18n.buffered,"</progress>"),S.tooltips.seek&&e.push('<span class="plyr__tooltip">00:00</span>'),e.push("</span>")),a(S.controls,"current-time")&&e.push('<span class="plyr__time">','<span class="plyr__sr-only">'+S.i18n.currentTime+"</span>",'<span class="plyr__time--current">00:00</span>',"</span>"),a(S.controls,"duration")&&e.push('<span class="plyr__time">','<span class="plyr__sr-only">'+S.i18n.duration+"</span>",'<span class="plyr__time--duration">00:00</span>',"</span>"),a(S.controls,"mute")&&e.push('<button type="button" data-plyr="mute">','<svg class="icon--muted"><use xlink:href="'+n+'-muted" /></svg>','<svg><use xlink:href="'+n+'-volume" /></svg>','<span class="plyr__sr-only">'+S.i18n.toggleMute+"</span>","</button>"),a(S.controls,"volume")&&e.push('<span class="plyr__volume">','<label for="volume{id}" class="plyr__sr-only">'+S.i18n.volume+"</label>",'<input id="volume{id}" class="plyr__volume--input" type="range" min="'+S.volumeMin+'" max="'+S.volumeMax+'" value="'+S.volume+'" data-plyr="volume">','<progress class="plyr__volume--display" max="'+S.volumeMax+'" value="'+S.volumeMin+'" role="presentation"></progress>',"</span>"),a(S.controls,"captions")&&e.push('<button type="button" data-plyr="captions">','<svg class="icon--captions-on"><use xlink:href="'+n+'-captions-on" /></svg>','<svg><use xlink:href="'+n+'-captions-off" /></svg>','<span class="plyr__sr-only">'+S.i18n.toggleCaptions+"</span>","</button>"),a(S.controls,"fullscreen")&&e.push('<button type="button" data-plyr="fullscreen">','<svg class="icon--exit-fullscreen"><use xlink:href="'+n+'-exit-fullscreen" /></svg>','<svg><use xlink:href="'+n+'-enter-fullscreen" /></svg>','<span class="plyr__sr-only">'+S.i18n.toggleFullscreen+"</span>","</button>"),e.push("</div>"),e.join("")}function V(){if(Ye.supported.full&&("audio"!==Ye.type||S.fullscreen.allowAudio)&&S.fullscreen.enabled){var e=A.supportsFullScreen;e||S.fullscreen.fallback&&!B()?(Ue((e?"Native":"Fallback")+" fullscreen enabled"),m(Ye.container,S.classes.fullscreen.enabled,!0)):Ue("Fullscreen not supported and fallback disabled"),Ye.buttons&&Ye.buttons.fullscreen&&k(Ye.buttons.fullscreen,!1),X()}}function q(){if("video"===Ye.type){Y(S.selectors.captions)||Ye.videoContainer.insertAdjacentHTML("afterbegin",'<div class="'+d(S.selectors.captions)+'"></div>'),Ye.usingTextTracks=!1,Ye.media.textTracks&&(Ye.usingTextTracks=!0);for(var e,t="",n=Ye.media.childNodes,r=0;r<n.length;r++)"track"===n[r].nodeName.toLowerCase()&&(e=n[r].kind,"captions"!==e&&"subtitles"!==e||(t=n[r].getAttribute("src")));if(Ye.captionExists=!0,""===t?(Ye.captionExists=!1,Ue("No caption track found")):Ue("Caption track found; URI: "+t),Ye.captionExists){for(var s=Ye.media.textTracks,a=0;a<s.length;a++)s[a].mode="hidden";if(H(Ye),(Ye.browser.isIE&&Ye.browser.version>=10||Ye.browser.isFirefox&&Ye.browser.version>=31)&&(Ue("Detected browser with known TextTrack issues - using manual fallback"),Ye.usingTextTracks=!1),Ye.usingTextTracks){Ue("TextTracks supported");for(var o=0;o<s.length;o++){var i=s[o];"captions"!==i.kind&&"subtitles"!==i.kind||g(i,"cuechange",function(){this.activeCues[0]&&"text"in this.activeCues[0]?R(this.activeCues[0].getCueAsHTML()):R()})}}else if(Ue("TextTracks not supported so rendering captions manually"),Ye.currentCaption="",Ye.captions=[],""!==t){var l=new XMLHttpRequest;l.onreadystatechange=function(){if(4===l.readyState)if(200===l.status){var e,t=[],n=l.responseText;t=n.split("\n\n");for(var r=0;r<t.length;r++){e=t[r],Ye.captions[r]=[];var s=e.split("\n"),a=0;-1===s[a].indexOf(":")&&(a=1),Ye.captions[r]=[s[a],s[a+1]]}Ye.captions.shift(),Ue("Successfully loaded the caption file via AJAX")}else Je(S.logPrefix+"There was a problem loading the caption file via AJAX")},l.open("get",t,!0),l.send()}}else m(Ye.container,S.classes.captions.enabled)}}function R(e){var n=Y(S.selectors.captions),r=t.createElement("span");n.innerHTML="",P.undefined(e)&&(e=""),P.string(e)?r.innerHTML=e.trim():r.appendChild(e),n.appendChild(r);n.offsetHeight}function D(e){function t(e,t){var n=[];n=e.split(" --> ");for(var r=0;r<n.length;r++)n[r]=n[r].replace(/(\d+:\d+:\d+\.\d+).*/,"$1");return s(n[t])}function n(e){return t(e,0)}function r(e){return t(e,1)}function s(e){if(null===e||void 0===e)return 0;var t,n=[],r=[];return n=e.split(","),r=n[0].split(":"),t=Math.floor(60*r[0]*60)+Math.floor(60*r[1])+Math.floor(r[2])}if(!Ye.usingTextTracks&&"video"===Ye.type&&Ye.supported.full&&(Ye.subcount=0,e=P.number(e)?e:Ye.media.currentTime,Ye.captions[Ye.subcount])){for(;r(Ye.captions[Ye.subcount][0])<e.toFixed(1);)if(Ye.subcount++,Ye.subcount>Ye.captions.length-1){Ye.subcount=Ye.captions.length-1;break}Ye.media.currentTime.toFixed(1)>=n(Ye.captions[Ye.subcount][0])&&Ye.media.currentTime.toFixed(1)<=r(Ye.captions[Ye.subcount][0])?(Ye.currentCaption=Ye.captions[Ye.subcount][1],R(Ye.currentCaption)):R()}}function H(){if(Ye.buttons.captions){m(Ye.container,S.classes.captions.enabled,!0);var e=Ye.storage.captionsEnabled;P["boolean"](e)||(e=S.captions.defaultActive),e&&(m(Ye.container,S.classes.captions.active,!0),k(Ye.buttons.captions,!0))}}function W(e){return Ye.container.querySelectorAll(e)}function Y(e){return W(e)[0]}function B(){try{return e.self!==e.top}catch(t){return!0}}function X(){function e(e){9===e.which&&Ye.isFullscreen&&(e.target!==r||e.shiftKey?e.target===n&&e.shiftKey&&(e.preventDefault(),r.focus()):(e.preventDefault(),n.focus()))}var t=W("input:not([disabled]), button:not([disabled])"),n=t[0],r=t[t.length-1];g(Ye.container,"keydown",e)}function U(e,t){if(P.string(t))p(e,Ye.media,{src:t});else if(t.constructor===Array)for(var n=t.length-1;n>=0;n--)p(e,Ye.media,t[n])}function J(){if(S.loadSprite){var e=O();e.absolute?(Ue("AJAX loading absolute SVG sprite"+(Ye.browser.isIE?" (due to IE)":"")),_(e.url,"sprite-plyr")):Ue("Sprite will be used as external resource directly")}var n=S.html;Ue("Injecting custom controls"),n||(n=j()),n=o(n,"{seektime}",S.seekTime),n=o(n,"{id}",Math.floor(1e4*Math.random()));var r;if(P.string(S.selectors.controls.container)&&(r=t.querySelector(S.selectors.controls.container)),P.htmlElement(r)||(r=Ye.container),r.insertAdjacentHTML("beforeend",n),S.tooltips.controls)for(var s=W([S.selectors.controls.wrapper," ",S.selectors.labels," .",S.classes.hidden].join("")),a=s.length-1;a>=0;a--){var i=s[a];m(i,S.classes.hidden,!1),m(i,S.classes.tooltip,!0)}}function z(){try{return Ye.controls=Y(S.selectors.controls.wrapper),Ye.buttons={},Ye.buttons.seek=Y(S.selectors.buttons.seek),Ye.buttons.play=W(S.selectors.buttons.play),Ye.buttons.pause=Y(S.selectors.buttons.pause),Ye.buttons.restart=Y(S.selectors.buttons.restart),Ye.buttons.rewind=Y(S.selectors.buttons.rewind),Ye.buttons.forward=Y(S.selectors.buttons.forward),Ye.buttons.fullscreen=Y(S.selectors.buttons.fullscreen),Ye.buttons.mute=Y(S.selectors.buttons.mute),Ye.buttons.captions=Y(S.selectors.buttons.captions),Ye.progress={},Ye.progress.container=Y(S.selectors.progress.container),Ye.progress.buffer={},Ye.progress.buffer.bar=Y(S.selectors.progress.buffer),Ye.progress.buffer.text=Ye.progress.buffer.bar&&Ye.progress.buffer.bar.getElementsByTagName("span")[0],Ye.progress.played=Y(S.selectors.progress.played),Ye.progress.tooltip=Ye.progress.container&&Ye.progress.container.querySelector("."+S.classes.tooltip),Ye.volume={},Ye.volume.input=Y(S.selectors.volume.input),Ye.volume.display=Y(S.selectors.volume.display),Ye.duration=Y(S.selectors.duration),Ye.currentTime=Y(S.selectors.currentTime),Ye.seekTime=W(S.selectors.seekTime),!0}catch(e){return Je("It looks like there is a problem with your controls HTML"),G(!0),!1}}function $(){m(Ye.container,S.selectors.container.replace(".",""),Ye.supported.full)}function G(e){e&&a(S.types.html5,Ye.type)?Ye.media.setAttribute("controls",""):Ye.media.removeAttribute("controls")}function K(e){var t=S.i18n.play;if(P.string(S.title)&&S.title.length&&(t+=", "+S.title,Ye.container.setAttribute("aria-label",S.title)),Ye.supported.full&&Ye.buttons.play)for(var n=Ye.buttons.play.length-1;n>=0;n--)Ye.buttons.play[n].setAttribute("aria-label",t);P.htmlElement(e)&&e.setAttribute("title",S.i18n.frameTitle.replace("{title}",S.title))}function Q(){var t=null;Ye.storage={},M.supported&&S.storage.enabled&&(e.localStorage.removeItem("plyr-volume"),t=e.localStorage.getItem(S.storage.key),t&&(/^\d+(\.\d+)?$/.test(t)?Z({volume:parseFloat(t)}):Ye.storage=JSON.parse(t)))}function Z(t){M.supported&&S.storage.enabled&&(x(Ye.storage,t),e.localStorage.setItem(S.storage.key,JSON.stringify(Ye.storage)))}function ee(){if(!Ye.media)return void Je("No media element found!");if(Ye.supported.full&&(m(Ye.container,S.classes.type.replace("{0}",Ye.type),!0),a(S.types.embed,Ye.type)&&m(Ye.container,S.classes.type.replace("{0}","video"),!0),m(Ye.container,S.classes.stopped,S.autoplay),m(Ye.ontainer,S.classes.isIos,Ye.browser.isIos),m(Ye.container,S.classes.isTouch,Ye.browser.isTouch),"video"===Ye.type)){var e=t.createElement("div");e.setAttribute("class",S.classes.videoWrapper),i(Ye.media,e),Ye.videoContainer=e}a(S.types.embed,Ye.type)&&te()}function te(){for(var n=t.createElement("div"),r=Ye.embedId,a=Ye.type+"-"+Math.floor(1e4*Math.random()),o=W('[id^="'+Ye.type+'-"]'),i=o.length-1;i>=0;i--)l(o[i]);if(m(Ye.media,S.classes.videoWrapper,!0),m(Ye.media,S.classes.embedWrapper,!0),"youtube"===Ye.type)Ye.media.appendChild(n),n.setAttribute("id",a),P.object(e.YT)?re(r,n):(s(S.urls.youtube.api),e.onYouTubeReadyCallbacks=e.onYouTubeReadyCallbacks||[],e.onYouTubeReadyCallbacks.push(function(){re(r,n)}),e.onYouTubeIframeAPIReady=function(){e.onYouTubeReadyCallbacks.forEach(function(e){e()})});else if("vimeo"===Ye.type)if(Ye.supported.full?Ye.media.appendChild(n):n=Ye.media,n.setAttribute("id",a),P.object(e.Vimeo))se(r,n);else{s(S.urls.vimeo.api);var u=e.setInterval(function(){P.object(e.Vimeo)&&(e.clearInterval(u),se(r,n))},50)}else if("soundcloud"===Ye.type){var p=t.createElement("iframe");p.loaded=!1,g(p,"load",function(){p.loaded=!0}),c(p,{src:"https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/"+r,id:a}),n.appendChild(p),Ye.media.appendChild(n),e.SC||s(S.urls.soundcloud.api);var d=e.setInterval(function(){e.SC&&p.loaded&&(e.clearInterval(d),ae.call(p))},50)}}function ne(){Ye.supported.full&&(De(),He()),K(Y("iframe"))}function re(t,n){Ye.embed=new e.YT.Player(n.id,{videoId:t,playerVars:{autoplay:S.autoplay?1:0,controls:Ye.supported.full?0:1,rel:0,showinfo:0,iv_load_policy:3,cc_load_policy:S.captions.defaultActive?1:0,cc_lang_pref:"en",wmode:"transparent",modestbranding:1,disablekb:1,origin:"*"},events:{onError:function(e){C(Ye.container,"error",!0,{code:e.data,embed:e.target})},onReady:function(t){var n=t.target;Ye.media.play=function(){n.playVideo(),Ye.media.paused=!1},Ye.media.pause=function(){n.pauseVideo(),Ye.media.paused=!0},Ye.media.stop=function(){n.stopVideo(),Ye.media.paused=!0},Ye.media.duration=n.getDuration(),Ye.media.paused=!0,Ye.media.currentTime=0,Ye.media.muted=n.isMuted(),S.title=n.getVideoData().title,Ye.supported.full&&Ye.media.querySelector("iframe").setAttribute("tabindex","-1"),ne(),C(Ye.media,"timeupdate"),C(Ye.media,"durationchange"),e.clearInterval(Be.buffering),Be.buffering=e.setInterval(function(){Ye.media.buffered=n.getVideoLoadedFraction(),(null===Ye.media.lastBuffered||Ye.media.lastBuffered<Ye.media.buffered)&&C(Ye.media,"progress"),Ye.media.lastBuffered=Ye.media.buffered,1===Ye.media.buffered&&(e.clearInterval(Be.buffering),C(Ye.media,"canplaythrough"))},200)},onStateChange:function(t){var n=t.target;switch(e.clearInterval(Be.playing),t.data){case 0:Ye.media.paused=!0,C(Ye.media,"ended");break;case 1:Ye.media.paused=!1,Ye.media.seeking=!1,C(Ye.media,"play"),C(Ye.media,"playing"),Be.playing=e.setInterval(function(){Ye.media.currentTime=n.getCurrentTime(),C(Ye.media,"timeupdate")},100);break;case 2:Ye.media.paused=!0,C(Ye.media,"pause")}C(Ye.container,"statechange",!1,{code:t.data})}}})}function se(t,n){Ye.embed=new e.Vimeo.Player(n,{id:parseInt(t),loop:S.loop,autoplay:S.autoplay,byline:!1,portrait:!1,title:!1}),Ye.media.play=function(){Ye.embed.play(),Ye.media.paused=!1},Ye.media.pause=function(){Ye.embed.pause(),Ye.media.paused=!0},Ye.media.stop=function(){Ye.embed.stop(),Ye.media.paused=!0},Ye.media.paused=!0,Ye.media.currentTime=0,ne(),Ye.embed.getCurrentTime().then(function(e){Ye.media.currentTime=e,C(Ye.media,"timeupdate")}),Ye.embed.getDuration().then(function(e){Ye.media.duration=e,C(Ye.media,"durationchange")}),Ye.embed.on("loaded",function(){P.htmlElement(Ye.embed.element)&&Ye.supported.full&&Ye.embed.element.setAttribute("tabindex","-1")}),Ye.embed.on("play",function(){Ye.media.paused=!1,C(Ye.media,"play"),C(Ye.media,"playing")}),Ye.embed.on("pause",function(){Ye.media.paused=!0,C(Ye.media,"pause")}),Ye.embed.on("timeupdate",function(e){Ye.media.seeking=!1,Ye.media.currentTime=e.seconds,C(Ye.media,"timeupdate")}),Ye.embed.on("progress",function(e){Ye.media.buffered=e.percent,C(Ye.media,"progress"),1===parseInt(e.percent)&&C(Ye.media,"canplaythrough")}),Ye.embed.on("ended",function(){Ye.media.paused=!0,C(Ye.media,"ended")})}function ae(){Ye.embed=e.SC.Widget(this),Ye.embed.bind(e.SC.Widget.Events.READY,function(){Ye.media.play=function(){Ye.embed.play(),Ye.media.paused=!1},Ye.media.pause=function(){Ye.embed.pause(),Ye.media.paused=!0},Ye.media.stop=function(){Ye.embed.seekTo(0),Ye.embed.pause(),Ye.media.paused=!0},Ye.media.paused=!0,Ye.media.currentTime=0,Ye.embed.getDuration(function(e){Ye.media.duration=e/1e3,ne()}),Ye.embed.getPosition(function(e){Ye.media.currentTime=e,C(Ye.media,"timeupdate")}),Ye.embed.bind(e.SC.Widget.Events.PLAY,function(){Ye.media.paused=!1,C(Ye.media,"play"),C(Ye.media,"playing")}),Ye.embed.bind(e.SC.Widget.Events.PAUSE,function(){Ye.media.paused=!0,C(Ye.media,"pause")}),Ye.embed.bind(e.SC.Widget.Events.PLAY_PROGRESS,function(e){Ye.media.seeking=!1,Ye.media.currentTime=e.currentPosition/1e3,C(Ye.media,"timeupdate")}),Ye.embed.bind(e.SC.Widget.Events.LOAD_PROGRESS,function(e){Ye.media.buffered=e.loadProgress,C(Ye.media,"progress"),1===parseInt(e.loadProgress)&&C(Ye.media,"canplaythrough")}),Ye.embed.bind(e.SC.Widget.Events.FINISH,function(){Ye.media.paused=!0,C(Ye.media,"ended")})})}function oe(){"play"in Ye.media&&Ye.media.play()}function ie(){"pause"in Ye.media&&Ye.media.pause()}function le(e){return P["boolean"](e)||(e=Ye.media.paused),e?oe():ie(),e}function ue(e){P.number(e)||(e=S.seekTime),pe(Ye.media.currentTime-e)}function ce(e){P.number(e)||(e=S.seekTime),pe(Ye.media.currentTime+e)}function pe(e){var t=0,n=Ye.media.paused,r=de();P.number(e)?t=e:P.object(e)&&a(["input","change"],e.type)&&(t=e.target.value/e.target.max*r),0>t?t=0:t>r&&(t=r),Ae(t);try{Ye.media.currentTime=t.toFixed(4)}catch(s){}if(a(S.types.embed,Ye.type)){switch(Ye.type){case"youtube":Ye.embed.seekTo(t);break;case"vimeo":Ye.embed.setCurrentTime(t.toFixed(0));break;case"soundcloud":Ye.embed.seekTo(1e3*t)}n&&ie(),C(Ye.media,"timeupdate"),Ye.media.seeking=!0}Ue("Seeking to "+Ye.media.currentTime+" seconds"),D(t)}function de(){var e=parseInt(S.duration),t=0;return null===Ye.media.duration||isNaN(Ye.media.duration)||(t=Ye.media.duration),isNaN(e)?t:e}function me(){m(Ye.container,S.classes.playing,!Ye.media.paused),m(Ye.container,S.classes.stopped,Ye.media.paused),Ne(Ye.media.paused)}function fe(){I={x:e.pageXOffset||0,y:e.pageYOffset||0}}function ye(){e.scrollTo(I.x,I.y)}function be(e){var n=A.supportsFullScreen;if(n){if(!e||e.type!==A.fullScreenEventName)return A.isFullScreen(Ye.container)?A.cancelFullScreen():(fe(),A.requestFullScreen(Ye.container)),void(Ye.isFullscreen=A.isFullScreen(Ye.container));Ye.isFullscreen=A.isFullScreen(Ye.container)}else Ye.isFullscreen=!Ye.isFullscreen,t.body.style.overflow=Ye.isFullscreen?"hidden":"";m(Ye.container,S.classes.fullscreen.active,Ye.isFullscreen),X(Ye.isFullscreen),Ye.buttons&&Ye.buttons.fullscreen&&k(Ye.buttons.fullscreen,Ye.isFullscreen),C(Ye.container,Ye.isFullscreen?"enterfullscreen":"exitfullscreen",!0),!Ye.isFullscreen&&n&&ye()}function ve(e){if(P["boolean"](e)||(e=!Ye.media.muted),k(Ye.buttons.mute,e),Ye.media.muted=e,0===Ye.media.volume&&ge(S.volume),a(S.types.embed,Ye.type)){switch(Ye.type){case"youtube":Ye.embed[Ye.media.muted?"mute":"unMute"]();break;case"vimeo":case"soundcloud":Ye.embed.setVolume(Ye.media.muted?0:parseFloat(S.volume/S.volumeMax))}C(Ye.media,"volumechange")}}function ge(e){var t=S.volumeMax,n=S.volumeMin;if(P.undefined(e)&&(e=Ye.storage.volume),(null===e||isNaN(e))&&(e=S.volume),e>t&&(e=t),n>e&&(e=n),Ye.media.volume=parseFloat(e/t),Ye.volume.display&&(Ye.volume.display.value=e),a(S.types.embed,Ye.type)){switch(Ye.type){case"youtube":Ye.embed.setVolume(100*Ye.media.volume);break;case"vimeo":case"soundcloud":Ye.embed.setVolume(Ye.media.volume)}C(Ye.media,"volumechange")}Ye.media.muted&&e>0&&ve()}function he(e){var t=Ye.media.muted?0:Ye.media.volume*S.volumeMax;P.number(e)||(e=S.volumeStep),ge(t+e)}function ke(e){var t=Ye.media.muted?0:Ye.media.volume*S.volumeMax;P.number(e)||(e=S.volumeStep),ge(t-e)}function we(){var e=Ye.media.muted?0:Ye.media.volume*S.volumeMax;Ye.supported.full&&(Ye.volume.input&&(Ye.volume.input.value=e),Ye.volume.display&&(Ye.volume.display.value=e)),Z({volume:e}),m(Ye.container,S.classes.muted,0===e),Ye.supported.full&&Ye.buttons.mute&&k(Ye.buttons.mute,0===e)}function xe(e){Ye.supported.full&&Ye.buttons.captions&&(P["boolean"](e)||(e=-1===Ye.container.className.indexOf(S.classes.captions.active)),Ye.captionsEnabled=e,k(Ye.buttons.captions,Ye.captionsEnabled),m(Ye.container,S.classes.captions.active,Ye.captionsEnabled),C(Ye.container,Ye.captionsEnabled?"captionsenabled":"captionsdisabled",!0),Z({captionsEnabled:Ye.captionsEnabled}))}function Te(e){var t="waiting"===e.type;clearTimeout(Be.loading),Be.loading=setTimeout(function(){m(Ye.container,S.classes.loading,t),Ne(t)},t?250:0)}function Se(e){if(Ye.supported.full){var t=Ye.progress.played,n=0,r=de();if(e)switch(e.type){case"timeupdate":case"seeking":if(Ye.controls.pressed)return;n=w(Ye.media.currentTime,r),"timeupdate"===e.type&&Ye.buttons.seek&&(Ye.buttons.seek.value=n);break;case"playing":case"progress":t=Ye.progress.buffer,n=function(){var e=Ye.media.buffered;return e&&e.length?w(e.end(0),r):P.number(e)?100*e:0}()}_e(t,n)}}function _e(e,t){if(Ye.supported.full){if(P.undefined(t)&&(t=0),P.undefined(e)){if(!Ye.progress||!Ye.progress.buffer)return;e=Ye.progress.buffer}P.htmlElement(e)?e.value=t:e&&(e.bar&&(e.bar.value=t),e.text&&(e.text.innerHTML=t))}}function Ee(e,t){if(t){isNaN(e)&&(e=0),Ye.secs=parseInt(e%60),Ye.mins=parseInt(e/60%60),Ye.hours=parseInt(e/60/60%60);var n=parseInt(de()/60/60%60)>0;Ye.secs=("0"+Ye.secs).slice(-2),Ye.mins=("0"+Ye.mins).slice(-2),t.innerHTML=(n?Ye.hours+":":"")+Ye.mins+":"+Ye.secs}}function Ce(){if(Ye.supported.full){var e=de()||0;!Ye.duration&&S.displayDuration&&Ye.media.paused&&Ee(e,Ye.currentTime),Ye.duration&&Ee(e,Ye.duration),Ie()}}function Fe(e){Ee(Ye.media.currentTime,Ye.currentTime),e&&"timeupdate"===e.type&&Ye.media.seeking||Se(e)}function Ae(e){P.number(e)||(e=0);var t=de(),n=w(e,t);Ye.progress&&Ye.progress.played&&(Ye.progress.played.value=n),Ye.buttons&&Ye.buttons.seek&&(Ye.buttons.seek.value=n)}function Ie(e){var t=de();if(S.tooltips.seek&&Ye.progress.container&&0!==t){var n=Ye.progress.container.getBoundingClientRect(),r=0,s=S.classes.tooltip+"--visible";if(e)r=100/n.width*(e.pageX-n.left);else{if(!f(Ye.progress.tooltip,s))return;r=Ye.progress.tooltip.style.left.replace("%","")}0>r?r=0:r>100&&(r=100),Ee(t/100*r,Ye.progress.tooltip),Ye.progress.tooltip.style.left=r+"%",e&&a(["mouseenter","mouseleave"],e.type)&&m(Ye.progress.tooltip,s,"mouseenter"===e.type)}}function Ne(t){if(S.hideControls&&"audio"!==Ye.type){var n=0,r=!1,s=t,o=f(Ye.container,S.classes.loading);if(P["boolean"](t)||(t&&t.type?(r="enterfullscreen"===t.type,s=a(["mousemove","touchstart","mouseenter","focus"],t.type),a(["mousemove","touchmove"],t.type)&&(n=2e3),"focus"===t.type&&(n=3e3)):s=f(Ye.container,S.classes.hideControls)),e.clearTimeout(Be.hover),s||Ye.media.paused||o){if(m(Ye.container,S.classes.hideControls,!1),Ye.media.paused||o)return;Ye.browser.isTouch&&(n=3e3)}s&&Ye.media.paused||(Be.hover=e.setTimeout(function(){(!Ye.controls.pressed&&!Ye.controls.hover||r)&&m(Ye.container,S.classes.hideControls,!0)},n))}}function Pe(e){if(!P.undefined(e))return void Me(e);var t;switch(Ye.type){case"youtube":t=Ye.embed.getVideoUrl();break;case"vimeo":Ye.embed.getVideoUrl.then(function(e){t=e});break;case"soundcloud":Ye.embed.getCurrentSound(function(e){t=e.permalink_url});break;default:t=Ye.media.currentSrc}return t||""}function Me(e){function n(){if(Ye.embed=null,l(Ye.media),"video"===Ye.type&&Ye.videoContainer&&l(Ye.videoContainer),Ye.container&&Ye.container.removeAttribute("class"),"type"in e&&(Ye.type=e.type,"video"===Ye.type)){var n=e.sources[0];"type"in n&&a(S.types.embed,n.type)&&(Ye.type=n.type)}switch(Ye.supported=E(Ye.type),Ye.type){case"video":Ye.media=t.createElement("video");break;case"audio":Ye.media=t.createElement("audio");break;case"youtube":case"vimeo":case"soundcloud":Ye.media=t.createElement("div"),Ye.embedId=e.sources[0].src}u(Ye.container,Ye.media),P["boolean"](e.autoplay)&&(S.autoplay=e.autoplay),a(S.types.html5,Ye.type)&&(S.crossorigin&&Ye.media.setAttribute("crossorigin",""),S.autoplay&&Ye.media.setAttribute("autoplay",""),"poster"in e&&Ye.media.setAttribute("poster",e.poster),S.loop&&Ye.media.setAttribute("loop","")),m(Ye.container,S.classes.fullscreen.active,Ye.isFullscreen),m(Ye.container,S.classes.captions.active,Ye.captionsEnabled),$(),a(S.types.html5,Ye.type)&&U("source",e.sources),ee(),a(S.types.html5,Ye.type)&&("tracks"in e&&U("track",e.tracks),Ye.media.load()),(a(S.types.html5,Ye.type)||a(S.types.embed,Ye.type)&&!Ye.supported.full)&&(De(),He()),S.title=e.title,K()}return P.object(e)&&"sources"in e&&e.sources.length?(m(Ye.container,S.classes.ready,!1),ie(),Ae(),_e(),Ve(),void qe(n,!1)):void Je("Invalid source format")}function Le(e){"video"===Ye.type&&Ye.media.setAttribute("poster",e)}function Oe(){function n(){var e=le(),t=Ye.buttons[e?"play":"pause"],n=Ye.buttons[e?"pause":"play"];if(n=n&&n.length>1?n[n.length-1]:n[0]){var r=f(t,S.classes.tabFocus);setTimeout(function(){n.focus(),r&&(m(t,S.classes.tabFocus,!1),m(n,S.classes.tabFocus,!0))},100)}}function r(){var e=t.activeElement;return e=e&&e!==t.body?t.querySelector(":focus"):null}function s(e){return e.keyCode?e.keyCode:e.which}function o(e){for(var t in Ye.buttons){var n=Ye.buttons[t];if(P.nodeList(n))for(var r=0;r<n.length;r++)m(n[r],S.classes.tabFocus,n[r]===e);else m(n,S.classes.tabFocus,n===e)}}function i(e){function t(){var e=Ye.media.duration;P.number(e)&&pe(e/10*(n-48))}var n=s(e),r="keydown"===e.type,o=r&&n===u;if(P.number(n))if(r){var i=[48,49,50,51,52,53,54,56,57,32,75,38,40,77,39,37,70,67];switch(a(i,n)&&(e.preventDefault(),e.stopPropagation()),n){case 48:case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:o||t();break;case 32:case 75:o||le();break;case 38:he();break;case 40:ke();break;case 77:o||ve();break;case 39:ce();break;case 37:ue();break;case 70:be();break;case 67:o||xe()}!A.supportsFullScreen&&Ye.isFullscreen&&27===n&&be(),u=n}else u=null}var l=Ye.browser.isIE?"change":"input";if(S.keyboardShorcuts.focused){var u=null;S.keyboardShorcuts.global&&g(e,"keydown keyup",function(e){var t=s(e),n=r(),o=[48,49,50,51,52,53,54,56,57,75,77,70,67],l=F().length;1!==l||!a(o,t)||P.htmlElement(n)&&y(n,S.selectors.editable)||i(e)}),g(Ye.container,"keydown keyup",i)}g(e,"keyup",function(e){var t=s(e),n=r();9===t&&o(n)}),g(t.body,"click",function(){m(Y("."+S.classes.tabFocus),S.classes.tabFocus,!1)});for(var c in Ye.buttons){var p=Ye.buttons[c];g(p,"blur",function(){m(p,"tab-focus",!1)})}b(Ye.buttons.play,"click",S.listeners.play,n),b(Ye.buttons.pause,"click",S.listeners.pause,n),b(Ye.buttons.restart,"click",S.listeners.restart,pe),b(Ye.buttons.rewind,"click",S.listeners.rewind,ue),b(Ye.buttons.forward,"click",S.listeners.forward,ce),b(Ye.buttons.seek,l,S.listeners.seek,pe),b(Ye.volume.input,l,S.listeners.volume,function(){ge(Ye.volume.input.value)}),b(Ye.buttons.mute,"click",S.listeners.mute,ve),b(Ye.buttons.fullscreen,"click",S.listeners.fullscreen,be),A.supportsFullScreen&&g(t,A.fullScreenEventName,be),g(Ye.buttons.captions,"click",xe),g(Ye.progress.container,"mouseenter mouseleave mousemove",Ie),S.hideControls&&(g(Ye.container,"mouseenter mouseleave mousemove touchstart touchend touchcancel touchmove enterfullscreen",Ne),
g(Ye.controls,"mouseenter mouseleave",function(e){Ye.controls.hover="mouseenter"===e.type}),g(Ye.controls,"mousedown mouseup touchstart touchend touchcancel",function(e){Ye.controls.pressed=a(["mousedown","touchstart"],e.type)}),g(Ye.controls,"focus blur",Ne,!0)),g(Ye.volume.input,"wheel",function(e){e.preventDefault();var t=e.webkitDirectionInvertedFromDevice,n=S.volumeStep/5;(e.deltaY<0||e.deltaX>0)&&(t?ke(n):he(n)),(e.deltaY>0||e.deltaX<0)&&(t?he(n):ke(n))})}function je(){if(g(Ye.media,"timeupdate seeking",Fe),g(Ye.media,"timeupdate",D),g(Ye.media,"durationchange loadedmetadata",Ce),g(Ye.media,"ended",function(){"video"===Ye.type&&S.showPosterOnEnd&&("video"===Ye.type&&R(),pe(),Ye.media.load())}),g(Ye.media,"progress playing",Se),g(Ye.media,"volumechange",we),g(Ye.media,"play pause ended",me),g(Ye.media,"waiting canplay seeked",Te),S.clickToPlay&&"audio"!==Ye.type){var e=Y("."+S.classes.videoWrapper);if(!e)return;e.style.cursor="pointer",g(e,"click",function(){S.hideControls&&Ye.browser.isTouch&&!Ye.media.paused||(Ye.media.paused?oe():Ye.media.ended?(pe(),oe()):ie())})}S.disableContextMenu&&g(Ye.media,"contextmenu",function(e){e.preventDefault()}),g(Ye.media,S.events.concat(["keyup","keydown"]).join(" "),function(e){C(Ye.container,e.type,!0)})}function Ve(){if(a(S.types.html5,Ye.type)){for(var e=Ye.media.querySelectorAll("source"),t=0;t<e.length;t++)l(e[t]);Ye.media.setAttribute("src","https://cdn.selz.com/plyr/blank.mp4"),Ye.media.load(),Ue("Cancelled network requests")}}function qe(t,n){function r(){P["boolean"](n)||(n=!0),P["function"](t)&&t.call(Xe),n&&(Ye.init=!1,Ye.container.parentNode.replaceChild(Xe,Ye.container),C(Xe,"destroyed",!0))}if(!Ye.init)return null;switch(Ye.type){case"youtube":e.clearInterval(Be.buffering),e.clearInterval(Be.playing),Ye.embed.destroy(),r();break;case"vimeo":Ye.embed.unload().then(r),e.setTimeout(r,200);break;case"video":case"audio":G(!0),r()}}function Re(){if(Ye.init)return null;if(A=T(),Ye.browser=n(),P.htmlElement(Ye.media)){Q();var e=v.tagName.toLowerCase();"div"===e?(Ye.type=v.getAttribute("data-type"),Ye.embedId=v.getAttribute("data-video-id"),v.removeAttribute("data-type"),v.removeAttribute("data-video-id")):(Ye.type=e,S.crossorigin=null!==v.getAttribute("crossorigin"),S.autoplay=S.autoplay||null!==v.getAttribute("autoplay"),S.loop=S.loop||null!==v.getAttribute("loop")),Ye.supported=E(Ye.type),Ye.supported.basic&&(Ye.container=i(v,t.createElement("div")),Ye.container.setAttribute("tabindex",0),$(),Ue(""+Ye.browser.name+" "+Ye.browser.version),ee(),(a(S.types.html5,Ye.type)||a(S.types.embed,Ye.type)&&!Ye.supported.full)&&(De(),He(),K()),Ye.init=!0)}}function De(){if(!Ye.supported.full)return Je("Basic support only",Ye.type),l(Y(S.selectors.controls.wrapper)),l(Y(S.selectors.buttons.play)),void G(!0);var e=!W(S.selectors.controls.wrapper).length;e&&J(),z()&&(e&&Oe(),je(),G(),V(),q(),ge(),we(),Fe(),me())}function He(){e.setTimeout(function(){C(Ye.media,"ready")},0),m(Ye.media,N.classes.setup,!0),m(Ye.container,S.classes.ready,!0),Ye.media.plyr=We,S.autoplay&&oe()}var We,Ye=this,Be={};Ye.media=v;var Xe=v.cloneNode(!0),Ue=function(){L("log",arguments)},Je=function(){L("warn",arguments)};return Ue("Config",S),We={getOriginal:function(){return Xe},getContainer:function(){return Ye.container},getEmbed:function(){return Ye.embed},getMedia:function(){return Ye.media},getType:function(){return Ye.type},isReady:function(){return f(Ye.container,S.classes.ready)},isLoading:function(){return f(Ye.container,S.classes.loading)},on:function(e,t){g(Ye.container,e,t)},play:oe,pause:ie,stop:function(){ie(),pe()},restart:pe,rewind:ue,forward:ce,seek:pe,source:Pe,poster:Le,setVolume:ge,togglePlay:le,toggleMute:ve,toggleCaptions:xe,toggleFullscreen:be,toggleControls:Ne,isFullscreen:function(){return Ye.isFullscreen||!1},support:function(e){return r(Ye,e)},destroy:qe,getCurrentTime:function(){return v.currentTime}},Re(),Ye.init?We:null}function _(e,n){var r=new XMLHttpRequest;if(!P.string(n)||!P.htmlElement(t.querySelector("#"+n))){var s=t.createElement("div");s.setAttribute("hidden",""),P.string(n)&&s.setAttribute("id",n),t.body.insertBefore(s,t.body.childNodes[0]),"withCredentials"in r&&(r.open("GET",e,!0),r.onload=function(){s.innerHTML=r.responseText},r.send())}}function E(e){var r,s,a=n(),o=a.isIE&&a.version<=9,i=a.isIos,l=/iPhone|iPod/i.test(navigator.userAgent),u=!!t.createElement("audio").canPlayType,c=!!t.createElement("video").canPlayType;switch(e){case"video":r=c,s=r&&!o&&!l;break;case"audio":r=u,s=r&&!o;break;case"vimeo":case"youtube":case"soundcloud":r=!0,s=!o&&!i;break;default:r=u&&c,s=r&&!o}return{basic:r,full:s}}function C(e,n){function r(e,t){f(t,N.classes.hook)||s.push({target:e,media:t})}var s=[],a=[],o=[N.selectors.html5,N.selectors.embed].join(",");if(P.string(e)?e=t.querySelectorAll(e):P.htmlElement(e)?e=[e]:P.nodeList(e)||P.array(e)||P.string(e)||(P.undefined(n)&&P.object(e)&&(n=e),e=t.querySelectorAll(o)),P.nodeList(e)&&(e=Array.prototype.slice.call(e)),!E().basic||!e.length)return!1;for(var i=0;i<e.length;i++){var l=e[i],u=l.querySelectorAll(o);if(u.length)for(var c=0;c<u.length;c++)r(l,u[c]);else y(l,o)&&r(l,l)}return s.forEach(function(e){var t=e.target,r=e.media,s=!1;r===t&&(s=!0);var o={};try{o=JSON.parse(t.getAttribute("data-plyr"))}catch(i){}var l=x({},N,n,o);if(!l.enabled)return null;var u=new S(r,l);if(P.object(u)){if(l.debug){var c=l.events.concat(["setup","statechange","enterfullscreen","exitfullscreen","captionsenabled","captionsdisabled"]);g(u.getContainer(),c.join(" "),function(e){console.log([l.logPrefix,"event:",e.type].join(" "),e.detail.plyr)})}h(u.getContainer(),"setup",!0,{plyr:u}),a.push(u)}}),a}function F(e){if(P.string(e)?e=t.querySelector(e):P.undefined(e)&&(e=t.body),P.htmlElement(e)){var n=e.querySelectorAll("."+N.classes.setup),r=[];return Array.prototype.slice.call(n).forEach(function(e){P.object(e.plyr)&&r.push(e.plyr)}),r}return[]}var A,I={x:0,y:0},N={enabled:!0,debug:!1,autoplay:!1,loop:!1,seekTime:10,volume:10,volumeMin:0,volumeMax:10,volumeStep:1,duration:null,displayDuration:!0,loadSprite:!0,iconPrefix:"plyr",iconUrl:"https://cdn.plyr.io/2.0.5/plyr.svg",clickToPlay:!0,hideControls:!0,showPosterOnEnd:!1,disableContextMenu:!0,keyboardShorcuts:{focused:!0,global:!1},tooltips:{controls:!1,seek:!0},selectors:{html5:"video, audio",embed:"[data-type]",editable:"input, textarea, select, [contenteditable]",container:".plyr",controls:{container:null,wrapper:".plyr__controls"},labels:"[data-plyr]",buttons:{seek:'[data-plyr="seek"]',play:'[data-plyr="play"]',pause:'[data-plyr="pause"]',restart:'[data-plyr="restart"]',rewind:'[data-plyr="rewind"]',forward:'[data-plyr="fast-forward"]',mute:'[data-plyr="mute"]',captions:'[data-plyr="captions"]',fullscreen:'[data-plyr="fullscreen"]'},volume:{input:'[data-plyr="volume"]',display:".plyr__volume--display"},progress:{container:".plyr__progress",buffer:".plyr__progress--buffer",played:".plyr__progress--played"},captions:".plyr__captions",currentTime:".plyr__time--current",duration:".plyr__time--duration"},classes:{setup:"plyr--setup",ready:"plyr--ready",videoWrapper:"plyr__video-wrapper",embedWrapper:"plyr__video-embed",type:"plyr--{0}",stopped:"plyr--stopped",playing:"plyr--playing",muted:"plyr--muted",loading:"plyr--loading",hover:"plyr--hover",tooltip:"plyr__tooltip",hidden:"plyr__sr-only",hideControls:"plyr--hide-controls",isIos:"plyr--is-ios",isTouch:"plyr--is-touch",captions:{enabled:"plyr--captions-enabled",active:"plyr--captions-active"},fullscreen:{enabled:"plyr--fullscreen-enabled",active:"plyr--fullscreen-active"},tabFocus:"tab-focus"},captions:{defaultActive:!1},fullscreen:{enabled:!0,fallback:!0,allowAudio:!1},storage:{enabled:!0,key:"plyr"},controls:["play-large","play","progress","current-time","mute","volume","captions","fullscreen"],i18n:{restart:"Restart",rewind:"Rewind {seektime} secs",play:"Play",pause:"Pause",forward:"Forward {seektime} secs",played:"played",buffered:"buffered",currentTime:"Current time",duration:"Duration",volume:"Volume",toggleMute:"Toggle Mute",toggleCaptions:"Toggle Captions",toggleFullscreen:"Toggle Fullscreen",frameTitle:"Player for {title}"},types:{embed:["youtube","vimeo","soundcloud"],html5:["video","audio"]},urls:{vimeo:{api:"https://player.vimeo.com/api/player.js"},youtube:{api:"https://www.youtube.com/iframe_api"},soundcloud:{api:"https://w.soundcloud.com/player/api.js"}},listeners:{seek:null,play:null,pause:null,restart:null,rewind:null,forward:null,mute:null,volume:null,captions:null,fullscreen:null},events:["ready","ended","progress","stalled","playing","waiting","canplay","canplaythrough","loadstart","loadeddata","loadedmetadata","timeupdate","volumechange","play","pause","error","seeking","emptied"],logPrefix:"[Plyr]"},P={object:function(e){return null!==e&&"object"==typeof e},array:function(e){return null!==e&&"object"==typeof e&&e.constructor===Array},number:function(e){return null!==e&&("number"==typeof e&&!isNaN(e-0)||"object"==typeof e&&e.constructor===Number)},string:function(e){return null!==e&&("string"==typeof e||"object"==typeof e&&e.constructor===String)},"boolean":function(e){return null!==e&&"boolean"==typeof e},nodeList:function(e){return null!==e&&e instanceof NodeList},htmlElement:function(e){return null!==e&&e instanceof HTMLElement},"function":function(e){return null!==e&&"function"==typeof e},undefined:function(e){return null!==e&&"undefined"==typeof e}},M={supported:function(){if(!("localStorage"in e))return!1;try{e.localStorage.setItem("___test","OK");var t=e.localStorage.getItem("___test");return e.localStorage.removeItem("___test"),"OK"===t}catch(n){return!1}return!1}()};return{setup:C,supported:E,loadSprite:_,get:F}}),function(){function e(e,t){t=t||{bubbles:!1,cancelable:!1,detail:void 0};var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,t.bubbles,t.cancelable,t.detail),n}"function"!=typeof window.CustomEvent&&(e.prototype=window.Event.prototype,window.CustomEvent=e)}();
/*! layer mobile-v2.0 弹层组件移动版 License LGPL http://layer.layui.com/mobile By 贤心 */
;!function(a){"use strict";var b=document,c="querySelectorAll",d="getElementsByClassName",e=function(a){return b[c](a)},f={type:0,shade:!0,shadeClose:!0,fixed:!0,anim:"scale"},g={extend:function(a){var b=JSON.parse(JSON.stringify(f));for(var c in a)b[c]=a[c];return b},timer:{},end:{}};g.touch=function(a,b){a.addEventListener("click",function(a){b.call(this,a)},!1)};var h=0,i=["layui-m-layer"],j=function(a){var b=this;b.config=g.extend(a),b.view()};j.prototype.view=function(){var a=this,c=a.config,f=b.createElement("div");a.id=f.id=i[0]+h,f.setAttribute("class",i[0]+" "+i[0]+(c.type||0)),f.setAttribute("index",h);var g=function(){var a="object"==typeof c.title;return c.title?'<h3 style="'+(a?c.title[1]:"")+'">'+(a?c.title[0]:c.title)+"</h3>":""}(),j=function(){"string"==typeof c.btn&&(c.btn=[c.btn]);var a,b=(c.btn||[]).length;return 0!==b&&c.btn?(a='<span yes type="1">'+c.btn[0]+"</span>",2===b&&(a='<span no type="0">'+c.btn[1]+"</span>"+a),'<div class="layui-m-layerbtn">'+a+"</div>"):""}();if(c.fixed||(c.top=c.hasOwnProperty("top")?c.top:100,c.style=c.style||"",c.style+=" top:"+(b.body.scrollTop+c.top)+"px"),2===c.type&&(c.content='<i></i><i class="layui-m-layerload"></i><i></i><p>'+(c.content||"")+"</p>"),c.skin&&(c.anim="up"),"msg"===c.skin&&(c.shade=!1),f.innerHTML=(c.shade?"<div "+("string"==typeof c.shade?'style="'+c.shade+'"':"")+' class="layui-m-layershade"></div>':"")+'<div class="layui-m-layermain" '+(c.fixed?"":'style="position:static;"')+'><div class="layui-m-layersection"><div class="layui-m-layerchild '+(c.skin?"layui-m-layer-"+c.skin+" ":"")+(c.className?c.className:"")+" "+(c.anim?"layui-m-anim-"+c.anim:"")+'" '+(c.style?'style="'+c.style+'"':"")+">"+g+'<div class="layui-m-layercont">'+c.content+"</div>"+j+"</div></div></div>",!c.type||2===c.type){var k=b[d](i[0]+c.type),l=k.length;l>=1&&layer.close(k[0].getAttribute("index"))}document.body.appendChild(f);var m=a.elem=e("#"+a.id)[0];c.success&&c.success(m),a.index=h++,a.action(c,m)},j.prototype.action=function(a,b){var c=this;a.time&&(g.timer[c.index]=setTimeout(function(){layer.close(c.index)},1e3*a.time));var e=function(){var b=this.getAttribute("type");0==b?(a.no&&a.no(),layer.close(c.index)):a.yes?a.yes(c.index):layer.close(c.index)};if(a.btn)for(var f=b[d]("layui-m-layerbtn")[0].children,h=f.length,i=0;h>i;i++)g.touch(f[i],e);if(a.shade&&a.shadeClose){var j=b[d]("layui-m-layershade")[0];g.touch(j,function(){layer.close(c.index,a.end)})}a.end&&(g.end[c.index]=a.end)},a.layer={v:"2.0",index:h,open:function(a){var b=new j(a||{});return b.index},close:function(a){var c=e("#"+i[0]+a)[0];c&&(c.innerHTML="",b.body.removeChild(c),clearTimeout(g.timer[a]),delete g.timer[a],"function"==typeof g.end[a]&&g.end[a](),delete g.end[a])},closeAll:function(){for(var a=b[d](i[0]),c=0,e=a.length;e>c;c++)layer.close(0|a[0].getAttribute("index"))}},"function"==typeof define?define(function(){return layer}):function(){var a=document.scripts,c=a[a.length-1],d=c.src,e=d.substring(0,d.lastIndexOf("/")+1);c.getAttribute("merge")||document.head.appendChild(function(){var a=b.createElement("link");return a.href=e+"need/layer.css?2.0",a.type="text/css",a.rel="styleSheet",a.id="layermcss",a}())}()}(window);
/**
 * that's app
 * Joseph Miao
 * 20160829 v1.0
 */


/** 向zepto添加jquery中nextALL()/prevAll()方法 **/
;(function($){
var e = {
    nextAll: function(s) {
        var $els = $(), $el = this.next()
        while( $el.length ) {
            if(typeof s === 'undefined' || $el.is(s)) $els = $els.add($el)
            $el = $el.next()
        }
        return $els
    },
    prevAll: function(s) {
        var $els = $(), $el = this.prev()
        while( $el.length ) {
            if(typeof s === 'undefined' || $el.is(s)) $els = $els.add($el)
            $el = $el.prev()
        }
        return $els
    }
}
$.extend( $.fn, e )
})(Zepto);

/*
 * Zepto picLazyLoad Plugin
 * origin: http://ons.me/484.html
 * 20140517 
 */
;(function($){
    $.fn.picLazyLoad = function(settings){
        var $this = $(this),
            _winScrollTop = 0,
            _winHeight = $(window).height();

        settings = $.extend({
            threshold: 0, 
            placeholder: 'data:image/png;base64,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'
        }, settings||{});

        lazyLoadPic();

        $(window).on('scroll',function(){
            _winScrollTop = $(window).scrollTop();
            lazyLoadPic();
        });

        function lazyLoadPic(){
            $this.each(function(){
                var $self = $(this);
                if($self.is('img')){
                    if($self.attr('data-original')){
                        var _offsetTop = $self.offset().top;
                        if((_offsetTop - settings.threshold) <= (_winHeight + _winScrollTop)){
                            $self.attr('src',$self.attr('data-original'));
                            $self.removeAttr('data-original');
                        }
                    }
                }else{
                    if($self.attr('data-original')){
                        if($self.css('background-image') == 'none'){
                            $self.css('background-image','url('+settings.placeholder+')');
                        }
                        var _offsetTop = $self.offset().top;
                        if((_offsetTop - settings.threshold) <= (_winHeight + _winScrollTop)){
                            $self.css('background-image','url('+$self.attr('data-original')+')');
                            $self.removeAttr('data-original');
                        }
                    }
                }
            });
        }
    }
})(Zepto);

/**** apph5 ****/

/** 抽取数字 **/
function getNum(text){  //不考虑小数点，只匹配字符前的数字如 13％==>13   12.35==>12
    // i是表示区分大小写，g是全局模式如果不区分东西写
    var value = parseInt(text.replace(/[^0-9]/ig,"")); 
    // var value = parseInt(text.replace(/[]/ig,"")); 
    return value;
}
console.info(getNum("12.35"));
console.info(getNum("1!2%35"));
// 带替换参数
function getNum(text, replaced_c){
    // i是表示区分大小写，g是全局模式如果不区分东西写
    var value = parseInt(text.replace(/[^0-9]/ig,replaced_c)); 
    return value;
}

/** js控制页面字体大小 **/

function maginifyFontSize(){
    var root_size = $("html").css("font-size");

    if(getNum(root_size) >= 86){
        return;
    }
    var counter = 8; //每次放大百分比

    //判断font-size返回的是62.5%（百分比）还是10px(具体值)
    if(root_size.indexOf("px") > 0){ 
        var root_size_percent = getNum(root_size)*100/16;  //转换成百分比
        var percent = root_size_percent + counter;

    }else if(root_size.indexOf("%") > 0){
        //每次点击 字体增大的百分比
        var percent = getNum(root_size) + counter;
    }
    var changeSize = percent + "%";    
    $("html").css("font-size",changeSize);
    
}
function minifyFontSize(){
    var root_size = $("html").css("font-size");
    console.log(getNum(root_size));
    
    var counter = 8; //每次缩小百分比

    if(root_size.indexOf("px") > 0){ 
        var root_size_percent = getNum(root_size)*100/16;  //转换成百分比
        var percent = root_size_percent - counter;

    }else if(root_size.indexOf("%") > 0){
        if(getNum(root_size) <= 42) return;
        //每次点击 字体缩小的百分比
        var percent = getNum(root_size) - counter;
    }
    var changeSize = percent + "%";    
    $("html").css("font-size",changeSize);

}

/** 改变行间距 **/
// 暂时就处理一次
function widenLine(){

    // 默认第一次获取的line-height为px值
    var line_height = $("body").css("line-height");
    console.log(line_height)
    if(line_height.indexOf("px") > 0){  //说明是第一次点击
        $("body").css("line-height","1.8");
    }else {
        if(line_height == "1.2"){
            $("body").css("line-height","1.5")
        }
        if(line_height >= "1.5"){
            $("body").css("line-height", "1.8")
        }
    } 
}

function narrowLine(){
    // 默认第一次获取的line-height为px值
    var line_height = $("body").css("line-height");
    console.log(line_height)
    if(line_height.indexOf("px") > 0){  //说明是第一次点击
        $("body").css("line-height","1.2");
    }else {
        if(line_height == "1.8"){
            $("body").css("line-height","1.5")
        }
        if(line_height <= "1.5"){
            $("body").css("line-height", "1.2")
        }
    } 
}

/* slider轮播生成小圆点 */
function generateDots(){
    var imgs_len = $(".swipe-wrap").find("img").length;
    $(".swipe").append("<ul class='dots'></ul>")
    for(var i = 0; i < imgs_len; i++){
        $(".dots").append("<li></li>")
    }

}
/* 当前轮播图小圆点改样式 */
function getCurrentDot(index){
    //初始化高亮小圆点位置
    if(typeof(index) === "undefined" && !$(".dots > li:first-child").hasClass("active")){
        $(".dots > li:first-child").addClass("active");
    }else {
        $(".dots > li.active").removeClass("active");
        $(".dots").find("li:nth-child("+(index+1)+")").addClass("active");
    }

}



generateDots();
getCurrentDot();

