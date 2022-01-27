import {
  getSign
} from "./lib/api";

App({
  globalData: {
    cos: null
  },
  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  onLaunch: function () {
    this.globalData.cos = getSign();
    wx.cloud.init()
    console.log(wx.getSystemInfoSync())
  }
})