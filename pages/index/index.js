var util = require('../../lib/util');
var config = require('../../config');
const app = getApp();

var cos = app.globalData.cos;

Page({
  data: {},
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
      success: function (res) {
        wx.showLoading({
          title: '正在上传...',
        });
        var filePath = res.tempFilePaths[0];
        that.getCanvasImg(res.tempFilePaths).then(res => {
          util.checkSafePic(res).then(
            res => {
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
                    wx.hideLoading();
                    if (data && data.Location) {
                      wx.navigateTo({
                        url: '../preview/preview?type=image&url=' + encodeURIComponent('https://' + data.Location)
                      });
                    } else {
                      wx.showToast({
                        title: '上传失败',
                        icon: 'error',
                        duration: 3000
                      });
                    }
                  });
                }
              } else {
                wx.showToast({
                  title: '图片违法违规',
                  icon: 'none',
                  duration: 3000
                });
              }
            }
          )
        }
        )
      }
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
  //压缩并获取图片，这里用了递归的方法来解决canvas的draw方法延时的问题
  getCanvasImg: function (tempFilePaths) {
    var that = this;
    return new Promise(function (resolve, reject) {
      //-----返回选定照片的本地文件路径列表，获取照片信息-----------
      wx.getImageInfo({
        src: tempFilePaths[0],
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
            cWidth: canvasWidth,
            cHeight: canvasHeight
          })

          //----------绘制图形并取出图片路径--------------
          var ctx = wx.createCanvasContext('canvas')
          ctx.drawImage(res.path, 0, 0, canvasWidth, canvasHeight)
          ctx.draw(false, setTimeout(function () {
            wx.canvasToTempFilePath({
              canvasId: 'canvas',
              destWidth: canvasWidth,
              destHeight: canvasHeight,
              success: function (res) {
                //最终图片路径
                resolve(res.tempFilePath)
              },
              fail: function (res) {
                console.log(res.errMsg)
              }
            })
          }, 100))
        }, //留一定的时间绘制canvas
        fail: function (res) {
          console.log(res.errMsg)
          reject(res)
        }
      })
    })
  }
})