// Date格式化时间
function formatTime(date, fmt = 'yyyy-MM-dd') {
    Date.prototype.format = function (format) {
        var o = {
            'M+': this.getMonth() + 1, //month
            'd+': this.getDate(), //day
            'h+': this.getHours(), //hour
            'm+': this.getMinutes(), //minute
            's+': this.getSeconds(), //second
            'q+': Math.floor((this.getMonth() + 3) / 3), //quarter
            'S': this.getMilliseconds(), //millisecond
        };
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
            (this.getFullYear() + '').substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp('(' + k + ')').test(format))
                format = format.replace(RegExp.$1,
                    RegExp.$1.length == 1 ? o[k] :
                    ('00' + o[k]).substr(('' + o[k]).length));
        return format;
    };
    return date.format(fmt);
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
                        type: 'next',
                    };
                } else if (col == 2) {
                    matrix[row + 1] = [{
                        type: 'next',
                    }, 0, 0];
                }
            } else if (truncated == 0) { //图片列表是否截断
                if (col == 0 || col == 1) {
                    matrix[row][col + 1] = {
                        type: 'done',
                    };
                } else if (col == 2) {
                    matrix[row + 1] = [{
                        type: 'done',
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
    return qSort(left).concat([pivot], qSort(right));
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

module.exports = {
    listToMatrix,
    getRandFileName,
    camSafeUrlEncode,
    qSort,
    formatTime,
};