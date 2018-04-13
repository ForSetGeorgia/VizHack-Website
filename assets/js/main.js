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
      offset: [],
      redboxWidth: 0,
      yearWidth: 0,
      yearPosition: [],
      yearFontSize: [],
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
    var isLastScene = false
    var screen = device.default
  /* helpers */

    function n() {
      return Date.now()
    }
    function dw(v) {
      return Math.min(v, Math.round(v*wM))
    }
    function fdw(v) {
      return function () {
        return Math.min(v, Math.round(v*wM))
      }
    }
    function dh(v) {
      return Math.min(v, Math.round(v*hM))
    }
    function fdh(v) {
      return function () {
        return Math.min(v, Math.round(v*hM))
      }
    }
    function dH() {
      return h
    }
    // function fdH() {
    //   return function () {
    //     return h
    //   }
    // }
    function dW() {
      return w
    }
    // function fdW() {
    //   return function () {
    //     return w
    //   }
    // }
    function r(start, duration) { // calculate ratio
      var timeDifference = n() - start
      return timeDifference > duration ? 1 : timeDifference/duration
    }
    function re(start, duration, ease) { // calculate ratio with ease
      var timeDifference = n() - start
      return ease(timeDifference > duration ? 1 : timeDifference/duration)
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
    function easeOutCirc(t) {
      var t1 = t - 1
      return Math.sqrt( 1 - t1 * t1 )

    }
    function easeOutQuad(t) {
        return t * ( 2 - t )
    }
    function isRetinaDisplay() {
        if (window.matchMedia) {
            var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
            return (mq && mq.matches || (window.devicePixelRatio > 1));
        }
    }
    // function easeInCubic(t) { return t*t*t }

  /* binds */
    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false)

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
      if(isLastScene) {
        isLastScene = false
        window.requestAnimationFrame(draw)
      }
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

      var prefix = isRetinaDisplay() ? 'x2' : ''
      loader_bg1 = new Image()
      loader_bg1.onload = preloadCounterTick
      loader_bg1.src = 'assets/images/loader_bg1' + prefix + '.png'

      loader_bg2 = new Image()
      loader_bg2.onload = preloadCounterTick
      loader_bg2.src = 'assets/images/loader_bg2' + prefix + '.png'

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

        ctx.drawImage(img, center[0]- imgWidth/2, center[1] - imgHeight/2, imgWidth, imgHeight)
        var timing = glitch.timing

        if(n() > start + glitch.currentTiming*timing*1000 + currentScene[1]*timing*1000) {
          glitch.currentTiming += currentScene[1]

          if(glitch.index < glitch.map.length - 1) {
            ++glitch.index
          }
        }
      },
      bg: function(start, opts) {
        var img = opts.img
        var divider = isRetinaDisplay() ? 2 : 1
        var imgWidth = Math.floor(img.width*wM/divider)
        var imgHeight = Math.floor(img.height*wM/divider)
        var ratio = r(start, opts.timing)

        ctx.save()

          ctx.globalCompositeOperation = 'destination-over'
          ctx.globalAlpha = ratio
          ctx.drawImage(img, center[0]- imgWidth/2 - opts.offset.x*wM, center[1] - imgHeight/2 + opts.offset.y*wM, imgWidth, imgHeight)

        ctx.restore()
      },
      bg2: function(start, opts) {
        var img = opts.img
        var imgWidth = img.width*wM
        var imgHeight = img.height*wM
        var ratio = r(start, opts.timing)

        ctx.save()

          ctx.globalCompositeOperation = 'destination-over'
          ctx.globalAlpha = ratio
          ctx.drawImage(img, opts.x(), opts.y(), imgWidth, imgHeight)

        ctx.restore()
      },
      line: function(start, opts) {

        var ratio = r(start, opts.timing)

        ctx.beginPath()

          ctx.moveTo(opts.x1() ,opts.y1())
          ctx.lineTo(opts.x2(ratio), opts.y2(ratio))
          ctx.strokeStyle = 'rgb(255,145,129)'
          ctx.stroke()

        if(ratio === 1) {
          ctx.beginPath()
          ctx.arc(opts.x2(1), opts.y2(1), 3, 0, Math.PI * 2, true)
          ctx.fillStyle = 'rgb(255,145,129)'
          ctx.fill()
        }
      },
      rect: function(start, opts) {
        var ratio = re(start, opts.timing, easeInQuad)

        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = 'rgba(235, 21, 0, .65)'
        ctx.fillRect(opts.x(ratio), opts.y(ratio), opts.w(ratio), opts.h(ratio))
      },
      slice: function(start, opts) {
        var ratio = re(start, opts.timing, easeOutCirc)
        var sliceIndex = opts.index-1

        ctx.drawImage(slices.imgs[sliceIndex], w-slices.offset[sliceIndex], h-h*ratio, slices.widths[sliceIndex], slices.heights[sliceIndex])
      },
      // circle: function(start, opts) {
      //   var ratio = r(start, opts.timing)

      //   ctx.beginPath()
      //     ctx.arc(opts.x(), opts.y(), opts.radius*ratio, 0, Math.PI * 2, true)
      //     ctx.fillStyle = 'rgb(254,183,79)'
      //     ctx.fill()
      // },
      end: function(start, opts) {
        jumpToNextScene = true
      },
      fadeIn: function(start, opts) {
        var ratio = re(start, opts.timing, easeOutQuad)
        var element = opts.element

        if(opts.translate !== false) {
          element.style.top = -60*(1-ratio) + 'px'
        }
        element.style.opacity = ratio
        element.style.filter = 'alpha(opacity=' + ratio * 100 + ")"
        if(ratio === 1) { return null }
      },
      css: function(start, opts) {
        addClass(opts.element, opts.klass)
        return null
      },
      yearLine: function(start, opts) {
        var ratio = r(start, opts.timing)
        var number = opts.number

        ctx.save()

          // ctx.font = Math.floor(24*hM) + 'rem OswaldBold'
          // ctx.textBaseline = 'top'
          ctx.globalCompositeOperation = 'overlay'

          // var textWidth = ctx.measureText(number).width
          var x1 = dW()-slices.yearPosition[opts.position-1] + slices.yearWidth * .6
          var y1 = dH() - slices.yearFontSize[opts.position-1]*18
          var x2 = x1
          var y2 = dH() - (slices.yearFontSize[opts.position-1]*18) * (1 - ratio)


          ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = 'rgba(255,255,255,1)'
            ctx.stroke()

          ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = 'rgba(255,255,255,1)'
            ctx.stroke()

        ctx.restore()
      },
      yearNumber: function(start, opts) {
        var ratio = r(start, opts.timing)
        var number = opts.number

        ctx.save()

          ctx.font = slices.yearFontSize[opts.position-1]*10 + 'px OswaldBold, sans-serif'
          ctx.textBaseline = 'top'
          ctx.globalCompositeOperation = 'overlay'

          // var textWidth = ctx.measureText(number).width

          ctx.beginPath()
          //  opts.offset*wM
            ctx.rect(dW() - slices.yearPosition[opts.position-1], 0, slices.yearWidth * .6, dH())
            ctx.clip()


          ctx.fillStyle = 'rgba(255,255,255,1)'
          ctx.fillText(number, dW() - slices.yearPosition[opts.position-1] + (slices.yearWidth*(1-ratio)), dH() - slices.yearFontSize[opts.position-1]*14)
          ctx.fillText(number, dW() - slices.yearPosition[opts.position-1] + (slices.yearWidth*(1-ratio)), dH() - slices.yearFontSize[opts.position-1]*14)

        ctx.restore()
      },
      finish: function() {
        isLastScene = true
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


          // width of redbox that is less then last two slices
          slices.redboxWidth = slices.offset[2]-slices.widths[2]*0.1

          // number data calculation
          var yearPadding = slices.offset[2] * 0.05
          var yearWidth = (slices.offset[2] - 2 * yearPadding) / 4
          slices.yearWidth = yearWidth
          slices.yearPosition = []

          var wa = [4,3,2,1]
          wa.forEach(function(d) {
            slices.yearPosition.push(d * yearWidth + yearPadding)
          })

          slices.yearFontSize = []

          wa = ['1', '9', '1', '8']
          wa.forEach(function(d) {
            var textWidth = 99999
            var fontSize = 25
            while(textWidth > yearWidth) {
              --fontSize
              ctx.font = fontSize * 10 + 'px OswaldBold, sans-serif'
              ctx.textBaseline = 'top'
              textWidth = ctx.measureText(d).width
            }
            slices.yearFontSize.push(fontSize)
          })
          // console.log(slices.yearFontSize, slices.yearWidth)
          // console.log(slices, yearPadding)

        },
      ]
      var scenes = [
        [
          delayCheck(2000, drawings.glitch),
          delayCheck(2200, drawings.line, {
            timing: 800,
            onlyDesktop: true,
            x1: function() {return 0 },
            y1: function () { return dh(115) },
            x2: function (ratio) { return ratio * dw(290) },
            y2: function () { return dh(115) },
          }),
          delayCheck(1800, drawings.line, {
            timing: 800,
            onlyDesktop: true,
            x1: dW,
            y1: function () { return dH() - dh(420) },
            x2: function (ratio) { return dW() - ratio * dw(450) },
            y2: function () { return dH() - dh(420) },
          }),
          delayCheck(1400, drawings.line, {
            timing: 600,
            onlyDesktop: true,
            x1: fdw(240),
            y1: dH,
            x2: fdw(240),
            y2: function (ratio) { return dH() - ratio * dh(320) },
          }),
          delayCheck(1600, drawings.line, {
            timing: 800,
            onlyDesktop: true,
            x1: fdw(140),
            y1: dH,
            x2: fdw(140),
            y2: function (ratio) { return dH() - ratio * dh(500) },
          }),
          // delayCheck(2000, drawings.rect, {
          //   timing: 600,
          //   onlyDesktop: true,
          //   x: function() { return dW() - dw(32) - dw(135) },
          //   y: function() { return 0 },
          //   w: fdw(32),
          //   h: function (ratio) { return ratio * dh(315) },
          // }),
          delayCheck(1400, drawings.bg, {
            timing: 400,
            img: loader_bg1,
            offset: {x: 130, y: 130 }
          }),
          delayCheck(1600, drawings.bg, {
            timing: 400,
            img: loader_bg2,
            offset: { x: -290, y: -360 }
          }),
          delayCheck(3800, drawings.rect, {
            timing: 1000,
            onlyDesktop: true,
            x: function() {return dW() - dw(32) - dw(135) },
            y: function() {return 0 }, // dh(315)
            w: fdw(32),
            h: function (ratio) { return ratio * dH() }, // ratio * (dH()-dh(315))
          }),
          delayCheck(5000, drawings.end, {})
        ],

        [
          delayCheck(0, drawings.rect, {
            timing: 800,
            onlyDesktop: true,
            x: function(ratio) {
              var rightW = dw(32+135)
              var leftW = slices.redboxWidth - rightW
              return dW() - rightW - leftW * ratio
            },
            y: function() { return 0 },
            w: function (ratio) {
              var rightW = dw(32+135)
              var leftW = slices.redboxWidth - rightW
              return dw(32) + dw(135) * ratio + leftW * ratio
            },
            h: dH,
          }),
          delayCheck(800, drawings.rect, {
            timing: 400,
            onlyDesktop: true,
            x: function(ratio) { return dW() - slices.redboxWidth - slices.widths[1] * ratio },
            y: function() {return dH()*0.64 }, //- dh(521)
            w: function (ratio) { return slices.widths[1] * ratio },
            h: function() { return dH()*0.64 } //fdh(521),
          }),


          delayCheck(100, drawings.slice, { timing: 700, index: 1, onlyDesktop: true, }),
          delayCheck(500, drawings.slice, { timing: 400, index: 2, onlyDesktop: true, }),
          delayCheck(100, drawings.slice, { timing: 700, index: 3, onlyDesktop: true, }),
          delayCheck(400, drawings.slice, { timing: 400, index: 4, onlyDesktop: true, }),

          delayCheck(1200, drawings.css, { timing: 600, selector: '[data-id="1"]', klass: 'show' }),

          delayCheck(1200, drawings.bg2, {
            timing: 600,
            onlyDesktop: true,
            img: loader_bg3,
            x: function () { return dW() - slices.offset[0]*1.1 },
            y: function () { return -50*hM }
          }),
          delayCheck(1200, drawings.bg2, {
            timing: 600,
            onlyDesktop: true,
            img: loader_bg4,
            x: function () { return dW() - slices.offset[0] },
            y: function () { return dH() * .73 }
          }),

          delayCheck(1400, drawings.yearLine, { timing: 300, onlyDesktop: true, number: '1', position: 1, }),
          delayCheck(1600, drawings.yearLine, { timing: 300, onlyDesktop: true, number: '9', position: 2, }),
          delayCheck(1800, drawings.yearLine, { timing: 300, onlyDesktop: true, number: '1', position: 3, }),
          delayCheck(2000, drawings.yearLine, { timing: 300, onlyDesktop: true, number: '8', position: 4, }),

          delayCheck(1450, drawings.yearNumber, { timing: 400, onlyDesktop: true, number: '1', position: 1, }),
          delayCheck(1650, drawings.yearNumber, { timing: 400, onlyDesktop: true, number: '9', position: 2, }),
          delayCheck(1850, drawings.yearNumber, { timing: 400, onlyDesktop: true, number: '1', position: 3, }),
          delayCheck(2050, drawings.yearNumber, { timing: 400, onlyDesktop: true, number: '8', position: 4, }),

          delayCheck(2000, drawings.fadeIn, { timing: 800, selector: '[data-id="3"]', }),
          delayCheck(2500, drawings.fadeIn, { timing: 800, selector: '[data-id="6"]', }),
          delayCheck(2700, drawings.fadeIn, { timing: 800, selector: '[data-id="7"]', }),
          delayCheck(3000, drawings.fadeIn, { timing: 800, selector: '[data-id="8"]', }),
          delayCheck(3300, drawings.fadeIn, { timing: 800, selector: '[data-id="10"]', }),
          delayCheck(3600, drawings.fadeIn, { timing: 800, selector: '[data-id="2"]', translate: false }),
          delayCheck(3600, drawings.fadeIn, { timing: 800, selector: '[data-id="11"]', }),

          delayCheck(1800, drawings.css, { timing: 600, selector: '[data-id="4"]', klass: 'animation' }), // horizontal top
          delayCheck(3400, drawings.css, { timing: 600, selector: '[data-id="9"]', klass: 'animation' }), // horizontal bottom
          delayCheck(2200, drawings.css, { timing: 600, onlyDesktop: true, selector: '[data-id="5"]', klass: 'animation' }), // vertical line
          delayCheck(1000, drawings.css, { timing: 0, selector: '.source', klass: 'show' }),
          delayCheck(5000, drawings.finish, {})
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
          if(options.selector) {
            options.element = document.querySelector(options.selector)
          }
          return function () {
            if(options.onlyDesktop && (!screen.desktop() || dW() < 1200)) { return true }
            return callback(nw, options)
          }
        }
        return true
      }
    }

    function draw() {
      // ctx.restore()// clear canvas
      ctx.clearRect(0, 0, w, h)
      if(jumpToNextScene) {
        scene = nextScene()
        if(scene === null) { return }
        jumpToNextScene = false
      }

      scene.forEach(function (d, i){
        if(typeof d === 'function') {
          var res = d()
          if(typeof res === 'function') {
            var next_res = res()
            scene[i] = next_res === null ? null : res
          }
        }
      })
      if(!isLastScene) {
        window.requestAnimationFrame(draw)
      }
    }

  /* init */

    function init() {
      resizeCanvas()

      ctx.globalCompositeOperation = 'destination-over'

      scene = nextScene()

      window.requestAnimationFrame(draw)

      assets.preload()
    }

  preload()
})()
