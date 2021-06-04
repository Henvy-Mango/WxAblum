const config = require('../../config');
const util = require('../../lib/util');
const app = getApp();
var cos = app.globalData.cos;

import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';

Page({
  data: {
    // 图片原始列表
    albumList: [],

    toolBar: {
      // 文件夹选择器
      folder: ['/'],
      selectFolder: 0,

      // 深度遍历
      deeper: false,
    },

    // 加载框
    loading: {
      enable: false,
      text: "加载中",
      progress: null
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
    Actions: [{
        name: '返回顶部',
        value: 1
      },
      {
        name: '复制图片链接',
        value: 2
      },
      {
        name: '保存到本地',
        value: 3
      }
    ],

    // 当前操作的图片
    imageInAction: '',

    preview: {
      // 图片预览模式
      previewMode: false,

      // 当前预览索引
      previewIndex: 0,

      // 切换动画的时间
      slideDuration: 400,
    }
  },

  onLoad() {
    wx.enableAlertBeforeUnload()
    this.render();
  },

  goBackPage(e) {
    wx.navigateBack({
      delta: 1,
    })
  },

  render(marker = "") {
    this.setData({
      layoutList: [],
      albumList: []
    })

    this.getAlbumDir();
    // 初始化布局
    this.renderAlbumList();

    let that = this;
    this.getAlbumList((list) => {
      list = that.data.albumList.concat(list || {});
      if (!list.length) {
        list = [];
      }
      list = list.reverse();
      that.setData({
        'albumList': list
      });
      that.renderAlbumList();
    }, marker);
  },

  // 获取文件夹
  getAlbumDir() {
    let that = this;
    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: "",
      Delimiter: "/",
    }, (err, data) => {
      if (data) {
        let list = data.CommonPrefixes.map(item => item.Prefix).filter(item => /^(?!.*CDN).*$/.test(item))
        that.data.toolBar.folder = ['/'].concat(list)
        that.setData({
          toolBar: that.data.toolBar
        })
      }
    })
  },

  // 获取相册列表
  getAlbumList(callback, marker = "") {
    let that = this;
    this.setData({
      loading: this.loadingMessage(true, "加载中")
    })
    var prefix = this.data.toolBar.folder[this.data.toolBar.selectFolder];
    if (prefix == '/')
      prefix = config.Prefix
    var delimiter = this.data.toolBar.deeper ? config.Delimiter : '/';

    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: prefix,
      Marker: marker,
      Delimiter: delimiter,
      MaxKeys: 100,
    }, (err, data) => {
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
        callback(list);
      } else {
        callback([]);
      }
      that.setData({
        loading: this.loadingMessage(false, "加载中")
      })
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
      that.notifyMessage('primary', '正在上传图片', 2000)
      that.setData({
        loading: this.loadingMessage(true, "上传中"),
        upload: res.tempFilePaths.map(item => {
          return {
            path: item,
            canvasWidth: 0,
            canvasHeight: 0,
          }
        })
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
              }, (err, data) => {
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
      loading: this.loadingMessage(false, "上传中"),
    }))
  },

  // 计算图片缩小后的尺寸
  getCanvasDetail(tempFilePaths, index) {
    var that = this;
    return new Promise((resolve, reject) => {
      //-----返回选定照片的本地文件路径列表，获取照片信息-----------
      wx.getImageInfo({
        src: tempFilePaths,
        success: (res) => {
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
        fail: (res) => {
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
        .fields({
          node: true,
          size: true
        })
        .exec(async (item) => {
          const width = item[0].width
          const height = item[0].height

          const canvas = item[0].node
          const ctx = canvas.getContext('2d')

          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = width * dpr
          canvas.height = height * dpr
          ctx.scale(dpr, dpr)

          const image = canvas.createImage(); //创建image       
          image.src = res.path; //指定路径为getImageInfo的文件
          image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height) //图片加载完成时draw
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
    if (this.data.showActionSheet) {
      return;
    }
    let imageUrl = event.target.dataset.src;
    let previewIndex = this.data.albumList.indexOf(imageUrl);
    this.data.Actions.shift()
    this.setData({
      slideDuration: 0,
      Actions: this.data.Actions
    });
    this.data.preview.previewMode = true
    this.data.preview.previewIndex = previewIndex
    setTimeout(() => {
      this.setData({
        preview: this.data.preview
      });
      setTimeout(() => {
        this.setData({
          slideDuration: 400
        });
      }, 400);
    });
  },

  // 退出预览模式
  leavePreviewMode() {
    this.data.preview.previewMode = false
    this.data.preview.previewIndex = 0

    this.data.Actions.unshift({
      name: '返回顶部',
      value: 1
    })

    this.setData({
      preview: this.data.preview,
      Actions: this.data.Actions
    })
  },

  // 显示可操作命令
  showActions(event) {
    this.setData({
      showActionSheet: true,
    });
    this.data.imageInAction = event.target.dataset.src
  },

  // 动作列表选择
  selectActionSheet(e) {
    let tmp = e.detail.value
    if (tmp == 1) {
      this.goTop()
    } else if (tmp == 2) {
      this.copyLink()
    } else if (tmp == 3) {
      this.downloadImage()
    } else if (tmp == 4) {
      this.deleteImage()
    }
  },

  // 隐藏动作列表
  hideActionSheet() {
    this.data.imageInAction = ''
    this.setData({
      showActionSheet: false,
    });
  },

  // 返回顶部按钮
  goTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 500
    })
    this.hideActionSheet()
  },

  // 拷贝图片链接
  copyLink() {
    let url = decodeURIComponent(this.data.imageInAction);
    url = "https://img.naomi.pub/" + url.substring(url.lastIndexOf('/') + 1, url.length);
    console.log('copy_image_url', url);

    wx.setClipboardData({
      data: url,
      success: () => {
        this.notifyMessage('success', '复制成功')
      },
      fail: () => {
        this.notifyMessage('fail', '复制失败')
      },
    });
  },

  // 下载图片
  downloadImage() {
    this.notifyMessage('primary', '正在保存图片')
    console.log('download_image_url', this.data.imageInAction);
    wx.downloadFile({
      url: this.data.imageInAction,
      type: 'image',
      success: (resp) => {
        wx.saveImageToPhotosAlbum({
          filePath: resp.tempFilePath,
          success: (resp) => {
            this.notifyMessage('success', '图片保存成功')
          },
          fail: (resp) => {
            console.log('fail', resp);
          },
          complete: (resp) => {
            this.hideActionSheet()
          },
        });
      },

      fail: (resp) => {
        console.log('fail', resp);
      },
    })
  },

  // 删除图片
  deleteImage() {
    let that = this;
    var tmp = this.data.imageInAction;
    let imageUrl = decodeURIComponent(tmp);
    var m = imageUrl.match(/^https:\/\/[^\/]+\/([^#?]+)/);
    var Key = m && m[1] || '';
    if (Key) {
      this.notifyMessage('primary', '正在删除图片', 1000)
      this.data.imageInAction = ''

      cos.deleteObject({
        Bucket: config.Bucket,
        Region: config.Region,
        Key: Key,
      }, (err, data) => {
        if (data) {
          console.log(data)
          let index = that.data.albumList.indexOf(tmp);
          if (~index) {
            let albumList = that.data.albumList;
            albumList.splice(index, 1);
            that.setData({
              albumList
            });
            that.renderAlbumList();
          }
          this.notifyMessage('success', '图片删除成功')
        } else {
          this.notifyMessage('fail', '图片删除失败')
        }
      });
    }
  },

  // 文件夹选择
  bindPickerChange(e) {
    console.log('picker发送选择改变，当前文件夹为', this.data.toolBar.folder[e.detail.value])
    this.data.toolBar.deeper = e.detail;
    this.setData({
      toolBar: this.data.toolBar
    })
    this.render()
  },

  // 深度遍历开关
  checkboxChange(e) {
    console.log('checkbox发送选择改变，当前深度遍历为', e.detail ? '开启' : '关闭')
    this.data.toolBar.deeper = e.detail;
    this.setData({
      toolBar: this.data.toolBar
    })
    this.render()
  },

  // 下一页按钮
  nextPage() {
    console.log(this.data.marker)
    this.render(this.data.marker)
  },

  notifyMessage(type, text, duration = 3000) {
    Notify({
      type: type,
      duration: duration,
      message: text,
      safeAreaInsetTop: true
    });
  },

  loadingMessage(status, text, progress = null) {
    return {
      enable: status,
      text: text,
      progress: progress
    }
  }
});