const config = require('../../config');
const util = require('../../lib/util');
const app = getApp();
const cos = app.globalData.cos;

import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify';
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

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

    // 下一页标记，已读取的文件数
    marker: 0,

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
    // 启用返回提醒
    wx.enableAlertBeforeUnload()

    // 获取文件夹信息
    this.getAlbumDir();
  },

  onShow() {
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

    var {
      toolBar
    } = this.data

    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: "",
      Delimiter: "/",
    }, (err, data) => {
      if (data) {
        let list = data.CommonPrefixes.map(item => item.Prefix).filter(item => /^(?!.*CDN).*$/.test(item))
        toolBar.folder = ['/'].concat(list)
        that.setData({
          toolBar
        })
      }
    })
  },

  // 获取相册列表
  getAlbumList(callback, markerArg = "") {
    let that = this;

    var {
      toolBar,
      marker
    } = this.data

    this.setData({
      loading: this.loadingMessage(true, "加载中")
    })
    var prefix = toolBar.folder[toolBar.selectFolder];
    if (prefix == '/')
      prefix = config.Prefix
    var delimiter = toolBar.deeper ? config.Delimiter : '/';

    cos.getBucket({
      Bucket: config.Bucket,
      Region: config.Region,
      Prefix: prefix,
      Marker: markerArg,
      Delimiter: delimiter,
      MaxKeys: 100,
    }, (err, data) => {
      if (data) {
        console.log(data)
        if (data.IsTruncated == "true") {
          marker = data.NextMarker
        } else {
          marker = 0
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
    var {
      albumList,
      layoutColumnSize,
      marker
    } = this.data

    let layoutList = [];
    var imageList = [].concat(albumList);

    imageList.unshift({
      type: 'add'
    });

    layoutList = util.listToMatrix(imageList, layoutColumnSize, marker);

    this.setData({
      layoutList,
    });
  },

  goToUpload() {
    wx.navigateTo({
      url: './uploader/uploader',
    })
  },

  // 进入预览模式
  enterPreviewMode(event) {
    var {
      albumList,
      Actions,
      preview,
      showActionSheet
    } = this.data

    if (showActionSheet) {
      return;
    }
    let imageUrl = event.target.dataset.src;
    let previewIndex = albumList.indexOf(imageUrl);
    Actions.shift()
    preview.slideDuration = 0
    this.setData({
      preview,
      Actions
    });

    preview.previewMode = true
    preview.previewIndex = previewIndex
    setTimeout(() => {
      this.setData({
        preview
      });
      setTimeout(() => {
        preview.slideDuration = 400
        this.setData({
          preview
        });
      }, 400);
    });
  },

  // 退出预览模式
  leavePreviewMode() {
    var {
      Actions,
      preview
    } = this.data

    preview.previewMode = false
    preview.previewIndex = 0

    Actions.unshift({
      name: '返回顶部',
      value: 1
    })

    this.setData({
      preview,
      Actions
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
    let select = e.detail.value
    if (select == 1) {
      this.goTop()
    } else if (select == 2) {
      this.copyLink()
    } else if (select == 3) {
      this.downloadImage()
    } else if (select == 4) {
      let url = this.data.imageInAction
      Dialog.confirm({
          title: '确定删除'
        })
        .then(() => {
          this.deleteImage(url)
        })
        .catch(() => {});
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
  deleteImage(imageInAction) {
    let that = this;

    var {
      albumList
    } = this.data

    let imageUrl = decodeURIComponent(imageInAction);
    var m = imageUrl.match(/^https:\/\/[^\/]+\/([^#?]+)/);
    var Key = m && m[1] || '';
    if (Key) {
      this.notifyMessage('primary', '正在删除图片', 1000)

      cos.deleteObject({
        Bucket: config.Bucket,
        Region: config.Region,
        Key: Key,
      }, (err, data) => {
        if (data) {
          console.log(data)
          let index = albumList.indexOf(imageInAction);
          if (~index) {
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

  // 开启管理员模式
  rightOfDelete(e) {
    var {
      Actions
    } = this.data

    if (Actions.length == 3) {
      console.log("开启管理员模式！")
      Actions.push({
        name: '删除图片',
        color: '#ee0a24',
        value: 4
      })
      this.setData({
        Actions
      })
    } else {
      console.log("重复开启管理员模式！")
    }
  },

  // 文件夹选择
  bindPickerChange(e) {
    var {
      toolBar
    } = this.data
    console.log('picker发送选择改变，当前文件夹为', toolBar.folder[e.detail.value])
    toolBar.selectFolder = e.detail.value;
    this.setData({
      toolBar
    })
    this.render()
  },

  // 深度遍历开关
  checkboxChange(e) {
    var {
      toolBar
    } = this.data
    console.log('checkbox发送选择改变，当前深度遍历为', e.detail ? '开启' : '关闭')
    toolBar.deeper = e.detail;
    this.setData({
      toolBar
    })
    this.render()
  },

  // 下一页按钮
  nextPage() {
    var {
      marker
    } = this.data
    console.log(`marker值为${marker}`)
    this.render(marker)
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