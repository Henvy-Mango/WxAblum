var util = require('../../lib/util');
var config = require('../../config');
const app = getApp();

var cos = app.globalData.cos;

Page({
  data: {
    message: {}
  },
  onLoad: function () { },
  onShareAppMessage: function (res) {
    return {
      title: 'Naomi 相册',
      path: this.route,
    }
  },

  // 前往相册页
  uploadImage() {
    var that = this
    wx.chooseImage({
      count: 1,
      camera: 'back',
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
    }).then(res => {
      var filePath = res.tempFilePaths[0];
      that.getCanvasDetail(filePath)
        .then(res => that.getCanvasImg(res))
        .then(res => util.checkSafePic(res))
        .then(res => {
          if (res) {
            //图片正常
            if (filePath) {
              var Key = util.getRandFileName(filePath);
              cos.postObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: Key,
                FilePath: filePath,
              }, function (err, data) {
                that.setData({
                  message: {
                    enable: true,
                    type: "info",
                    text: "正在上传图片…",
                    delay: 3000,
                  },
                })
                if (data && data.Location) {
                  wx.navigateTo({
                    url: '../preview/preview?type=image&url=' + encodeURIComponent('https://' + data.Location)
                  });
                } else {
                  that.setData({
                    message: {
                      enable: true,
                      type: "error",
                      text: "上传失败",
                      delay: 3000,
                    },
                  })
                }
              });
            }
          } else {
            that.setData({
              message: {
                enable: true,
                type: "error",
                text: "图片违规违法",
                delay: 3000,
              },
            })
          }
        })
    })
  },
  // 前往相册页
  uploadVideo() {
    wx.chooseVideo({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: function (res) {
        var filePath = res.tempFilePath;
        if (filePath) {
          var Key = util.getRandFileName(filePath);
          wx.showLoading({
            title: '正在上传...'
          });
          cos.postObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: Key,
            FilePath: filePath,
          }, function (err, data) {
            wx.hideLoading();
            if (data && data.Location) {
              wx.navigateTo({
                url: '../preview/preview?type=video&url=' + encodeURIComponent('https://' + data.Location)
              });
            } else {
              wx.showToast({
                title: '上传失败',
                icon: 'none',
                duration: 3000
              });
            }
          });
        }
      }
    });
  },
  // 前往相册页
  gotoAlbum() {
    wx.navigateTo({
      url: '../album/album'
    });
  },

  // 计算图片缩小后的尺寸
  getCanvasDetail: function (tempFilePaths) {
    var that = this;
    return new Promise(function (resolve, reject) {
      //-----返回选定照片的本地文件路径列表，获取照片信息-----------
      wx.getImageInfo({
        src: tempFilePaths,
        success: function (res) {
          //---------利用canvas压缩图片--------------
          var ratio = 2;
          var canvasWidth = res.width //图片原始长宽
          var canvasHeight = res.height
          while (canvasWidth > 120 || canvasHeight > 120) { // 保证宽高在400以内
            canvasWidth = Math.trunc(res.width / ratio)
            canvasHeight = Math.trunc(res.height / ratio)
            ratio++;
          }
          console.log("图片压缩后大小为" + canvasWidth + "x" + canvasHeight)

          that.setData({
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
          })
          resolve(tempFilePaths)
        },
        fail: function (res) {
          console.log(res.errMsg)
          reject(res)
        }
      })
    })
  },

  // 使用canvas画布，获取压缩后的图片
  async getCanvasImg(res) {
    var that = this;
    //----------绘制图形并取出图片路径--------------
    // 通过 SelectorQuery 获取 Canvas 节点
    const query = wx.createSelectorQuery();

    const canvas = await new Promise((resolve, reject) => {
      query.select('#canvas')
        .fields({ node: true, size: true })
        .exec(async (item) => {
          const width = item[0].width
          const height = item[0].height

          const canvas = item[0].node
          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          const image = canvas.createImage();//创建image       
          image.src = res;//指定路径为getImageInfo的文件
          image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height)//图片加载完成时draw
            resolve(canvas)
          }
        })
    })
    return wx.canvasToTempFilePath({
      canvas: canvas,
      quality: 0.8,
    }, that).then(res => {
      console.log(res.tempFilePath)
      return res.tempFilePath
    })
  }

})