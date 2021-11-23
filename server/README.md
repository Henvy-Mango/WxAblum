# 服务器Server配置

server文件夹部署到Web服务器上

> sts.php

必须修改 `sts.php` 中的 `secretId`、`secretKey`、`bucket`、`region` 配置

> menu.json

小程序首页自定义

```json
{
  "announcement": {
    "message": "这里是公告。",	// 公告消息
    "photoUrl": "https://localhost/picture.jpg"	// 公告图片链接
  },
  "album": {
    "enable": true,	// 云相册按钮开关
    "bindName": "",	// 云相册按钮名称
    "bindEvent": ""	// 云相册按钮绑定事件
  }
}
```
