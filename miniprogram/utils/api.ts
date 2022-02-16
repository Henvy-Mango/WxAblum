import COS from '../lib/cos-wx-sdk-v5.min';
import config from '../config';

const { stsUrl, menuUrl, Bucket, Region } = config;

interface signType {
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
  };
  expiredTime: string;
}

export const getSign = () => {
  return new COS({
    getAuthorization(options, callback) {
      // 异步获取签名
      wx.request<signType>({
        url: stsUrl, // 步骤二提供的签名接口
        data: {
          Method: options.Method,
          Key: options.Key,
        },
        dataType: 'json',
        success: (result) => {
          const data = result.data;
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
};

interface menuType {
  img: string;
  msg: string;
  date: Date;
}

export const getMenu = () => {
  return new Promise((resolve, reject) => {
    wx.request<menuType>({
      url: menuUrl,
      method: 'GET',
      success: (res) => {
        console.info(res);
        resolve(res);
      },
      fail: (res) => {
        console.error(res);
        reject(res);
      },
    });
  });
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
      (err, data) => {
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
      (err, data) => {
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
      (err, data) => {
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
      (err, data) => {
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
