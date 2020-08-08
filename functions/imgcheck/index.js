const cloud = require('wx-server-sdk');
cloud.init();
exports.main = async (event, context) => {
  console.log(event.txt);
  const {
    value,
  } = event;
  try {
    let msgR = false;
    let imageR = false;
    //检查 图片内容是否违规
    if (value) {
      imageR = await cloud.openapi.security.imgSecCheck({
        media: {
          header: {
            'Content-Type': 'application/octet-stream'
          },
          contentType: 'image/png',
          value: Buffer.from(value)
        }
      })
    }
    return {
      imageR //图片检查返回值
    };
  } catch (err) {
    // 错误处理
    return err
  }
}