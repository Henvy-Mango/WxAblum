var COS = require('../../lib/cos-wx-sdk-v5.js');
const config = require('../../config.js');
const util = require('../../lib/util.js');
const app = getApp();


var cos = app.globalData.tmp;

Page({
  data: {
    // 相册列表数据
    albumList: [],

    //文件夹选择器
    folder: ['/'],
    selectFolder: 0,

    //深度遍历
    deeper: false,

    marker: 0,

    // 图片布局列表（二维数组，由`albumList`计算而得）
    layoutList: [],

    // 布局列数
    layoutColumnSize: 3,

    // 是否显示loading
    showLoading: false,

    // loading提示语
    loadingMessage: '',

    // 是否显示toast
    showToast: false,

    // 提示消息
    toastMessage: '',

    // 是否显示动作命令
    showActionsSheet: false,

    // 当前操作的图片
    imageInAction: '',

    // 图片预览模式
    previewMode: false,

    // 当前预览索引
    previewIndex: 0,

    // 切换动画的时间
    slideDuration: 400,

    // 状态栏高度
    statusBarHeight: wx.getStorageSync('statusBarHeight') + 'px',
    // 导航栏高度
    navigationBarHeight: wx.getStorageSync('navigationBarHeight') + 'px',
    // 胶囊按钮高度
    menuButtonHeight: wx.getStorageSync('menuButtonHeight') + 'px',
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight: wx.getStorageSync('statusBarHeight') +
      wx.getStorageSync('navigationBarHeight') + 3 + 'px',
  },
  onShareAppMessage: function (res) {
    return {
      title: 'Naomi 云相册',
      path: this.route,
    }
  },

  // 显示loading提示
  showLoading(loadingMessage) {
    this.setData({
      showLoading: true,
      loadingMessage
    });
  },

  // 隐藏loading提示
  hideLoading() {
    this.setData({
      showLoading: false,
      loadingMessage: ''
    });
  },

  // 显示toast消息
  showToast(toastMessage) {
    this.setData({
      showToast: true,
      toastMessage
    });
  },

  // 隐藏toast消息
  hideToast() {
    this.setData({
      showToast: false,
      toastMessage: ''
    });
  },

  // 隐藏动作列表
  hideActionSheet() {
    this.setData({
      showActionsSheet: false,
      imageInAction: ''
    });
  },

  onLoad() {
    var self = this;
    console.log(wx.getSystemInfoSync())
    const {
      statusBarHeight,
      platform,
      screenHeight
    } = wx.getSystemInfoSync()
    const {
      top,
      height
    } = wx.getMenuButtonBoundingClientRect()

    wx.enableAlertBeforeUnload({
      message: "要返回首页吗？"
    })
    // 状态栏高度
    wx.setStorageSync('statusBarHeight', statusBarHeight)
    // 胶囊按钮高度 一般是32 如果获取不到就使用32
    wx.setStorageSync('menuButtonHeight', height ? height : 32)

    wx.setStorageSync('screenHeight', screenHeight)

    // 判断胶囊按钮信息是否成功获取
    if (top && top !== 0 && height && height !== 0) {
      const navigationBarHeight = (top - statusBarHeight) * 2 + height
      // 导航栏高度
      wx.setStorageSync('navigationBarHeight', navigationBarHeight)
    } else {
      wx.setStorageSync(
        'navigationBarHeight',
        platform === 'android' ? 48 : 40
      )
    }

    this.getAlbumDir();
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = self.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      self.setData({
        'albumList': list
      });
      self.renderAlbumList();
    });
  },

  tapBackButton() {
    this.setData({
      back: true
    })
  },

  confirmBack(e) {
    if (e.detail.item.text == "取消")
      this.setData({
        back: false
      })
    else if (e.detail.item.text == "确认") {
      wx.disableAlertBeforeUnload()
      wx.navigateBack({
        delta: 1,
      })
    }
  },

  getAlbumDir() {
    let that = this;
    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: "",
      Delimiter: "/",
    }, function (err, data) {
      if (data) {
        let list = data.CommonPrefixes.map(item => item.Prefix).filter(item => /^(?!.*CDN).*$/.test(item))
        that.data.folder = that.data.folder.concat(list)
        that.setData({
          folder: that.data.folder
        })
      }
    })
  },

  // 获取相册列表
  getAlbumList(callback, marker = "") {
    let that = this;
    this.showLoading('加载列表中…');
    setTimeout(() => this.hideLoading(), 300);
    var prefix = that.data.folder[that.data.selectFolder];
    if (prefix == '/')
      prefix = config.Prefix
    var delimiter = that.data.deeper;
    delimiter = delimiter ? config.Delimiter : '/';
    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: prefix,
      Marker: marker,
      Delimiter: delimiter,
      MaxKeys: 200,
    }, function (err, data) {
      if (data) {
        console.log(data)
        if (data.IsTruncated == "true") {
          that.data.marker = data.NextMarker
          that.setData({
            marker: data.NextMarker
          })
        } else {
          that.data.marker = 0
          that.setData({
            marker: 0
          })
        }
        var list = (data && data.Contents || [])
          .map(item => 'https://' + config.Bucket + '.cos.' + config.Region + '.myqcloud.com/' + util.camSafeUrlEncode(item.Key).replace(/%2F/g, '/')).filter(item => /\.(jpg|png|gif|jpeg|pjp|pjpeg|jfif|xbm|tif|svgz|webp|ico|bmp|svg)$/.test(item) && /^(?!.*CDN).*$/.test(item));
        callback(list);
      } else {
        callback([]);
      }
    });
  },

  // 渲染相册列表
  renderAlbumList() {
    let layoutColumnSize = this.data.layoutColumnSize;
    let layoutList = [];
    var imageList = [].concat(this.data.albumList);

    imageList.unshift({
      type: 'add'
    });

    layoutList = util.listToMatrix(imageList, layoutColumnSize, this.data.marker);

    this.setData({
      layoutList,
    });
  },

  // 从相册选择照片或拍摄照片
  chooseImage() {
    var self = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        self.showLoading('正在上传图片…');
        self.setData({
          upload: res.tempFilePaths
        })

        res.tempFilePaths.forEach(function (filePath, index) {
          self.getCanvasImg(filePath, index).then(
            res => {
              console.log(res)
              util.checkSafePic(res).then(res => {
                if (res) {
                  var Key = util.getRandFileName(filePath);
                  filePath && cos.postObject({
                    Bucket: config.Bucket,
                    Region: config.Region,
                    Key: Key,
                    FilePath: filePath
                  }, function (err, data) {
                    if (data) {
                      let albumList = self.data.albumList;
                      // debugger;
                      albumList.unshift('https://' + data.Location);
                      self.setData({
                        albumList
                      });
                      self.renderAlbumList();
                    }
                    self.hideLoading();
                  });
                } else {
                  self.hideLoading()
                  wx.showToast({
                    title: "第" + (index + 1).toString() + "张图片不合法",
                    icon: 'none',
                    duration: 3000
                  })
                }
              })
            }, err => {
              self.hideLoading()
            }
          )


        });
      }, fail: (err) => {
        console.log(err)
        self.hideLoading();
      }
    });
  },

  // 进入预览模式
  enterPreviewMode(event) {
    var self = this;
    if (this.data.showActionsSheet) {
      return;
    }
    let imageUrl = event.target.dataset.src;
    let previewIndex = this.data.albumList.indexOf(imageUrl);

    this.setData({
      slideDuration: 0
    });
    setTimeout(function () {
      self.setData({
        previewMode: true,
        previewIndex: previewIndex
      });
      setTimeout(function () {
        self.setData({
          slideDuration: 400
        });
      }, 400);
    });
  },

  // 退出预览模式
  leavePreviewMode() {
    this.setData({
      previewMode: false,
      previewIndex: 0
    });
  },

  // 显示可操作命令
  showActions(event) {
    this.setData({
      showActionsSheet: true,
      imageInAction: event.target.dataset.src
    });
  },

  // 下载图片
  downloadImage() {
    this.showLoading('正在保存图片…');
    console.log('download_image_url', this.data.imageInAction);
    wx.downloadFile({
      url: this.data.imageInAction,
      type: 'image',
      success: (resp) => {
        wx.saveImageToPhotosAlbum({
          filePath: resp.tempFilePath,
          success: (resp) => {
            this.showToast('图片保存成功');
          },
          fail: (resp) => {
            console.log('fail', resp);
          },
          complete: (resp) => {
            console.log('complete', resp);
            this.hideLoading();
          },
        });
      },

      fail: (resp) => {
        console.log('fail', resp);
      },
    });

    this.setData({
      showActionsSheet: false,
      imageInAction: ''
    });
  },

  // 删除图片
  deleteImage() {
    var tmp = this.data.imageInAction;
    let imageUrl = decodeURIComponent(tmp);
    var m = imageUrl.match(/^https:\/\/[^\/]+\/([^#?]+)/);
    var Key = m && m[1] || '';
    if (Key) {
      this.showLoading('正在删除图片…');
      this.setData({
        showActionsSheet: false,
        imageInAction: ''
      });
      cos.deleteObject({
        Bucket: config.Bucket,
        Region: config.Region,
        Key: Key,
      }, (err, data) => {
        if (data) {
          console.log(data)
          let index = this.data.albumList.indexOf(tmp);
          if (~index) {
            let albumList = this.data.albumList;
            albumList.splice(index, 1);
            this.setData({
              albumList
            });
            this.renderAlbumList();
          }
          this.showToast('图片删除成功');
        } else {
          this.showToast('图片删除失败');
        }
        this.hideLoading();
      });
    }
  },

  copyLink() {
    let tmp = decodeURIComponent(this.data.imageInAction);
    tmp = tmp.substring(tmp.lastIndexOf('/') + 1, tmp.length);
    tmp = "https://img.naomi.pub/" + tmp;
    console.log('copy_image_url', tmp);

    wx.setClipboardData({
      data: tmp,
      success: function () {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 1000
        });
      },
      fail: function () {
        wx.showToast({
          title: '复制失败',
          icon: 'error',
          duration: 1000
        });
      },
    });
  },

  bindPickerChange: function (e) {
    console.log('picker发送选择改变，当前文件夹为', this.data.folder[e.detail.value])
    this.setData({
      selectFolder: e.detail.value,
      layoutList: [],
      albumList: [],
    })
    var self = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = self.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      self.setData({
        'albumList': list
      });
      self.renderAlbumList();
    });
  },

  checkboxChange: function (e) {
    console.log('checkbox发送选择改变，当前深度遍历为', e.detail.value != '' ? '开启' : '关闭')
    this.data.deeper = e.detail.value != 'deepFold' ? false : true;

    this.setData({
      layoutList: [],
      albumList: [],
    })
    var self = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = self.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      self.setData({
        'albumList': list
      });
      self.renderAlbumList();
    });
  },

  nextPage() {
    console.log(this.data.marker)
    this.setData({
      layoutList: [],
      albumList: [],
    })
    var self = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = self.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      self.setData({
        'albumList': list
      });
      self.renderAlbumList();
    }, self.data.marker);
  },

  goTop: function () {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    })
    this.hideActionSheet()
  },

  //压缩并获取图片
  getCanvasImg: function (tempFilePaths, index) {
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
            cWidth: canvasWidth,
            cHeight: canvasHeight
          })

          //----------绘制图形并取出图片路径--------------
          var ctx = wx.createCanvasContext('canvas-' + index)
          new Promise(() => ctx.drawImage(res.path, 0, 0, canvasWidth, canvasHeight)).then(
            ctx.draw(setTimeout(function () {
              wx.canvasToTempFilePath({
                canvasId: 'canvas-' + index,
                destWidth: canvasWidth,
                destHeight: canvasHeight,
                quality: 0.8,
                success: function (res) {
                  //最终图片路径
                  console.log(res)
                  resolve(res.tempFilePath)
                },
                fail: function (res) {
                  console.log(res.errMsg)
                }
              }, self)
            }, 300))
          )

        }, //留一定的时间绘制canvas
        fail: function (res) {
          console.log(res.errMsg)
          reject(res)
        }
      })
    })
  }
});