const config = require('../../../config');
const util = require('../../../lib/util');
const app = getApp();
const cos = app.globalData.cos;

import Notify from '../../../miniprogram_npm/@vant/weapp/notify/notify';

Page({
  data: {
    fileList: [],
    canvas: [],

    // 按钮
    loading: false,
    message: "上传",
    flag: false,

    toolBar: {
      // 文件夹选择器
      folder: ['/'],
      selectFolder: 0,
    },
  },

  onLoad() {
    this.getAlbumDir()
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
  },

  beforeRead(event) {
    const {
      callback,
      file
    } = event.detail;

    this.notifyMessage('primary', `图片检查中`, 2000)

    var {
      fileList = []
    } = this.data;

    var tmpList = fileList.concat(file)

    this.setData({
      canvas: tmpList.map(item => {
        return {
          canvasWidth: 0,
          canvasHeight: 0,
        }
      })
    })

    // forEach异步问题解决方案，使用map和Promise.all
    const checkTasks = tmpList.map(item => item.url)
      .map((filePath, index) => {
        return this.getCanvasDetail(filePath, index)
          .then(res => this.getCanvasImg(res))
          .then(res => util.checkSafePic(res))
      })

    Promise.all(checkTasks).then(async (res) => {
      // 计数器
      var times = 0

      await res.map((item, index) => {
        if (!item) {
          console.log(`--------第${index+1}张图片违规--------`)
          times++
          tmpList[index].status = 'failed'
          tmpList[index].message = "图片违规"
        } else {
          tmpList[index].status = 'done'
        }
      })

      this.setData({
        fileList: tmpList
      })

      if (times != 0)
        this.notifyMessage('warning', `共 ${times} 张图片违规`)
    })

    callback(true)
  },

  afterRead(event) {
    const {
      file
    } = event.detail;

    var {
      fileList = []
    } = this.data;

    fileList.push.apply(fileList, file.map(item => {
      return {
        url: item.url,
        status: 'uploading' // uploading表示上传中，failed表示上传失败，done表示上传完成
      }
    }))
    this.setData({
      fileList
    });
  },

  deleteImg(event) {
    let index = event.detail.index
    var {
      fileList = []
    } = this.data;
    fileList.splice(index, 1);
    this.setData({
      fileList
    });
  },

  overSizeImg(event) {
    let index = event.detail.index
    this.notifyMessage('warning', `第${index+1}张图片体积过大`, 1000)
  },

  uploadList(event) {
    var {
      fileList = [],
        toolBar
    } = this.data

    if (fileList.length == 0) {
      this.notifyMessage('warning', `请先添加图片`)
      return
    }

    var banList = fileList.filter(item => {
      if (item.status == 'uploading') {
        this.notifyMessage('primary', `请等待图片检测`)
        return true;
      } else if (item.status == 'failed') {
        this.notifyMessage('warning', `图片违规`)
        return true;
      }
    })

    if (banList.length != 0) {
      console.error("违规操作!!！")
      return
    }

    this.setData({
      loading: true
    })

    // forEach异步问题解决方案，使用map和Promise.all
    const uploadTasks = fileList.filter(item => item.status == 'done')
      .map((item, index, arr) => {
        arr[index].status = 'uploading'
        this.setData({
          fileList: arr
        })
        var Key = util.getRandFileName(item.url);
        return new Promise((resolve, reject) => {
          cos.postObject({
            Bucket: config.Bucket,
            Region: config.Region,
            Key: toolBar.selectFolder == 0 ? '' : toolBar.folder[toolBar.selectFolder] + Key,
            FilePath: item.url
          }, (err, data) => {
            if (data.statusCode == 200) {
              arr[index].status = 'done'
            } else {
              arr[index].status = 'failed'
              arr[index].message = '上传失败'
            }
            this.setData({
              fileList: arr
            })
            resolve(data)
          })
        });
      })

    Promise.all(uploadTasks)
      .then((data) => {
        console.log(data)
        this.setData({
          loading: false,
          message: "上传成功，清空后重新上传",
          flag: true
        })
        this.notifyMessage('success', `图片上传成功`)
      })
  },

  refreshList(event) {
    this.setData({
      fileList: [],
      flag: false,
      message: "上传"
    });
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

          const {
            canvas
          } = that.data

          canvas[index].canvasWidth = canvasWidth
          canvas[index].canvasHeight = canvasHeight
          that.setData({
            canvas
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
  async getCanvasImg(res, callback) {
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

    const tempFilePath = await wx.canvasToTempFilePath({
      canvas: canvas,
      quality: 0.8,
    }, that).then(res => {
      console.log(res.tempFilePath)
      return res.tempFilePath
    })

    return tempFilePath
  },

  notifyMessage(type, text, duration = 3000) {
    Notify({
      type: type,
      duration: duration,
      message: text,
      safeAreaInsetTop: false
    });
  },
});