const config = require('../../config.js');
const util = require('../../lib/util.js');
const app = getApp();
var cos = app.globalData.cos;

Page({
  data: {
    // 图片原始列表
    albumList: [],

    // 文件夹选择器
    folder: ['/'],
    selectFolder: 0,

    // 深度遍历
    deeper: false,

    // 加载框
    loading: {
      enable: false,
      text: "加载中"
    },

    // Toast信息
    message: {
      enable: false,
      type: "",
      text: "",
      delay: 2000,
    },

    // Dialog信息
    dialog: {
      enable: false,
      type: "back",
      title: "返回首页",
      message: "真的要回去吗？"
    },

    // 下一页标记
    marker: 0,

    //上传图片列表
    upload: [],

    // 图片布局列表（二维数组，由`albumList`计算而得）
    layoutList: [],

    // 布局列数
    layoutColumnSize: 3,

    // 是否显示动作命令
    showActionSheet: false,

    // 动作命令列表
    Actions: [
      { text: '返回顶部', value: 1 },
      { text: '复制图片链接', value: 2 },
      { text: '保存到本地', value: 3 }
    ],

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

  onLoad() {
    var that = this;

    wx.enableAlertBeforeUnload({
      message: "要返回首页吗？"
    })

    this.getAlbumDir();
    // 初始化布局
    this.renderAlbumList();

    this.getAlbumList(function (list) {
      list = that.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      that.setData({
        'albumList': list
      });
      that.renderAlbumList();
    });

  },

  // 获取文件夹
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
    that.setData({
      loading: {
        enable: true,
        text: "加载中"
      },
    })
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
      MaxKeys: 100,
    }, function (err, data) {
      if (data) {
        console.log(data)
        if (data.IsTruncated == "true") {
          that.data.marker = data.NextMarker
        } else {
          that.data.marker = 0
        }
        var list =
          util.qSort((data && data.Contents || []).filter(item => /\.(jpg|png|gif|jpeg|pjp|pjpeg|jfif|xbm|tif|svgz|webp|ico|bmp|svg)$/.test(item.Key) && /^(?!.*CDN).*$/.test(item.Key)))
            .map(item => 'https://' + config.Bucket + '.cos.' + config.Region + '.myqcloud.com/' + util.camSafeUrlEncode(item.Key).replace(/%2F/g, '/'));

        that.setData({
          loading: {
            enable: false,
            text: "加载中"
          },
        })
        callback(list);
      } else {
        that.setData({
          loading: {
            enable: false,
            text: "加载中"
          },
        })
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
    var that = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera']
    }).then(res => {
      that.setData({
        loading: {
          enable: true,
          text: "上传中"
        },
        upload: res.tempFilePaths.map(item => {
          return {
            path: item,
            canvasWidth: 0,
            canvasHeight: 0,
          }
        }),
        message: {
          enable: true,
          type: "info",
          text: "正在上传图片…",
          delay: 1000,
        },
      })
      return res.tempFilePaths
    }).then(res => {
      res.forEach((filePath, index) => {
        that.getCanvasDetail(filePath, index)
          .then(res => that.getCanvasImg(res))
          .then(res => util.checkSafePic(res))
          .then(res => {
            if (res) {
              var Key = util.getRandFileName(filePath);
              filePath && cos.postObject({
                Bucket: config.Bucket,
                Region: config.Region,
                Key: Key,
                FilePath: filePath
              }, function (err, data) {
                if (data) {
                  let albumList = that.data.albumList;
                  // debugger;
                  albumList.unshift('https://' + data.Location);
                  that.setData({
                    albumList,
                  });
                  that.renderAlbumList();
                }
              })
            } else {
              that.setData({
                message: {
                  enable: true,
                  type: "error",
                  text: "第" + (index + 1).toString() + "张图片不合法",
                  delay: 3000,
                },
              })
            }
          })
      })
    }).then(() => that.setData({
      loading: {
        enable: false,
        text: "加载中"
      }
    }))
  },

  // 计算图片缩小后的尺寸
  getCanvasDetail: function (tempFilePaths, index) {
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

          that.data.upload[index].canvasWidth = canvasWidth
          that.data.upload[index].canvasHeight = canvasHeight
          that.setData({
            upload: that.data.upload
          })
          resolve({
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            index: index,
            path: tempFilePaths
          })
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
    const query = wx.createSelectorQuery();
    const canvas = await new Promise((resolve, reject) => {
      query.select('#canvas-' + res.index)
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
          image.src = res.path;//指定路径为getImageInfo的文件
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

  },

  // 进入预览模式
  enterPreviewMode(event) {
    var that = this;
    if (this.data.showActionSheet) {
      return;
    }
    let imageUrl = event.target.dataset.src;
    let previewIndex = this.data.albumList.indexOf(imageUrl);

    this.setData({
      slideDuration: 0,
      Actions: [
        { text: '复制图片链接', value: 2 },
        { text: '保存到本地', value: 3 }
      ]
    });
    setTimeout(function () {
      that.setData({
        previewMode: true,
        previewIndex: previewIndex
      });
      setTimeout(function () {
        that.setData({
          slideDuration: 400
        });
      }, 400);
    });
  },

  // 退出预览模式
  leavePreviewMode() {
    this.setData({
      previewMode: false,
      previewIndex: 0,
      Actions: [
        { text: '返回顶部', value: 1 },
        { text: '复制图片链接', value: 2 },
        { text: '保存到本地', value: 3 }
      ]
    });
  },

  // 显示可操作命令
  showActions(event) {
    this.setData({
      showActionSheet: true,
    });
    this.data.imageInAction = event.target.dataset.src
  },

  // 动作列表选择
  btnClick(e) {
    let tmp = e.detail.value
    if (tmp == 1) {
      this.goTop()
    } else if (tmp == 2) {
      this.copyLink()
    } else if (tmp == 3) {
      this.downloadImage()
    } else if (tmp == 4) {
      this.setData({
        dialog: {
          enable: true,
          type: "delete",
          title: "删除图片",
          message: "真的要删除吗？"
        },
        showActionSheet: false
      })
    }
  },

  // 返回顶部按钮
  goTop: function () {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    })
    this.hideActionSheet()
  },

  // 拷贝图片链接
  copyLink() {
    let that = this;
    let tmp = decodeURIComponent(this.data.imageInAction);
    tmp = tmp.substring(tmp.lastIndexOf('/') + 1, tmp.length);
    tmp = "https://img.naomi.pub/" + tmp;
    console.log('copy_image_url', tmp);

    wx.setClipboardData({
      data: tmp,
      success: function () {
        that.setData({
          message: {
            enable: true,
            type: "success",
            text: "复制成功",
            delay: 1500,
          }
        })
      },
      fail: function () {
        that.setData({
          message: {
            enable: true,
            type: "error",
            text: "复制失败",
            delay: 2000,
          }
        })
      },
    });
  },

  // 下载图片
  downloadImage() {
    let that = this;
    that.setData({
      message: {
        enable: true,
        type: "info",
        text: "正在保存图片…",
        delay: 1000,
      }
    })
    console.log('download_image_url', this.data.imageInAction);
    wx.downloadFile({
      url: this.data.imageInAction,
      type: 'image',
      success: (resp) => {
        wx.saveImageToPhotosAlbum({
          filePath: resp.tempFilePath,
          success: (resp) => {
            that.setData({
              message: {
                enable: true,
                type: "success",
                text: "图片保存成功",
                delay: 1000,
              }
            })
          },
          fail: (resp) => {
            console.log('fail', resp);
          },
          complete: (resp) => {
            console.log('complete', resp);
            that.setData({
              showActionSheet: false,
            });
            that.data.imageInAction = ''
          },
        });
      },

      fail: (resp) => {
        console.log('fail', resp);
      },
    });


  },

  // 删除图片
  deleteImage() {
    var tmp = this.data.imageInAction;
    let imageUrl = decodeURIComponent(tmp);
    var m = imageUrl.match(/^https:\/\/[^\/]+\/([^#?]+)/);
    var Key = m && m[1] || '';
    if (Key) {
      this.setData({
        showActionSheet: false,
        message: {
          enable: true,
          type: "info",
          text: "正在删除图片…",
          delay: 1000,
        },
      });
      this.data.imageInAction = ''
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
          this.setData({
            message: {
              enable: true,
              type: "success",
              text: "图片删除成功",
              delay: 1000,
            }
          })
        } else {
          this.setData({
            message: {
              enable: true,
              type: "error",
              text: "图片删除失败",
              delay: 2000,
            }
          })
        }
      });
    }
  },

  // 隐藏动作列表
  hideActionSheet() {
    this.data.imageInAction = ''
    this.setData({
      showActionSheet: false,
    });
  },

  // 自定义导航栏返回按钮
  tapBackButton() {
    this.setData({
      dialog: {
        enable: true,
        type: "back",
        title: "返回首页",
        message: "真的要回去吗？"
      }
    })
  },

  // 返回对话框
  confirm(e) {
    if (e.detail.item.text == "取消") {
      this.data.dialog.enable = !this.data.dialog.enable
      this.setData({
        dialog: this.data.dialog.enable
      })
    }
    else if (e.detail.item.text == "确认") {
      if (this.data.dialog.type == "back") {
        wx.disableAlertBeforeUnload()
        wx.navigateBack({
          delta: 1,
        })
      } else if (this.data.dialog.type == "delete") {
        this.data.dialog.enable = !this.data.dialog.enable
        this.setData({
          dialog: this.data.dialog.enable
        })
        this.deleteImage()
        this.data.imageInAction = ''
      }
    }
  },

  // 文件夹选择
  bindPickerChange: function (e) {
    console.log('picker发送选择改变，当前文件夹为', this.data.folder[e.detail.value])
    this.setData({
      selectFolder: e.detail.value,
      layoutList: [],
      albumList: [],
    })
    var that = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = that.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      that.setData({
        'albumList': list
      });
      that.renderAlbumList();
    });
  },

  // 深度遍历开关
  checkboxChange: function (e) {
    console.log('checkbox发送选择改变，当前深度遍历为', e.detail.value != '' ? '开启' : '关闭')
    this.data.deeper = e.detail.value != 'deepFold' ? false : true;

    this.setData({
      layoutList: [],
      albumList: [],
    })
    var that = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = that.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      that.setData({
        'albumList': list
      });
      that.renderAlbumList();
    });
  },

  // 下一页按钮
  nextPage() {
    console.log(this.data.marker)
    this.setData({
      layoutList: [],
      albumList: [],
    })
    var that = this;
    this.renderAlbumList();
    this.getAlbumList(function (list) {
      list = that.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      that.setData({
        'albumList': list
      });
      that.renderAlbumList();
    }, that.data.marker);
  },

  rightToDelete() {
    this.setData({
      Actions: [
        { text: '返回顶部', value: 1 },
        { text: '复制图片链接', value: 2 },
        { text: '保存到本地', value: 3 },
        { text: '宁就是管理员？', type: 'warn', value: 4 }
      ],
      message: {
        enable: true,
        type: "error",
        text: "?",
        delay: 1500,
      }
    })
  }

});