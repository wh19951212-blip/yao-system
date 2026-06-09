export type RecognitionFormType =
  | 'investor'
  | 'land'
  | 'property'
  | 'builder'
  | 'hotel'
  | 'contract'
  | 'media'

export interface FormRecognitionSchema {
  label: string
  fields: Record<string, string>
}

export const FORM_RECOGNITION_SCHEMAS: Record<
  RecognitionFormType,
  FormRecognitionSchema
> = {
  investor: {
    label: '投资人',
    fields: {
      name: '姓名',
      grade: '等级，S/A/B/C 之一',
      stage: '阶段：认知阶段/信任阶段/评估阶段/决策阶段/成交阶段',
      budget: '预算（万，数字）',
      confirmed_amount: '已确认金额（万，数字）',
      motivation: '投资动机',
      decision_type: '决策方式：独立/夫妻/合伙/家族',
      source: '来源渠道',
      owner: '负责人',
      next_action: '下一步行动',
      deadline: '截止日期 YYYY-MM-DD',
      notes: '备注',
    },
  },
  land: {
    label: '土地',
    fields: {
      name: '地块名称',
      location: '位置地址',
      area_sqm: '面积（㎡，数字）',
      price_wan: '价格（万，数字）',
      expected_rent_wan: '预期租金或净收入（万/年，数字）',
      legal_status: '法律状态',
      description: '备注说明',
    },
  },
  property: {
    label: '物件/项目',
    fields: {
      name: '项目名称',
      location: '位置',
      type: '类型：酒店/住宅/商业',
      source_type: '来源：自开发/代理',
      price_wan: '价格（万，数字）',
      commission_rate: '佣金比例（%，数字）',
      status: '状态：進行中/販売中/終了&不合格',
      description: '描述',
    },
  },
  builder: {
    label: '建筑商',
    fields: {
      company_name: '公司名称',
      contact_name: '联系人',
      contact_phone: '电话',
      contact_wechat: '微信',
      specialty: '专长',
      region: '服务区域',
      tier: '等级 A/B/C',
      price_per_sqm_min: '最低单价（万/㎡，数字）',
      price_per_sqm_max: '最高单价（万/㎡，数字）',
      typical_timeline_months: '典型工期（月，数字）',
      capacity_status: '产能：空闲/饱和/满',
      notes: '备注',
    },
  },
  hotel: {
    label: '酒店',
    fields: {
      name: '酒店名称',
      location: '位置',
      room_count: '房间数（数字）',
      management_fee_rate: '管理费率（%，数字）',
      contract_start: '合同开始 YYYY-MM-DD',
      contract_end: '合同结束 YYYY-MM-DD',
      status: '状态：运营中/筹备中/已结束',
      notes: '备注',
    },
  },
  contract: {
    label: '合同',
    fields: {
      type: '类型：开发/中介/运营',
      amount_wan: '合同金额（万，数字）',
      commission_wan: '佣金（万，数字）',
      signed_date: '签约日期 YYYY-MM-DD',
      status: '状态：进行中/已完成',
      notes: '备注',
    },
  },
  media: {
    label: '素材文案',
    fields: {
      title: '素材标题',
      type: '类型：图片/视频/文案',
      platform: '平台：小红书/微信/其他',
      content: '文案内容',
    },
  },
}

export function buildRecognitionPrompt(formType: RecognitionFormType) {
  const schema = FORM_RECOGNITION_SCHEMAS[formType]
  const fieldLines = Object.entries(schema.fields)
    .map(([key, desc]) => `  "${key}": "${desc}"`)
    .join(',\n')

  return `你正在识别一张${schema.label}相关文档/截图/PDF。请提取信息并仅返回 JSON 对象（不要 markdown 代码块），字段说明如下：
{
${fieldLines}
}

规则：
- 无法识别的字段留空字符串 ""
- 数字字段只返回数字字符串，不含单位
- 日期格式 YYYY-MM-DD
- 枚举字段必须使用上述可选值之一
- 只返回 JSON，不要其他文字`
}
