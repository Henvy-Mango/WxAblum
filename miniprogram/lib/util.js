// Date格式化时间
export function formatTime(date, fmt = 'yyyy-MM-dd') {
  let o = {
    'M+': date.getMonth() + 1, // month
    'd+': date.getDate(), // day
    'h+': date.getHours(), // hour
    'm+': date.getMinutes(), // minute
    's+': date.getSeconds(), // second
    'q+': Math.floor((date.getMonth() + 3) / 3), // quarter
    S: date.getMilliseconds(), // millisecond
  };
  let format;
  if (/(y+)/.test(fmt)) format = fmt.replace(RegExp.$1, String(date.getFullYear()).substring(4 - RegExp.$1.length));
  for (let k in o)
    if (new RegExp('(' + k + ')').test(format))
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substring(String(o[k]).length));
  return format;
}

// 一维数组转二维数组
export function listToMatrix(list, elementsPerSubArray, truncated) {
  let matrix = [];
  let i;
  let col;
  let row;
  for (i = 0, row = -1; i < list.length; i += 1) {
    col = i % elementsPerSubArray;
    row = Math.floor(i / elementsPerSubArray);
    if (!matrix[row]) matrix[row] = [0, 0, 0];
    matrix[row][col] = list[i];
    if (i === list.length - 1) {
      if (truncated !== 0) {
        if (col === 0 || col === 1) {
          matrix[row][col + 1] = {
            type: 'next',
          };
        } else if (col === 2) {
          matrix[row + 1] = [
            {
              type: 'next',
            },
            0,
            0,
          ];
        }
      } else if (truncated === 0) {
        // 图片列表是否截断
        if (col === 0 || col === 1) {
          matrix[row][col + 1] = {
            type: 'done',
          };
        } else if (col === 2) {
          matrix[row + 1] = [
            {
              type: 'done',
            },
            0,
            0,
          ];
        }
      }
    }
  }
  return matrix;
}

// 快速排序，时间降序排列
export function qSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  let pivotIndex = Math.floor(arr.length / 2);
  let pivot = arr.splice(pivotIndex, 1)[0];
  let left = [];
  let right = [];
  for (let i = 0; i < arr.length; i++) {
    if (new Date(arr[i].LastModified).getTime() < new Date(pivot.LastModified).getTime()) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  return qSort(left).concat([pivot], qSort(right));
}

// 选中文件之后，计算一个随机的短文件名
export function getRandFileName(filePath) {
  let extIndex = filePath.lastIndexOf('.');
  let extName = extIndex === -1 ? '' : filePath.substr(extIndex);
  return parseInt(String(Date.now()) + Math.floor(Math.random() * 900 + 100), 10).toString(36) + extName;
}

// 对更多字符编码的 url encode 格式
export function camSafeUrlEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}
