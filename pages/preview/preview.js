Page({
  data: {
    type: 'image',
    url: ''
  },
  onShareAppMessage: function (res) {
    var typeMap = {
      image: '图片',
      video: '视频',
    };
    var data = {
      title: 'Naomi 相册' + (typeMap[this.data.type] || '文件'),
      path: this.route + '?type=' + this.data.type + '&url=' + encodeURIComponent(this.data.url),
    };
    if (this.data.type === 'image') {
      data.imageUrl = this.data.url + '!preview';
    }
    return data;
  },

  onLoad() {
    this.setData({
      type: this.options.type || 'image',
      url: decodeURIComponent(this.options.url) || '',
    });
  },

  copyLink() {
    var tmp = decodeURIComponent(this.data.url);
    tmp = "https://img.naomi.pub/" + tmp.substring(tmp.lastIndexOf('/') + 1, tmp.length)

    wx.setClipboardData({ data: tmp });
  },

  saveImage() {
    wx.downloadFile({
      url: this.data.url,
      success: function (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
          });
        }
      }
    });
  },
});