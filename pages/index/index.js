const util = require("../../lib/util");
const config = require("../../config");
const app = getApp();

Page({
  data: {},
  onLoad: function () {},

  // 前往相册页
  gotoAlbum() {
    wx.navigateTo({
      url: '../album/album'
    });
  },

})