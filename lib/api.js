import COS from './cos-wx-sdk-v5';
import config from '../config';

const { stsUrl, menuUrl, Bucket, Region } = config;

export function getSign() {
  return new COS({
    getAuthorization(arg, callback) {
      wx.request({
        method: 'GET',
        url: stsUrl, // 服务端签名，参考 server 目录下的两个签名例子
        dataType: 'json',
        success: function (result) {
          let data = result.data;
          callback({
            TmpSecretId: data.credentials && data.credentials.tmpSecretId,
            TmpSecretKey: data.credentials && data.credentials.tmpSecretKey,
            XCosSecurityToken: data.credentials && data.credentials.sessionToken,
            ExpiredTime: data.expiredTime,
          });
        },
      });
    },
  });
}

export function getMenu() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: menuUrl,
      method: 'GET',
      success(res) {
        console.info(res);
        resolve(res);
      },
      fail(res) {
        console.error(res);
        reject(res);
      },
    });
  });
}

export function getDir(regularExpression) {
  return new Promise((resolve, reject) => {
    const cos = getApp().globalData.cos;
    cos.getBucket(
      {
        Bucket,
        Region,
        Prefix: '',
        Delimiter: '/',
      },
      (err, data) => {
        if (data) {
          let list = data.CommonPrefixes.map((item) => item.Prefix).filter((item) => regularExpression.test(item));
          resolve(list);
        }
        if (err) {
          reject(err);
        }
      }
    );
  });
}

export function getBucket(Prefix, Marker, Delimiter) {
  const cos = getApp().globalData.cos;
  return new Promise((resolve, reject) => {
    cos.getBucket(
      {
        Bucket,
        Region,
        Prefix,
        Marker,
        Delimiter,
        MaxKeys: 100,
      },
      (err, data) => {
        if (data) {
          console.log(data);
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      }
    );
  });
}

export function uploadPic(Key, FilePath) {
  return new Promise((resolve, reject) => {
    const cos = getApp().globalData.cos;
    cos.postObject(
      {
        Bucket,
        Region,
        Key,
        FilePath,
      },
      (err, data) => {
        if (data) {
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      }
    );
  });
}

export function deletePic(Key) {
  return new Promise((resolve, reject) => {
    const cos = getApp().globalData.cos;
    console.log('delete pic', Key);
    cos.deleteObject(
      {
        Bucket,
        Region,
        Key,
      },
      (err, data) => {
        if (data) {
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      }
    );
  });
}

// 图片安全审查
export function checkSafePic(tempFilePaths) {
  return new Promise((resolve, reject) => {
    // 文件管理器读取路径文件流
    wx.getFileSystemManager().readFile({
      filePath: tempFilePaths,
      success: (buffer) => {
        console.log(`${(buffer.data.byteLength / 1024).toFixed(3)}KB`);
        // 云函数调用
        wx.cloud.callFunction({
          name: 'imgcheck',
          data: {
            value: buffer.data,
          },
          success: (json) => {
            console.log(json);
            if (json.result.errCode === 87014) {
              console.log('图片违法违规');
              resolve(false);
            } else {
              resolve(true);
            }
          },
          fail: (res) => {
            console.log(res);
            reject(res);
          },
        });
      },
    });
  });
}
