import { formatTime } from '../../utils/tool';
import { getMenu } from '../../utils/api';

import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

// 页面目前需要从服务端获取的数据：公告栏内容tip
Page({
  data: {
    tip: {
      img: '',
      msg: '',
      date: '',
    },
    // 页面跳转按钮列表
    navigationList: [
      {
        id: 1,
        name: '上传图片',
        bindEvent: 'uploadImg',
      },
    ],
    navigateHeight: 100, // 单位:rpx
  },

  onLoad: function () {
    this.getTip();
  },

  // 开启图片预览
  ClickImg: function () {
    wx.previewImage({
      urls: [this.data.tip.img],
    });
  },

  // 获取公告
  getTip: function () {
    const self = this;
    getMenu().then((res: any) => {
      const { navigationList } = self.data;
      const { album, announcement } = res.data;
      const tip = {
        img: announcement.photoUrl,
        msg: announcement.message,
        date: formatTime(new Date(res.header['Last-Modified'])),
      };
      if (album.enable) {
        navigationList.push({
          id: navigationList.length + 1,
          name: album.bindName !== '' ? album.bindName : '云相册',
          bindEvent: album.bindEvent !== '' ? album.bindEvent : 'goToAlbum',
        });
      }
      self.setData({
        tip,
        navigationList,
      });
    });
  },

  // 点击跳转按钮时执行的动画
  touchAminate(id: string) {
    const self = this;
    self.animate(
      '#id' + id,
      [
        {
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
      ],
      50,
      () => {
        self.clearAnimation('#id' + id, {
          opacity: true,
        });
      },
    );
  },

  // 上传图片
  uploadImg(e: WechatMiniprogram.BaseEvent) {
    const self = this;
    self.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(() => {
      // 上传图片
      wx.navigateTo({
        url: '../album/uploader/uploader',
      });
    }, 50);
  },

  // 上传视频
  uploadVedio(e: WechatMiniprogram.BaseEvent) {
    const self = this;
    self.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(() => {
      // 上传视频
      wx.navigateTo({
        url: '../album/uploader/uploader',
      });
    }, 50);
  },

  // 前往相册页
  goToAlbum(e: WechatMiniprogram.BaseEvent) {
    const self = this;
    self.touchAminate(e.currentTarget.dataset.item.id);
    setTimeout(() => {
      wx.navigateTo({
        url: '../album/album',
      });
    }, 50);
  },

  // 查看作者
  author() {
    setTimeout(() => {
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
