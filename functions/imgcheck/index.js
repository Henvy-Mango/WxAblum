const cloud = require('wx-server-sdk');
cloud.init();
exports.main = async (event) => {
  console.log(event.txt);
  const { value } = event;
  try {
    let imageR = false;
    // 检查图片内容是否违规
    if (value) {
      imageR = await cloud.openapi.security.imgSecCheck({
        media: {
          contentType: 'image/png',
          value: Buffer.from(value),
        },
      });
    }
    // 图片检查返回值
    return imageR;
  } catch (err) {
    // 错误处理
    return err;
  }
};
