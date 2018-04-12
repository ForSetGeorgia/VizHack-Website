(function() {
  /* variables */
    var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    var logo = null
    var loader_bg1 = null
    var loader_bg2 = null
    var loader_bg3 = null
    var loader_bg4 = null
    var slices = {
      imgs: [],
      count: 4,
      widths: [],
      heights: [],
      offset: []
    }
    var assets = {
      counter: 2,
      ready: false,
      preload: function () {
        loader_bg3 = new Image()
        loader_bg3.onload = assets.tick
        loader_bg3.src = 'assets/images/loader_bg3.png'

        loader_bg4 = new Image()
        loader_bg4.onload = assets.tick
        loader_bg4.src = 'assets/images/loader_bg4.png'

        for(var i = 1; i <= slices.count; ++i) {
          var img = new Image()
          ++assets.counter
          img.onload = assets.tick
          img.src = 'assets/images/slices/slice_' + i + '.png'
          slices.imgs.push(img)
        }
      },
      tick: function () {
        if(--assets.counter == 0) {
          assets.ready = true
        }
      }

    }
    var glitch = {
        timing: 0,
        duration: 2.24,
        count: 7,
        currentTiming: 0,
        map: [ // id, time ratio
          [1,1],
          [2,1],
          [3,1],
          [4,1],
          [5,1],
          ['logo',16], // 8
          [6,1],
          ['logo',2],
          [7,1],
          ['logo',7],
        ],
        imgs: [],
        index: 0
      }

    var w = 0
    var h = 0
    var wM = 1 // widthMultiplier
    var wH = 1 // heightMultiplier
    var center = [0,0]
    var preloadCounter = 3
    var startTime
    var drawStack = []
    var scene = []
    var sceneResizes
    var nextSceneIndex = 0
    var jumpToNextScene = false
    var screen = device.default
  /* helpers */

    function n() {
      return Date.now()
    }
    function dw(v) {
      return function () {
        return Math.min(v, Math.round(v*wM))
      }
    }
    function dh(v) {
      return function () {
        return Math.min(v, Math.round(v*hM))
      }
    }
    function dH() {
      return function () {
        return h
      }
    }
    function dW() {
      return function () {
        return w
      }
    }
    function hasClass(el, className) {
      if (el.classList)
        return el.classList.contains(className)
      else
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
    }

    function addClass(el, className) {
      if (el.classList)
        el.classList.add(className)
      else if (!hasClass(el, className)) el.className += " " + className
    }

    function removeClass(el, className) {
      if (el.classList)
        el.classList.remove(className)
      else if (hasClass(el, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
        el.className=el.className.replace(reg, ' ')
      }
    }
    function easeInQuad(t) { return t*t }
    // function fade(element) {
    //     var op = 1;  // initial opacity
    //     var timer = setInterval(function () {
    //         if (op <= 0.1){
    //             clearInterval(timer);
    //             element.style.display = 'none';
    //         }
    //         element.style.opacity = op;
    //         element.style.filter = 'alpha(opacity=' + op * 100 + ")";
    //         op -= op * 0.1;
    //     }, 50);
    // }
    // function fadeIn(element, timing) {
    //   var op = 0;  // initial opacity
    //   element.style.display = 'block';
    //   var timer = setInterval(function () {
    //       if (op >= 1){
    //           clearInterval(timer);
    //       }
    //       element.style.opacity = op;
    //       element.style.filter = 'alpha(opacity=' + op * 100 + ")";
    //       op += op * 0.1;
    //   }, timing);
    // }
    // function easeInCubic(t) { return t*t*t }

  /* binds */
    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
      w = window.innerWidth
      h = window.innerHeight

      var sizes = [2565, 1140]
      if(!screen.desktop()) {
        sizes = screen.orientation === 'landscape' ? [2023, 1140] : [1140, 2023]
      }

      wM = w / sizes[0]
      hM = h / sizes[1]
      // 1.775

      center = [w/2, h/2]
      canvas.width = w
      canvas.height = h

      if(typeof sceneResize === 'function') {
        sceneResize()
      }
      // draw();
    }

  /* preload */

    function preloadCounterTick() {
      if(--preloadCounter == 0) {
        init()
      }
    }

    function preload() {
      logo = new Image()
      logo.onload = preloadCounterTick
      logo.src = 'assets/images/logo.png'

      loader_bg1 = new Image()
      loader_bg1.onload = preloadCounterTick
      loader_bg1.src = 'assets/images/loader_bg1.png'

      loader_bg2 = new Image()
      loader_bg2.onload = preloadCounterTick
      loader_bg2.src = 'assets/images/loader_bg2.png'

      for(var i = 1; i <= glitch.count; ++i) {
        var img = new Image()
        ++preloadCounter
        img.onload = preloadCounterTick
        img.src = 'assets/images/glitch/glitch_' + i + '.png'
        glitch.imgs.push(img)
      }
    }

  /* drawing methods */

    var drawings = {
      glitch: function(start) {
        var currentScene = glitch.map[glitch.index]
        var img = currentScene[0] == 'logo' ? logo : glitch.imgs[currentScene[0]-1]

        var imgWidth = img.width*wM
        var imgHeight = img.height*wM

        ctx.drawImage(img, center[0]- imgWidth/2, center[1] - imgHeight/2, imgWidth, imgHeight);
        var timing = glitch.timing

        if(n() > start + glitch.currentTiming*timing*1000 + currentScene[1]*timing*1000) {
          glitch.currentTiming += currentScene[1]

          if(glitch.index < glitch.map.length - 1) {
            ++glitch.index
            return true
          }
          else {
            return true
          }
        }
        return true
      },
      bg: function(start, opts) {
        var img = opts.img
        var imgWidth = img.width*wM
        var imgHeight = img.height*wM
        ctx.save()
        var tm = n() - start
        ratio = tm > opts.timing ? 1 : tm/opts.timing
        ctx.globalAlpha = ratio
        ctx.drawImage(img, center[0]- imgWidth/2 - opts.offset.x*wM, center[1] - imgHeight/2 + opts.offset.y*wM, imgWidth, imgHeight);
        ctx.restore()

        // console.log(ratio)
        // ctx.save()
        // ctx.restore

        return true
      },
      bg2: function(start, opts) {
        var img = opts.img
        var imgWidth = img.width*wM
        var imgHeight = img.height*wM
        ctx.save()
        ctx.globalCompositeOperation = 'destination-over';
        var tm = n() - start
        ratio = tm > opts.timing ? 1 : tm/opts.timing
        ctx.globalAlpha = ratio
        ctx.drawImage(img, opts.x*wM, opts.y*hM, imgWidth, imgHeight);
        ctx.restore()

        // console.log(ratio)
        // ctx.save()
        // ctx.restore

        return true
      },
      line: function(start, opts) {
        if(opts.onlyDesktop && !screen.desktop()) { return true }
        var tm = n() - start

        ratio = tm > opts.timing ? 1 : tm/opts.timing

        ctx.beginPath();
        ctx.moveTo(opts.x1() ,opts.y1());
        ctx.lineTo(opts.x2(ratio), opts.y2(ratio));
        ctx.strokeStyle = 'rgb(255,145,129)'
        ctx.stroke();

        if(ratio === 1) {
          ctx.beginPath()
          ctx.arc(opts.x2(1), opts.y2(1), 3, 0, Math.PI * 2, true)
          ctx.fillStyle = 'rgb(255,145,129)'
          ctx.fill()
        }

        return true
      },
      rect: function(start, opts) {
        if(opts.onlyDesktop && !screen.desktop()) { return true }
        // console.log(opts)
        var tm = n() - start

        ratio = easeInQuad(tm > opts.timing ? 1 : tm/opts.timing)
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(235, 21, 0, .65)'
        ctx.fillRect(opts.x(ratio), opts.y(ratio), opts.w(ratio), opts.h(ratio));

        // if(ratio === 1 && opts.hasOwnProperty('end') && typeof opts.end === 'function') {
        //   opts.end()
        // }
      },
      slice: function(start, opts) {
        if(opts.onlyDesktop && !screen.desktop()) { return true }

        var sliceIndex = opts.index-1

        // console.log(start)
        var tm = n() - start
        var ratio = tm > opts.timing ? 1 : tm/opts.timing

        ctx.drawImage(slices.imgs[sliceIndex], w-slices.offset[sliceIndex], h-h*ratio, slices.widths[sliceIndex], slices.heights[sliceIndex]);

        return true
      },
      circle: function(start, opts) {
        // if(opts.onlyDesktop && !screen.desktop()) { return true }
        // var tm = n() - start
        // var ratio = tm > opts.timing ? 1 : tm/opts.timing

        // ctx.beginPath()
        // ctx.arc(opts.x(), opts.y(), opts.radius*ratio, 0, Math.PI * 2, true)
        // ctx.fillStyle = 'rgb(254,183,79)'
        // ctx.fill()
      },
      end: function(start, opts) {
        jumpToNextScene = true
      },
      fadeIn: function(start, opts) {
        var element = opts.element
        // console.log(element)

        var tm = n() - start
        var op = tm > opts.timing ? 1 : tm/opts.timing

        // element.style.display = 'block';
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";

      },
      css: function(start, opts) {
        var element = opts.element
        addClass(element, 'animation')
        console.log('called')
        return function () {}
      },
      year_line: function(start, opts) {
        if(opts.onlyDesktop && !screen.desktop()) { return true }

        var number = opts.number
        var tm = n() - start

        ratio = tm > opts.timing ? 1 : tm/opts.timing


        ctx.save()

        ctx.font = Math.floor(24*hM) + 'rem OswaldBold';
        ctx.textBaseline = 'top';
        var textMeasure = ctx.measureText(number);
        var textWidth = textMeasure.width


        ctx.globalCompositeOperation = 'overlay';

        ctx.beginPath();
        ctx.moveTo(opts.x1(ratio)+textWidth*.6 ,opts.y1(ratio));
        ctx.lineTo(opts.x2(ratio)+textWidth*.6, opts.y2(ratio));
        ctx.strokeStyle = 'rgba(255,255,255,1)'
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(opts.x1(ratio)+textWidth*.6 ,opts.y1(ratio));
        ctx.lineTo(opts.x2(ratio)+textWidth*.6, opts.y2(ratio));
        ctx.strokeStyle = 'rgba(255,255,255,1)'
        ctx.stroke();

        ctx.restore()
        return true
      },
      year_number: function(start, opts) {
        // ctx.restore()
        var number = opts.number

        ctx.save()

        ctx.font = Math.floor(24*hM) + 'rem OswaldBold';
        ctx.textBaseline = 'top';
        var textMeasure = ctx.measureText(number);
        var textWidth = textMeasure.width

        // console.log(textMeasure, textWidth)
        // console.log(textWidth)
        ctx.globalCompositeOperation = 'overlay';
         ctx.beginPath();
        // console.log(number, opts.x)
        ctx.rect(dW()() - opts.offset*wM, 0, textWidth*0.6, dH()());
        // ctx.stroke();
        ctx.clip();


        var tm = n() - start
        var ratio = tm > opts.timing ? 1 : tm/opts.timing
        ctx.fillStyle = 'rgba(255,255,255,1)'
        ctx.fillText(number, dW()() - opts.offset*wM + (textWidth*(1-ratio)), dH()() - 262*hM + 5); //30-30*ratio
        ctx.fillText(number, dW()() - opts.offset*wM + (textWidth*(1-ratio)), dH()() - 262*hM + 5); //30-30*ratio

        ctx.restore()

        return true
      }
    }

  /* scene */

    function nextScene() {
      var sceneInits = [
        function() {
          var timingCount = 0
          glitch.map.forEach(function(d) {
            timingCount += d[1]
          })
          glitch.timing = glitch.duration / timingCount
        },
        function() {

        }
      ]
      var sceneResizes = [
        function() {},
        function() {

          // slices data calculation
          var imgWidths = []
          var imgHeights = []

          var imgWidthBefore = 0
          var imgWidthsBefore = []

          slices.imgs.forEach(function(img, i) {
            imgHeights[i] = Math.round(img.height*h/1080)
            var imgRatio = (img.height*h/1080) / img.height
            imgWidths[i] = Math.round(img.width*imgRatio)
          })
          imgWidths.slice().reverse().forEach(function(imgWidth){
            imgWidthBefore += imgWidth
            imgWidthsBefore.push(imgWidthBefore)

          })

          slices.widths = imgWidths
          slices.heights = imgHeights
          slices.offset = imgWidthsBefore.reverse()

          // number data calculation



        },
      ]
      var scenes = [
        [
          delayCheck(2000, drawings.glitch),
          delayCheck(2200, drawings.line, {
            timing: 800, // 400
            x1: function() {return 0},
            y1: function () {
              return dh(115)()
            },
            x2: function (ratio) {
              return ratio * dw(290)()
            },
            y2: function (ratio) {
              return dh(115)()
            },
            onlyDesktop: true,
          }),
          delayCheck(1800, drawings.line, {
            timing: 800, // 600
            x1: dW(),
            y1: function () {
              return h - dh(420)()
            },
            x2: function (ratio) {
              return w - ratio * dw(450)()
            },
            y2: function (ratio) {
              return h - dh(420)()
            },
            onlyDesktop: true,
          }),
          delayCheck(1400, drawings.line, {
            timing: 600, // 400
            x1: dw(240),
            y1: dH(),
            x2: dw(240),
            y2: function (ratio) {
              return h - ratio * dh(320)()
            },
            onlyDesktop: true,
          }),
          delayCheck(1600, drawings.line, {
            timing: 800, // 600
            x1: dw(140),
            y1: dH(),
            x2: dw(140),
            y2: function (ratio) {
              return h - ratio * dh(500)()
            },
            onlyDesktop: true,
          }),
          delayCheck(2000, drawings.rect, {
            timing: 600,
            x: function() {return w - dw(32)() - dw(135)() },
            y: function() {return 0},
            w: dw(32),
            h: function (ratio) {
              return ratio * dh(315)()
            },
            onlyDesktop: true,
          }),
          delayCheck(1400, drawings.bg, { timing: 400, img: loader_bg1, offset: {x: 130, y: 130 }}),
          delayCheck(1600, drawings.bg, { timing: 400, img: loader_bg2, offset: { x: -290, y: -360 }}),

          delayCheck(6000, drawings.rect, {
            // end: function () {
            //   jumpToNextScene = true
            // },
            timing: 1000,
            x: function() {return w - dw(32)() - dw(135)() },
            y: function() {return dh(315)()},
            w: dw(32),
            h: function (ratio) {
              return ratio * (dH()()-dh(315)())
            },
            onlyDesktop: true,
          }),
          delayCheck(7000, drawings.end, {})

          // delayCheck(0, drawings.rect, {
          //   end: function () {
          //     jumpToNextScene = true
          //   },
          //   timing: 1000,
          //   x: function() {return w - dw(32)() - dw(135)() },
          //   y: function() {return 0},
          //   w: dw(32),
          //   h: function (ratio) {
          //     return ratio * (dH()())
          //   },
          //   onlyDesktop: true,
          // }),
        ],
        [

          delayCheck(0, drawings.rect, {
            timing: 1000,
            x: function(ratio) {
              var t = dw(564)() - (dw(32)() + dw(135)())
              return w - dw(32)() - dw(135)() - t*ratio
            },
            y: function() {return 0},
            w: function (ratio) {
              var t = dw(564)() - (dw(32)() + dw(135)())
              return dw(32)() + ratio * dw(135)() + t * ratio
            },
            h: dH(),
            onlyDesktop: true,
          }),
          delayCheck(1000, drawings.rect, {
            timing: 1000,
            x: function(ratio) {
              return w - dw(564)() - dw(312)() * ratio
            },
            y: function() {return dH()() - dh(521)()},
            w: function (ratio) {
              return dw(312)()  * ratio
            },
            h: dh(521),
            onlyDesktop: true,
          }),
/*
          delayCheck(0, drawings.circle, { timing: 600, radius: 216, x: dw(80), y: dh(80), onlyDesktop: true, }),*/
          delayCheck(100, drawings.slice, { timing: 600, index: 1, onlyDesktop: true, }),
          delayCheck(300, drawings.slice, { timing: 200, index: 2, onlyDesktop: true, }),
          delayCheck(100, drawings.slice, { timing: 600, index: 3, onlyDesktop: true, }),
          delayCheck(200, drawings.slice, { timing: 400, index: 4, onlyDesktop: true, }),


          delayCheck(100, drawings.year_line, { timing: 400, onlyDesktop: true,
            number: '1',
            x1: function(ratio) {return dW()()-dw(540)()},
            y1: function () {
              return dH()()-dh(320)()
            },
            x2: function (ratio) { return dW()()-dw(540)() },
            y2: function (ratio) {
              return dH()()- dh(320)() + dh(320)()*(ratio)
            },
          }),
          delayCheck(300, drawings.year_line, { timing: 400, onlyDesktop: true,
            number: '9',
            x1: function(ratio) {return dW()()-dw(420)()},
            y1: function () {
              return dH()()-dh(320)()
            },
            x2: function (ratio) { return dW()()-dw(420)() },
            y2: function (ratio) {
              return dH()()- dh(320)() + dh(320)()*(ratio)
            },
          }),
          delayCheck(500, drawings.year_line, { timing: 400, onlyDesktop: true,
            number: '1',
            x1: function(ratio) {return dW()()-dw(300)()},
            y1: function () {
              return dH()()-dh(320)()
            },
            x2: function (ratio) { return dW()()-dw(300)() },
            y2: function (ratio) {
              return dH()()- dh(320)() + dh(320)()*(ratio)
            },
          }),
          delayCheck(700, drawings.year_line, { timing: 400, onlyDesktop: true,
            number: '8',
            x1: function(ratio) {return dW()()-dw(180)()},
            y1: function () {
              return dH()()-dh(320)()
            },
            x2: function (ratio) { return dW()()-dw(180)() },
            y2: function (ratio) {
              return dH()()- dh(320)() + dh(320)()*(ratio)
            },
          }),
          // delayCheck(200, drawings.year_line, { timing: 1000, onlyDesktop: true, x: 1550, }),
          // delayCheck(300, drawings.year_line, { timing: 1000, onlyDesktop: true, x: 1650, }),
          // delayCheck(400, drawings.year_line, { timing: 1000, onlyDesktop: true, x: 1750, }),

          delayCheck(200, drawings.year_number, { timing: 500, number: '1', onlyDesktop: true, offset: 540, }),
          delayCheck(400, drawings.year_number, { timing: 500, number: '9', onlyDesktop: true, offset: 420, }),
          delayCheck(500, drawings.year_number, { timing: 500, number: '1', onlyDesktop: true, offset: 300, }),
          delayCheck(800, drawings.year_number, { timing: 500, number: '8', onlyDesktop: true, offset: 180, }),

          delayCheck(400, drawings.bg2, { timing: 400, img: loader_bg3, x: 1420, y: -45 }),
          delayCheck(400, drawings.bg2, { timing: 400, img: loader_bg4, x: 1320, y: 920 }),
          // delayCheck(1600, drawings.bg, { timing: 400, img: loader_bg4, offset: { x: -290, y: -360 }}),



          delayCheck(100, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="1"]'), }),
          delayCheck(400, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="2"]'), }),
          delayCheck(700, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="3"]'), }),
          delayCheck(1000, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="4"]'), }),
          delayCheck(1300, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="5"]'), }),
          delayCheck(1600, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="6"]'), }),
          delayCheck(1600, drawings.fadeIn, { timing: 1000, element: document.querySelector('[data-fade-in-id="7"]'), }),
          delayCheck(200, drawings.css, { timing: 1000, element: document.querySelector('[data-hline-id="1"]'), }),
          delayCheck(200, drawings.css, { timing: 1000, element: document.querySelector('[data-hline-id="2"]'), }),
          delayCheck(200, drawings.css, { timing: 1000, element: document.querySelector('[data-vline-id="1"]'), }),
        ]
      ]

      if(sceneInits.length !== scenes.length) {
        throw 'Scene array and scene initialization array length should match'
      }

      if(nextSceneIndex < scenes.length) {
        sceneInits[nextSceneIndex]()
        sceneResize = sceneResizes[nextSceneIndex]
        sceneResize()
        startTime = Date.now()
        return scenes[nextSceneIndex++]
      }
      return null
    }

  /* draw */

    function delayCheck(delay, callback, options) {
      if(typeof options === 'undefined') { options = {} }
      return function () {
        var nw = n()
        if(nw > startTime + delay) {
          // console.log(options)
          return function () { return callback(nw, options) }
        }
        return true
      }
    }

    function draw() {
      // ctx.restore()// clear canvas
      ctx.clearRect(0, 0, w, h);
      if(jumpToNextScene) {
        scene = nextScene()
        if(scene === null) { return }
        jumpToNextScene = false
      }

      scene.forEach(function (d, i){
        if(typeof d === 'function') {
          var res = d()
          if(typeof res === 'function') {
            // console.log(res)
            scene[i] = res
            res()
          }
        }
      })
      window.requestAnimationFrame(draw);
    }

  /* init */

    function init() {
      resizeCanvas();

      ctx.globalCompositeOperation = 'destination-over';
      // ctx.save()

      scene = nextScene()

      window.requestAnimationFrame(draw);

      assets.preload()
    }




  preload();
})();
