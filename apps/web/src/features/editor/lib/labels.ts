/** 属性面板字段名 → 中文标签 */
export const FIELD_LABELS: Record<string, string> = {
  text: '文本',
  src: '素材地址',
  srcParam: '动态图片参数',
  cover: '封面',
  title: '标题',
  content: '正文',
  description: '描述',
  buttons: '按钮',
  button: '按钮',
  items: '列表项',
  cards: '卡片',
  options: '选项',
  images: '商品图片',
  video: '商品视频',
  media: '主图类型',
  price: '价格',
  originalPrice: '原价',
  tag: '标签',
  currency: '货币符号',
  name: '名称',
  subtitle: '副标题',
  amount: '面额 / 折扣',
  threshold: '使用门槛',
  tagName: '券类型',
  voucherType: '券种',
  dateType: '有效期类型',
  dateRange: '有效期',
  days: '有效天数',
  customDate: '自定义有效期',
  image: '图片',
  label: '标签',
  placeholder: '占位提示',
  fields: '表单字段',
  privacyText: '隐私协议文案',
  submitText: '提交按钮文案',
  required: '必填',
  type: '类型',
  ratio: '比例',
  fit: '填充方式',
  role: '图片角色',
  alt: '替代文本',
  duration: '时长',
  variant: '按钮样式',
  resourceType: '轮播素材',
  loop: '循环播放',
  autoplay: '自动播放',
  interval: '切换间隔（秒）',
  indicator: '显示指示点',
  showContent: '显示正文',
  themeColor: '按钮配色',
  showIcon: '显示图标',
  direction: '排列方向',
  logo: 'Logo',
  coupon: '优惠券',
  pickStyle: '领取样式',
  buttonMode: '按钮模式',
  dynamicButton: '动效按钮',
  endTime: '结束时间',
  kind: '票据类型',
  from: '出发',
  to: '到达',
  number: '车次 / 航班号',
  grid: '信息栏',
  extra: '附加信息',
  tip: '温馨提示',
  value: '值',
  date: '日期',
  time: '时间',
  styleType: '展示样式',
  phone: '电话号码',
  mode: '展示模式',
  address: '地址',
  longitude: '经度',
  latitude: '纬度',
  avatar: '头像',
  links: '协议链接',
  url: '链接',
  inputStyle: '输入框样式',
  activeIndex: '默认选中',
  showTitle: '显示标题',
  shape: '形状',
  event: '点击事件',
}

/** 枚举字段选项 */
export const ENUM_OPTIONS: Record<string, { value: string; label: string }[]> = {
  fit: [
    { value: 'cover', label: '裁剪填充' },
    { value: 'contain', label: '完整显示' },
    { value: 'fill', label: '拉伸' },
  ],
  role: [
    { value: 'content', label: '内容图' },
    { value: 'background', label: '背景图' },
    { value: 'avatar', label: '头像' },
    { value: 'logo', label: 'Logo' },
  ],
  variant: [
    { value: 'primary', label: '主按钮' },
    { value: 'secondary', label: '次按钮' },
    { value: 'text', label: '文字按钮' },
  ],
  resourceType: [
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
  ],
  media: [
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
  ],
  direction: [
    { value: 'vertical', label: '竖版' },
    { value: 'horizontal', label: '横版' },
  ],
  pickStyle: [
    { value: 'pick', label: '领' },
    { value: 'grab', label: '抢' },
  ],
  voucherType: [
    { value: 'fullMinus', label: '满减券' },
    { value: 'discount', label: '折扣券' },
    { value: 'custom', label: '自定义' },
  ],
  dateType: [
    { value: 'fixed', label: '固定日期' },
    { value: 'days', label: '领取后 N 天' },
    { value: 'custom', label: '自定义文案' },
  ],
  buttonMode: [
    { value: 'each', label: '每张券单独领取' },
    { value: 'bottom', label: '底部统一按钮' },
  ],
  kind: [
    { value: 'train', label: '火车' },
    { value: 'bus', label: '汽车' },
    { value: 'flight', label: '航班' },
    { value: 'direct', label: '直飞' },
  ],
  styleType: [
    { value: 'text', label: '文字' },
    { value: 'icon', label: '图标' },
    { value: 'pic', label: '图片' },
  ],
  inputStyle: [
    { value: 'box', label: '方框' },
    { value: 'line', label: '下划线' },
  ],
  shape: [
    { value: 'rect', label: '矩形' },
    { value: 'line', label: '分割线' },
    { value: 'circle', label: '圆形' },
  ],
  type: [
    { value: 'input', label: '输入框' },
    { value: 'phone', label: '手机号' },
    { value: 'select', label: '下拉选择' },
    { value: 'date', label: '日期' },
  ],
}

/** 按元素类型区分的枚举（同名字段含义不同） */
export const ELEMENT_ENUMS: Record<string, Record<string, { value: string; label: string }[]>> = {
  map: {
    mode: [
      { value: 'card', label: '地图卡片' },
      { value: 'text', label: '文字地址' },
    ],
  },
  serviceNumber: {
    mode: [
      { value: 'profile', label: '服务号名片' },
      { value: 'guide', label: '引导文案' },
    ],
  },
}

/** 字段使用素材选择器 */
export const MEDIA_FIELDS = new Set(['src', 'cover', 'image', 'logo', 'avatar'])

/** 长文本字段 */
export const LONG_TEXT_FIELDS = new Set(['description', 'content', 'tip', 'text'])
