import COS from '../lib/cos-wx-sdk-v5.min';
import config from '../config';
import { Api } from '../typings';
import { formatTime } from './tool';

const { stsUrl, menuUrl, Bucket, Region } = config;

export const getSign = () => {
  return new COS({
    getAuthorization(options, callback) {
      // 异步获取签名
      wx.request<Api.signType>({
        url: stsUrl, // 步骤二提供的签名接口
        data: {
          Method: options.Method,
          Key: options.Key,
        },
        dataType: 'json',
        success: (result) => {
          const data = result.data;
          callback({
            TmpSecretId: data.credentials?.tmpSecretId,
            TmpSecretKey: data.credentials?.tmpSecretKey,
            XCosSecurityToken: data.credentials?.sessionToken,
            ExpiredTime: data.expiredTime,
          });
        },
      });
    },
  });
};

export const getMenu = () => {
  return new Promise<{ tip: { img: string; msg: string; date: string }; button: { name: string; bindEvent: string } }>(
    (resolve, reject) => {
      wx.request<Api.menuType>({
        url: menuUrl,
        method: 'GET',
        success: (res) => {
          console.info(res);
          const { album, announcement } = res.data;
          const tip = {
            img: announcement.photoUrl,
            msg: announcement.message,
            date: formatTime(new Date(res.header['Last-Modified'])),
          };
          let button = { name: '', bindEvent: '' };
          if (album.enable) {
            button = {
              name: album.bindName !== '' ? album.bindName : '云相册',
              bindEvent: album.bindEvent !== '' ? album.bindEvent : 'goToAlbum',
            };
          }
          resolve({
            tip,
            button,
          });
        },
        fail: (res) => {
          console.error(res);
          reject(res);
        },
      });
    },
  );
};

export const getDir = (regularExpression: RegExp) => {
  return new Promise((resolve, reject) => {
    const { cos } = getApp().globalData;
    cos.getBucket(
      {
        Bucket,
        Region,
        Prefix: '',
        Delimiter: '/',
      },
      (err: any, data: { CommonPrefixes: any[] }) => {
        if (data) {
          const list = data.CommonPrefixes.map((item) => item.Prefix).filter((item) => regularExpression.test(item));
          resolve(list);
        }
        if (err) {
          reject(err);
        }
      },
    );
  });
};

export const getBucket = (Prefix: string, Marker: string, Delimiter: string) => {
  const { cos } = getApp().globalData;
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
      (err: any, data: any) => {
        if (data) {
          console.log(data);
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      },
    );
  });
};

export const uploadPic = (Key: string, FilePath: string) => {
  return new Promise((resolve, reject) => {
    const { cos } = getApp().globalData;
    cos.postObject(
      {
        Bucket,
        Region,
        Key,
        FilePath,
      },
      (err: any, data: any) => {
        if (data) {
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      },
    );
  });
};

export const deletePic = (Key: string) => {
  return new Promise((resolve, reject) => {
    const { cos } = getApp().globalData;
    console.log('delete pic', Key);
    cos.deleteObject(
      {
        Bucket,
        Region,
        Key,
      },
      (err: any, data: any) => {
        if (data) {
          resolve(data);
        }
        if (err) {
          reject(err);
        }
      },
    );
  });
};

// 图片安全审查
export const checkSafePic = (tempFilePaths: string) => {
  return new Promise((resolve, reject) => {
    // 文件管理器读取路径文件流
    wx.getFileSystemManager().readFile({
      filePath: tempFilePaths,
      success: (buffer) => {
        const tmp = buffer.data as ArrayBuffer;
        console.log(`${(tmp.byteLength / 1024).toFixed(3)}KB`);
        // 云函数调用
        wx.cloud
          .callFunction({
            name: 'imgcheck',
            data: {
              value: tmp,
            },
          })
          .then((res: any) => {
            console.log(res);
            if (res.result.errCode === 87014) {
              console.log('图片违法违规');
              resolve(false);
            } else {
              resolve(true);
            }
          })
          .catch((res) => {
            console.log(res);
            reject(res);
          });
      },
    });
  });
};
