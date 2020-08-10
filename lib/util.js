module.exports = {

    // 一维数组转二维数组
    listToMatrix(list, elementsPerSubArray, truncated) {
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
                } else if (truncated == 0) {    //图片列表是否截断
                    if (col == 0 || col == 1) {
                        matrix[row][col + 1] = {
                            type: 'done'
                        };
                    }
                }
            }
        }
        return matrix;
    },

    // 选中文件之后，计算一个随机的短文件名
    getRandFileName: function (filePath) {
        var extIndex = filePath.lastIndexOf('.');
        var extName = extIndex === -1 ? '' : filePath.substr(extIndex);
        return parseInt('' + Date.now() + Math.floor(Math.random() * 900 + 100), 10).toString(36) + extName;
    },

    // 对更多字符编码的 url encode 格式
    camSafeUrlEncode: function (str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
    },

    //图片安全审查
    checkSafePic: function (tempFilePaths) {
        return new Promise(function (resolve, reject) {
            // 文件管理器读取路径文件流
            wx.getFileSystemManager().readFile({
                filePath: tempFilePaths,
                success: buffer => {
                    //云函数调用
                    wx.cloud.callFunction({
                        name: 'imgcheck',
                        data: {
                            value: buffer.data
                        },
                        success(json) {
                            console.log(json)
                            if (json.result.errCode == 87014) {
                                console.log("图片违法违规")
                                resolve(false)
                            } else {
                                resolve(true)
                            }
                        },
                        fail(res) {
                            console.log(res)
                            reject(res)
                        }
                    })
                }
            })
        })
    },

}
