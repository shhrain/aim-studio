/** 旧编辑器 content[] 夹具：覆盖三信融合支持的全部 cardId 与典型边界 */
const p = (name: string) => `<input type="button" class="param-btn" value="{#${name}#}" readonly>`

export const legacyFixtures: { name: string; cardId: string; params: { name: string; example: string }[]; content: Record<string, unknown>[] }[] = [
  {
    name: '图文 + 参数 + 动态参数 + 双按钮',
    cardId: 'com.hbm.imageandtext',
    params: [{ name: 'name', example: '张三' }],
    content: [
      { type: 'image', src: 'https://cdn.example.com/a.png', w: 342, h: 192, size: 1024, event: { action: 'OPEN_URL', target: 'https://a.example.com' } },
      { type: 'text', text: `尊敬的${p('name')}，欢迎回来`, x: 14, y: 200, w: 314, h: 24 },
      { type: 'text', text: '<span class="dyn">city</span> 本周活动 &amp; 福利<br>速来', x: 14, y: 230, w: 314, h: 60 },
      { type: 'button', text: '拨打热线', event: { action: 'DIAL_PHONE', target: '95588' } },
      { type: 'button', text: '立即查看', event: { action: 'OPEN_URL', target: 'https://b.example.com/x?a=1&amp;b=2' } },
    ],
  },
  {
    name: '视频 + 打开APP（RCS 降级浏览器）',
    cardId: 'com.hbm.video',
    params: [],
    content: [
      { type: 'video', src: 'https://cdn.example.com/v.mp4', cover: 'https://cdn.example.com/c.jpg', w: 342, h: 192, size: 4096, duration: 15 },
      { type: 'text', text: '新品发布会' },
      { type: 'text', text: '点击观看直播回放' },
      { type: 'button', text: '打开APP', event: { action: 'OPEN_APP', target: 'demo://home' } },
    ],
  },
  {
    name: '图片轮播 + 快应用',
    cardId: 'com.hbm.carouselImageSixteenToNine',
    params: [],
    content: [
      {
        type: 'swiper',
        swiper: {
          swiperArr: [
            { type: 'image', src: 'https://cdn.example.com/1.png', w: 342, h: 192, event: { action: 'OPEN_URL', target: 'https://s1.example.com' } },
            { type: 'image', src: 'https://cdn.example.com/2.png', w: 342, h: 192, event: { action: 'OPEN_URL', target: 'https://s2.example.com' } },
            { type: 'image', src: 'https://cdn.example.com/3.png', w: 342, h: 192, event: { action: 'OPEN_URL', target: 'https://s1.example.com' } },
          ],
        },
      },
      { type: 'text', text: '秋季新品' },
      { type: 'text', text: '全场 8 折起 拒收请回复R' },
      { type: 'button', text: '快应用', event: { action: 'OPEN_QUICK', target: 'hap://app/com.demo/index' } },
    ],
  },
  {
    name: '红包 type1（单参数且按钮为参数）',
    cardId: 'com.hbm.redpacket',
    params: [{ name: 'link', example: 'https://r.example.com' }],
    content: [
      { type: 'image', src: 'https://cdn.example.com/bg.png', isBgimg: true, w: 342, h: 452, event: { action: 'OPEN_URL', target: '' } },
      { type: 'image', src: 'https://cdn.example.com/avatar.png', x: 149, y: 34, w: 44, h: 44, event: { action: 'OPEN_URL', target: 'https://brand.example.com' } },
      { type: 'text', title: 'true', text: '梦网科技', x: 14, y: 86, w: 314, h: 20, style: { fontSize: '13px', color: '#FFE3C2' } },
      { type: 'text', text: '恭喜发财', x: 14, y: 114, w: 314, h: 34, style: { fontSize: '24px' } },
      { type: 'text', text: '大吉大利，今晚吃鸡', x: 34, y: 154, w: 274, h: 40 },
      { type: 'button', text: '立即领取', event: { action: 'OPEN_URL', target: p('link') } },
    ],
  },
  {
    name: '个性化红包 type3（发送方名称含参数）',
    cardId: 'com.hbm.redpacketAnimation.v2',
    params: [
      { name: 'shop', example: '星巴克' },
      { name: 'amount', example: '20' },
    ],
    content: [
      { type: 'image', src: 'https://cdn.example.com/avatar.png', w: 44, h: 44, event: { action: 'OPEN_URL', target: '' } },
      { type: 'text', title: 'true', text: `${p('shop')}`, x: 14, y: 86 },
      { type: 'text', text: `${p('amount')}元红包` },
      { type: 'text', text: '限时领取' },
      { type: 'button', text: '领取', event: { action: 'OPEN_URL', target: 'https://r.example.com' } },
    ],
  },
  {
    name: '通知 + 键值对 + 复制（RCS 不支持）',
    cardId: 'com.hbm.notification',
    params: [{ name: 'order', example: 'A10086' }],
    content: [
      { type: 'image', src: 'https://cdn.example.com/n.png', w: 342, h: 120, event: { action: 'OPEN_URL', target: 'https://wl.example.com' } },
      { type: 'text', text: '订单发货通知' },
      { type: 'text', text: '您的订单已发货' },
      { type: 'text', noticeList: 'true', text: '订单号' },
      { type: 'text', noticeList: 'true', text: p('order') },
      { type: 'text', noticeList: 'true', text: '物流' },
      { type: 'text', noticeList: 'true', text: '顺丰速运' },
      { type: 'button', text: '复制单号', event: { action: 'COPY_PARAMETER', target: '' } },
      { type: 'button', text: '查看物流', event: { action: 'OPEN_BROWSER', target: 'https://wl.example.com' } },
    ],
  },
]
