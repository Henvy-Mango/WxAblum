import { getRandFileName } from '../../../lib/util';

import { checkSafePic, uploadPic, getDir } from '../../../lib/api';

import Notify from '../../../miniprogram_npm/@vant/weapp/notify/notify';

Page({
  data: {
    fileList: [],
    canvas: [],

    // 按钮
    loading: false,
    message: '上传',
    flag: false,

    toolBar: {
      // 文件夹选择器
      folder: ['/'],
      selectFolder: 0,
    },
  },

  onLoad() {
    this.getAlbumDir();
  },

  // 获取文件夹
  getAlbumDir() {
    let that = this;

    let { toolBar } = this.data;

    getDir(/^(?!.*CDN).*$/).then((res) => {
      toolBar.folder = ['/'].concat(res);
      that.setData({
        toolBar,
      });
    });
  },

  // 文件夹选择
  bindPickerChange(e) {
    let { toolBar } = this.data;
    console.log('picker发送选择改变，当前文件夹为', toolBar.folder[e.detail.value]);
    toolBar.selectFolder = e.detail.value;
    this.setData({
      toolBar,
    });
  },

  beforeRead(event) {
    const { callback, file } = event.detail;

    let { fileList = [] } = this.data;

    let tmpList = [...fileList, ...file].filter((item) => item.size < 20971520);

    this.notifyMessage('primary', '安全检查中', 2000);

    this.setData({
      canvas: tmpList.map(() => {
        return {
          canvasWidth: 0,
          canvasHeight: 0,
        };
      }),
    });

    // forEach异步问题解决方案，使用map和Promise.all
    const checkTasks = tmpList
      .map((item) => item.url)
      .map((filePath, index) => {
        let extIndex = filePath.lastIndexOf('.');
        let extName = extIndex === -1 ? '' : filePath.substr(extIndex);
        if (/\.(jpg|png|gif|jpeg|pjp|pjpeg|jfif|xbm|tif|svgz|webp|ico|bmp|svg)$/.test(extName)) {
          return this.getCanvasDetail(filePath, index)
            .then((res) => this.getCanvasImg(res))
            .then((res) => checkSafePic(res));
        } else {
          return Promise.resolve(true);
        }
      });

    Promise.all(checkTasks).then(async (res) => {
      // 计数器
      let times = 0;

      await res.forEach((item, index) => {
        if (!item) {
          console.log(`--------第${index + 1}张图片违规--------`);
          times++;
          tmpList[index].status = 'failed';
          tmpList[index].message = '图片违规';
        } else {
          tmpList[index].status = 'done';
        }
      });

      this.setData({
        fileList: tmpList,
      });

      if (times !== 0) this.notifyMessage('warning', `共 ${times} 张图片违规`);
    });

    callback(true);
  },

  afterRead(event) {
    const { file } = event.detail;

    let { fileList = [] } = this.data;

    fileList.push.apply(
      fileList,
      file.map((item) => {
        return {
          url: item.url,
          status: 'uploading', // uploading表示上传中，failed表示上传失败，done表示上传完成
        };
      })
    );
    this.setData({
      fileList,
    });
  },

  deleteImg(event) {
    let index = event.detail.index;
    let { fileList = [] } = this.data;
    fileList.splice(index, 1);
    this.setData({
      fileList,
    });
  },

  overSizeImg(event) {
    let index = event.detail.index;
    this.notifyMessage('warning', `第${index + 1}张体积过大`, 3000);
  },

  uploadList() {
    let { fileList = [], toolBar } = this.data;

    if (fileList.length === 0) {
      this.notifyMessage('warning', '请先添加图片');
      return;
    }

    let banList = fileList.filter((item) => {
      if (item.status === 'uploading') {
        this.notifyMessage('primary', '请等待图片检测');
        return true;
      } else if (item.status === 'failed') {
        this.notifyMessage('warning', '图片违规');
        return true;
      }
      return false;
    });

    if (banList.length !== 0) {
      console.error('违规操作!!！');
      return;
    }

    this.setData({
      loading: true,
    });

    // forEach异步问题解决方案，使用map和Promise.all
    const uploadTasks = fileList
      .filter((item) => item.status === 'done')
      .map((item, index, arr) => {
        arr[index].status = 'uploading';
        this.setData({
          fileList: arr,
        });
        let Key =
          toolBar.selectFolder === 0
            ? getRandFileName(item.url)
            : toolBar.folder[toolBar.selectFolder] + getRandFileName(item.url);
        return uploadPic(Key, item.url).then((res) => {
          if (res.statusCode === 200) {
            arr[index].status = 'done';
          } else {
            arr[index].status = 'failed';
            arr[index].message = '上传失败';
          }
          this.setData({
            fileList: arr,
          });
          return res;
        });
      });

    Promise.all(uploadTasks).then((data) => {
      console.log(data);
      this.setData({
        loading: false,
        message: '上传成功，清空后重新上传',
        flag: true,
      });
      this.notifyMessage('success', '上传成功');
    });
  },

  refreshList() {
    this.setData({
      fileList: [],
      flag: false,
      message: '上传',
    });
  },

  // 计算图片缩小后的尺寸
  getCanvasDetail(tempFilePaths, index) {
    let that = this;
    return new Promise((resolve, reject) => {
      // -----返回选定照片的本地文件路径列表，获取照片信息-----------
      wx.getImageInfo({
        src: tempFilePaths,
        success: (res) => {
          // ---------利用canvas压缩图片--------------
          let ratio = 2;
          let canvasWidth = res.width; // 图片原始长宽
          let canvasHeight = res.height;
          while (canvasWidth > 100 || canvasHeight > 100) {
            // 保证宽高在400以内
            canvasWidth = Math.trunc(res.width / ratio);
            canvasHeight = Math.trunc(res.height / ratio);
            ratio++;
          }
          console.log('图片压缩后大小为' + canvasWidth + 'x' + canvasHeight);

          const { canvas } = that.data;

          canvas[index].canvasWidth = canvasWidth;
          canvas[index].canvasHeight = canvasHeight;
          that.setData({
            canvas,
          });
          resolve({
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            index: index,
            path: tempFilePaths,
          });
        },
        fail: (res) => {
          console.log(res.errMsg);
          reject(res);
        },
      });
    });
  },

  // 使用canvas画布，获取压缩后的图片
  async getCanvasImg(res) {
    // ----------绘制图形并取出图片路径--------------
    const query = wx.createSelectorQuery();
    const canvas = await new Promise((resolve) => {
      query
        .select('#canvas-' + res.index)
        .fields({
          node: true,
          size: true,
        })
        .exec(async (item) => {
          const width = item[0].width;
          const height = item[0].height;

          const canvas = item[0].node;
          const ctx = canvas.getContext('2d');

          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          const image = canvas.createImage(); // 创建image
          image.src = res.path; // 指定路径为getImageInfo的文件
          image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height); // 图片加载完成时draw
            resolve(canvas);
          };
        });
    });

    const tempFilePath = await wx
      .canvasToTempFilePath({
        canvas: canvas,
        quality: 0.5,
        fileType: 'jpg',
        width: canvas.width,
        height: canvas.height,
        destWidth: canvas.width,
        destHeight: canvas.height,
      })
      .then((res) => res.tempFilePath);

    return tempFilePath;
  },

  notifyMessage(type, text, duration = 3000) {
    Notify({
      type: type,
      duration: duration,
      message: text,
      safeAreaInsetTop: false,
    });
  },
});
