(function() {
  /* variables */
    var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    var logo = null
    var loader_bg1 = null
    var loader_bg2 = null
    var glitch = {
        timing: 0,
        duration: 1.68,
        count: 7,
        currentTiming: 0,
        map: [ // id, time ratio
          [1,1],
          [2,1],
          [3,1],
          [4,1],
          [5,1],
          ['logo',8],
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
    var nextSceneIndex = 0
    var jumpToNextScene = false

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
    function easeInQuad(t) { return t*t }
    // function easeInCubic(t) { return t*t*t }


  /* binds */
    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
      w = window.innerWidth
      h = window.innerHeight
      wM = w / 2565
      hM = h / 1445

      center = [w/2, h/2]
      canvas.width = w
      canvas.height = h

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
        img.src = 'assets/images/glitch/' + i + '.png'
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

        var tm = n() - start
        ratio = tm > opts.timing ? 1 : tm/opts.timing
        ctx.globalAlpha = ratio
        ctx.drawImage(img, center[0]- imgWidth/2 - opts.offset.x*wM, center[1] - imgHeight/2 + opts.offset.y*wM, imgWidth, imgHeight);


        // console.log(ratio)
        // ctx.save()
        // ctx.restore

        return true
      },
      line: function(start, opts) {

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
        var tm = n() - start

        ratio = easeInQuad(tm > opts.timing ? 1 : tm/opts.timing)

        ctx.fillStyle = 'rgba(225,73,58,.72)'
        ctx.fillRect(opts.x(), opts.y(), opts.w(ratio), opts.h(ratio));

        if(ratio === 1 && opts.hasOwnProperty('end') && typeof opts.end === 'function') {
          opts.end()
        }
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
        }
      ]
      var scenes = [
        [
          delayCheck(2000, drawings.glitch),
          delayCheck(2200, drawings.line, {
            timing: 400,
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
          }),
          delayCheck(1800, drawings.line, {
            timing: 600,
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
          }),
          delayCheck(1400, drawings.line, {
            timing: 400,
            x1: dw(240),
            y1: dH(),
            x2: dw(240),
            y2: function (ratio) {
              return h - ratio * dh(320)()
            },
          }),
          delayCheck(1600, drawings.line, {
            timing: 600,
            x1: dw(140),
            y1: dH(),
            x2: dw(140),
            y2: function (ratio) {
              return h - ratio * dh(500)()
            },
          }),
          delayCheck(2000, drawings.rect, {
            timing: 600,
            x: function() {return w - dw(32)() - dw(135)() },
            y: function() {return 0},
            w: dw(32),
            h: function (ratio) {
              return ratio * dh(315)()
            },
          }),
          delayCheck(1400, drawings.bg, { timing: 400, img: loader_bg1, offset: {x: 130, y: 130 }}),
          delayCheck(1600, drawings.bg, { timing: 400, img: loader_bg2, offset: { x: -290, y: -360 }}),

          delayCheck(6000, drawings.rect, {
            end: function () {
              jumpToNextScene = true
            },
            timing: 1000,
            x: function() {return w - dw(32)() - dw(135)() },
            y: function() {return dh(315)()},
            w: dw(32),
            h: function (ratio) {
              return ratio * (dH()()-dh(315)())
            },
          }),
        ]
      ]

      if(sceneInits.length !== scenes.length) {
        throw 'Scene array and scene initialization array length should match'
      }

      if(nextSceneIndex < scenes.length) {
        sceneInits[nextSceneIndex]()
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
          return function () { return callback(nw, options) }
        }
        return true
      }
    }

    function draw() {

      ctx.clearRect(0, 0, w, h);
      // ctx.restore()// clear canvas
      if(jumpToNextScene && nextScene() === null) { return }
      else {
        jumpToNextScene = false
      }

      scene.forEach(function (d, i){
        if(typeof d === 'function') {
          var res = d()
          if(typeof res === 'function') {
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
      ctx.save()

      scene = nextScene()

      startTime = Date.now()
      window.requestAnimationFrame(draw);
    }




  preload();
})();
