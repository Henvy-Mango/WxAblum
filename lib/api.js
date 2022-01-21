const COS = require('./cos-wx-sdk-v5');
const config = require('../config');

function getSign() {
  return new COS({
    getAuthorization(arg, callback) {
      wx.request({
        method: 'GET',
        url: config.stsUrl, // 服务端签名，参考 server 目录下的两个签名例子
        dataType: 'json',
        success: function (result) {
          var data = result.data;
          callback({
            TmpSecretId: data.credentials && data.credentials.tmpSecretId,
            TmpSecretKey: data.credentials && data.credentials.tmpSecretKey,
            XCosSecurityToken: data.credentials && data.credentials.sessionToken,
            ExpiredTime: data.expiredTime,
          });
        }
      });
    },
  })
}

function getMenu() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.menuUrl,
      method: 'GET',
      success(res) {
        console.info(res)
        resolve(res)
      },
      fail(res) {
        console.error(res)
        reject(res)
      }
    })
  })
}

module.exports = {
  getSign,
  getMenu
}