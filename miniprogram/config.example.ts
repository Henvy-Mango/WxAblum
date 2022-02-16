export default {
  stsUrl: 'https://localhost/server/sts.php', // 必须，server文件夹sts.php地址
  menuUrl: 'https://localhost/server/menu.json', // 必须，server文件夹menu.json地址
  Bucket: '', // 必须，COS存储桶名称
  Region: '', // 必须，COS存储桶地区
  Delimiter: '', // 分隔符，建议保持默认，填写'/'后只查询文件夹
  Prefix: '', // 前缀名，建议保持默认，填写后只查询带前缀的文件
};
