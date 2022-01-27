import {
  formatTime,
} from '../../lib/util';

import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

import {
  getMenu,
} from '../../lib/api';

// 页面目前需要从服务端获取的数据：公告栏内容tip
Page({
  data: {
    // 页面跳转按钮列表
    navigationList: [{
      id: 1,
      name: '上传图片',
      bindEvent: 'uploadImg',
    }],
    navigateHeight: 100, // 单位:rpx
  },

  onLoad: function () {
    var that = this;
    that.getTip();
  },

  // 开启图片预览
  ClickImg: function () {
    wx.previewImage({
      urls: [this.data.tip.img],
    });
  },

  // 获取公告
  getTip: function () {
    var that = this;
    getMenu().then((res) => {
      var {
        navigationList,
      } = this.data;
      var {
        album,
        announcement,
      } = res.data;
      var tip = {
        img: announcement.photoUrl,
        msg: announcement.message,
        date: formatTime(new Date(res.header['Last-Modified'])),
      };
      if (album.enable) {
        navigationList.push({
          id: navigationList.length + 1,
          name: album.bindName != '' ? album.bindName : '云相册',
          bindEvent: album.bindEvent != '' ? album.bindEvent : 'goToAlbum',
        });
      }
      that.setData({
        tip,
        navigationList,
      });
    });
  },

  // 点击跳转按钮时执行的动画
  touchAminate(id) {
    var that = this;
    that.animate('#id' + id, [{
        opacity: 1.0,
        backgroundColor: '#ffffff',
      },
      {
        opacity: 0.8,
        backgroundColor: '#cacaca',
      },
      {
        opacity: 1.0,
        backgroundColor: '#ffffff',
      },
    ], 50, function () {
      that.clearAnimation('#id' + id, {
        opacity: true,
      });
    });
  },

  // 上传图片
  uploadImg(e) {
    var that = this;
    that.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(function () {
      // 上传图片
      wx.navigateTo({
        url: '../album/uploader/uploader',
      });
    }, 50);
  },

  // 上传视频
  uploadVedio(e) {
    var that = this;
    that.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(function () {
      // 上传视频
      wx.navigateTo({
        url: '../album/uploader/uploader',
      });
    }, 50);
  },

  // 前往相册页
  goToAlbum(e) {
    var that = this;
    that.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(function () {
      wx.navigateTo({
        url: '../album/album',
      });
    }, 50);
  },

  // 查看作者
  author() {
    setTimeout(function () {
      // 弹窗
      Dialog.alert({
        title: 'Naomi在这',
        message: 'CDN流量只有5GB，\n请不要当网盘使用qwq',
      }).then(() => {
        // on close
      });
    }, 50);
  },
});