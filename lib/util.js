const config = require('../config');
const api = require('./api');
const app = getApp();

// 获取当前系统时间
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
  
    return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
  }

  const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : `0${n}`
  }

// 一维数组转二维数组
function listToMatrix(list, elementsPerSubArray, truncated) {
    let matrix = [],
        i, col, row;
    for (i = 0, row = -1; i < list.length; i += 1) {
        col = i % elementsPerSubArray;
        row = Math.floor(i / elementsPerSubArray);
        if (!matrix[row])
            matrix[row] = [0, 0, 0];
        matrix[row][col] = list[i];
        if (i == list.length - 1) {
            if (truncated != 0) {
                if (col == 0 || col == 1) {
                    matrix[row][col + 1] = {
                        type: 'next'
                    };
                } else if (col == 2) {
                    matrix[row + 1] = [{
                        type: 'next'
                    }, 0, 0];
                }
            } else if (truncated == 0) { //图片列表是否截断
                if (col == 0 || col == 1) {
                    matrix[row][col + 1] = {
                        type: 'done'
                    };
                } else if (col == 2) {
                    matrix[row + 1] = [{
                        type: 'done'
                    }, 0, 0];
                }
            }
        }
    }
    return matrix;
}

// 快速排序，时间降序排列
function qSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    var pivotIndex = Math.floor(arr.length / 2);
    var pivot = arr.splice(pivotIndex, 1)[0];
    var left = [];
    var right = [];
    for (var i = 0; i < arr.length; i++) {
        if (new Date(arr[i].LastModified).getTime() < new Date(pivot.LastModified).getTime()) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    return this.qSort(left).concat([pivot], this.qSort(right));
}

// 选中文件之后，计算一个随机的短文件名
function getRandFileName(filePath) {
    var extIndex = filePath.lastIndexOf('.');
    var extName = extIndex === -1 ? '' : filePath.substr(extIndex);
    return parseInt('' + Date.now() + Math.floor(Math.random() * 900 + 100), 10).toString(36) + extName;
}

// 对更多字符编码的 url encode 格式
function camSafeUrlEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

//图片安全审查
function checkSafePic(tempFilePaths) {
    return new Promise((resolve, reject) => {
        // 文件管理器读取路径文件流
        wx.getFileSystemManager().readFile({
            filePath: tempFilePaths,
            success: buffer => {
                console.log(buffer.data.byteLength)
                //云函数调用
                wx.cloud.callFunction({
                    name: 'imgcheck',
                    data: {
                        value: buffer.data
                    },
                    success: (json) => {
                        console.log(json)
                        if (json.result.errCode == 87014) {
                            console.log("图片违法违规")
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                    },
                    fail: (res) => {
                        console.log(res)
                        reject(res)
                    }
                })
            }
        })
    })
}

module.exports = {
    listToMatrix,
    checkSafePic,
    getRandFileName,
    camSafeUrlEncode,
    qSort,
    formatTime,
    formatNumber,
}