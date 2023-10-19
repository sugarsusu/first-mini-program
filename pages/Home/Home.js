// pages/Home/Home.js
const app = getApp()
const {
  load
} = require('../../utils/resloader')
const {
  stages
} = require('../../utils/stages')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    score: 0,
    player: {
      x: 0,
      y: 0
    },
    stage_index: 0,
    bgMap: []
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  on_progress(progress) {
    const {
      ctx,
      width,
      height,
    } = this.data

    //clear screen
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, width, height);

    //draw progress
    ctx.fillStyle = "#f00"
    ctx.fillRect(0, height / 2 - 2, progress * width, 4);
  },

  draw() {
    const {
      ctx,
      width,
      height,
      bgMap,
      images
    } = this.data

    //clear screen
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, width, height);

    //draw player
    ctx.fillStyle = "#000"

    const n = bgMap.length
    const size = width / n

    console.log("n, size", n, size)

    bgMap.forEach((line, y) => {
      line.forEach((item, x) => {
        if (item !== 0) {
          ctx.drawImage(images.filter(img => {
            return img.id === item
          })[0].img, x * size, y * size, size, size)
        }
      })
    })
  },
  get_map(x, y) {
    const {
      bgMap
    } = this.data
    return bgMap[y][x]
  },
  set_map(x, y, value) {
    const {
      bgMap
    } = this.data
    const new_map = [...bgMap]
    new_map[y][x] = value
    this.setData({
      bgMap: new_map
    })
  },
  find_player() {
    const {
      bgMap
    } = this.data
    let at = null
    bgMap.forEach((line, y) => {
      line.forEach((item, x) => {
        if (item === 8 || item === 9 ) {
          console.log('player at ', x, y)
          at = {
            x,
            y
          }
        }
      })
    })
    return at
  },
  up() {
    const {
      bgMap
    } = this.data
    //find player 8
    const at = this.find_player()
    if (at) {
      const {
        x,
        y
      } = at
      this.move(9, [x, y], [x, y - 1])
    }
    this.draw()
  },
  down() {
    const {
      bgMap
    } = this.data
    //find player 8
    const at = this.find_player()
    if (at) {
      const {
        x,
        y
      } = at
      console.log('[ x, y ] >', x, y)
      this.move(9, [x, y], [x, y + 1])
    }
    this.draw()
  },
  left() {
    const {
      bgMap
    } = this.data
    //find player 8
    const at = this.find_player()
    if (at) {
      const {
        x,
        y
      } = at
      this.move(9, [x, y], [x - 1, y])
    }
    this.draw()
  },
  right() {
    const {
      bgMap
    } = this.data
    //find player 8
    const at = this.find_player()
    if (at) {
      const {
        x,
        y
      } = at
      this.move(9, [x, y], [x + 1, y])
    }
    this.draw()
  },
  move(id, from, to, callback) {
    const _self = this
    const target = this.get_map(to[0], to[1])
    if (target == 0) {
      this.set_map(from[0], from[1], 0)
      this.set_map(to[0], to[1], id)
      if (callback) {
        console.log('callback')
        callback()
      }
    }
    if (target == 3) {
      const next_to = [to[0] - from[0] + to[0], to[1] - from[1] + to[1]]
      this.move(3, to, next_to, () => {
        console.log('cbm')
        this.move(id, from, to, callback)
      })
    }
    if ((target == 2 || target == 4) && (id == 8 || id === 9)) {
      // next stage 
      const {
        stage_index
      } = this.data

      const next = stage_index + 1
      if (next < stages.length) {
        const bgMap = JSON.parse(JSON.stringify(stages[next]));
        this.setData({
          stage_index: next,
          bgMap: [...stages[next]]
        })
      } else {
        // 通关
        wx.showModal({
          title: '提示',
          content: '你已经通关了，是否重新玩一局？',
          success(res) {
            if (res.confirm) {
              const bgMap = JSON.parse(JSON.stringify(stages[0]));
              _self.setData({
                stage_index: 0,
                bgMap: bgMap
              })
              _self.start()
            } else if (res.cancel) {

            }
          }
        })
      }
    }
  },
  start() {
    const bgMap = JSON.parse(JSON.stringify(stages[this.data.stage_index]));
    this.setData({
      bgMap: bgMap  
    })
    this.draw()
  },
  onReady() {
    const _self = this;
    const query = wx.createSelectorQuery()
    query.select('#myCanvas')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        console.log("res",res[0])

        const dpr = wx.getSystemInfoSync().pixelRatio
        // canvas.width = res[0].width * dpr
        // canvas.height = res[0].height * dpr
        const {
          width,
          height
        } = res[0]
        canvas.width = width
        canvas.height = height

        _self.setData({
          ctx: ctx,
          width: width,
          height: height,
          score: 0
        })

        // ctx.scale(dpr, dpr)
        load([1, 2, 3, 4, 8, 9], canvas, (loaded_images) => {
          _self.setData({
            images: loaded_images
          })
          _self.start()
        }, (progress) => {
          _self.on_progress(progress)
        })
      })
  }
})