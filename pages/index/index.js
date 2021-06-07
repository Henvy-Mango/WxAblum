const util = require("../../lib/util");
const {
  getMenu
} = require('../../lib/api');

Page({
  data: {},
  onLoad: function () {
    getMenu()
  },

  // 前往相册页
  gotoAlbum() {
    wx.navigateTo({
      url: '../album/album'
    });
  },

})