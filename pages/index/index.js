const util = require("../../lib/util");
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

const {
  getMenu
} = require('../../lib/api');

// 页面目前需要从服务端获取的数据：公告栏内容tip
Page({
  data: {
    // show用来控制遮罩层
    show:false,
    // 跳转页面按钮字体颜色
    fontColor: '#515151',
    // 渐变颜色十六进制差值
    DifferenceColor: '220D0B',
    album: null,
    //系统默认设置的公告栏内容
    settingTip: {
      // 不建议修改img属性，若修改则需同步修改wxml文件中的逻辑判断
      img: '',
      info: '欢迎使用本云相册，请不要当网盘使用qwq',
      date: util.formatTime(new Date()),
      color: '9dbdc6',
      fontColor: 'ffffff'
    },
    showtip: 0,//显示公告的类型，默认是图片0,1为文字内容，点击公告栏会发生变化
    // 页面跳转按钮列表
    navigateList: [
      {
        id: 1,
        name: '上传图片',
        img: '',
        bindEvent: 'uploadImg'
      },
      {
        id: 2,
        name: '上传视频',
        img: '',
        bindEvent: 'uploadVedio'
      },
      {
        id: 3,
        name: '打开云相册',
        img: '',
        bindEvent: 'goToAlbum'
      },
    ],
    navigateHeight: 100,// 单位:rpx
    // 底部文字内容
    bottomText: 'Copyright @naomi.All Rights Reserved.'
  },

  onLoad: function () {
    var that = this
    that.getTip()
  },

  // 开启图片预览，显示遮罩层
  ClickImg:function(e){
    var that = this
    // that.setData({
    //   show:true
    // })
    var imgList = []
    imgList.push(that.data.tip.img)
    wx.previewImage({
      urls: imgList,
    })
  },
  // 关闭遮罩层
  // onClickHide:function(){
  //   var that = this
  //   that.setData({
  //     show:false
  //   })
  // },
  // 输入原始颜色十六进制值，返回渐变之后的颜色十六进制值，值差取决于data中的DifferenceColor
  GradualChange(originColor) {
    var that = this
    var oc = parseInt(originColor, 16)
    var Difference = parseInt(that.data.DifferenceColor, 16)
    console.log(oc + '|' + Difference)
    return (oc + Difference).toString(16)
  },

  // 获取announcement,album，并把announcement存放到tip中
  getTip: function () {
    var that = this
    var settingTip = that.data.settingTip
    getMenu().then((res) => {
      var { album, announcement } = res.data
      // 根据解析的announcement内容判断是否使用系统默认的样式设置
      var tip = {
        img: (announcement.photoUrl != null) ? announcement.photoUrl : settingTip.img,
        info: (announcement.message == null || announcement.message == '') ? settingTip.info : announcement.message,
        date: (announcement.date == null || announcement.date == '') ? settingTip.date : announcement.date,
        color: (announcement.color == null || announcement.color == '') ? settingTip.color : announcement.color,
        gradualChangeColor: (announcement.color == null || announcement.color == '') ? that.GradualChange(settingTip.color) : that.GradualChange(announcement.color),
        fontColor: (announcement.fontColor == null || announcement.fontColor == '') ? settingTip.fontColor : announcement.fontColor
      }
      that.setData({
        tip,
        album,
        showtip: announcement.photoUrl == '' ? 1 : 0
      })
      console.log(that.data.tip)
    })
  },

  // 点击公告栏，切换公告图片或公告文字内容
  ClickTip() {
    var that = this
    that.animate('.tip', [
      { scale: [1, 1] }, { scale: [0.9, 0.9] }, { scale: [1, 1] }
    ], 50)
    if (that.data.tip.photoUrl != '') {
      that.setData({
        showtip: that.data.showtip == 0 ? 1 : 0
      })
    }
  },
  // 点击跳转按钮时执行的动画
  touchAminate(id) {
    var that = this
    that.animate('#id' + id, [
      { opacity: 1.0, backgroundColor: '#ffffff' },
      { opacity: 0.8, backgroundColor: '#cacaca' },
      { opacity: 1.0, backgroundColor: '#ffffff' }
    ], 50, function () {
      that.clearAnimation('#id' + id, { opacity: true })
    })
  },

  //上传图片
  uploadImg(e) {
    var that = this
    that.touchAminate(e.currentTarget.dataset.item.id)
    setTimeout(function () {
      //上传图片
    }, 50)
  },

  //上传视频
  uploadVedio(e) {
    var that = this
    that.touchAminate(e.currentTarget.dataset.item.id)
    setTimeout(function () {
      //上传视频
      Dialog.alert({
        title: '标题',
        message: '弹窗内容'
      }).then(() => {
        // on close
      });
    }, 50)
  },

  // 前往相册页
  goToAlbum(e) {
    var that = this
    that.touchAminate(e.currentTarget.dataset.item.id)
    setTimeout(function () {
      if (that.data.album.enable == true) {
        wx.navigateTo({
          url: '../album/album'
        });
      } else {
        Dialog.alert({
          title: '',
          message: '您暂时没有权限访问云相册哦',
          theme: 'round-button',
        }).then(() => {
          // on close
        });
      }
    }, 50)
  },

  //查看作者
  author() {
  }
})
