import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Empty,
  Field,
  Input,
  Progress,
  RadioOptions,
  Segmented,
  SimpleSelect,
  Skeleton,
  Steps,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from '@aim/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlusIcon, SendIcon } from 'lucide-react'
import { useState } from 'react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: { children: '提交审核', variant: 'default', size: 'default' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'soft'] },
    size: { control: 'select', options: ['xs', 'sm', 'default', 'lg', 'xl'] },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <SendIcon />
        提交审核
      </Button>
      <Button variant="outline">预览</Button>
      <Button variant="soft">
        <PlusIcon />
        添加
      </Button>
      <Button variant="secondary">次要</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="destructive">删除</Button>
      <Button variant="link">链接</Button>
      <Button loading>保存中</Button>
    </div>
  ),
}

export const Feedback: StoryObj = {
  name: '反馈与状态',
  render: () => (
    <div className="w-[560px] space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['secondary', 'soft', 'success', 'warning', 'destructive', 'info', 'outline'] as const).map((v) => (
          <Badge key={v} variant={v} dot>
            {v}
          </Badge>
        ))}
      </div>
      <Alert variant="info" title="提示">链接需以 https:// 开头</Alert>
      <Alert variant="warning" title="苹果端不支持">复制事件提交时需补填替代链接</Alert>
      <Alert variant="destructive" title="校验失败">标题超出 3 个字</Alert>
      <Progress value={62} />
      <div className="flex gap-2">
        <Button onClick={() => toast.success('已保存')}>成功 Toast</Button>
        <Button variant="outline" onClick={() => toast.error('网络异常，请检查网络后重试')}>
          错误 Toast
        </Button>
        <ConfirmDialog trigger={<Button variant="destructive">删除模板</Button>} destructive title="删除「国庆出游季」？" description="删除后不可恢复。" confirmText="删除" onConfirm={() => void toast.success('已删除')} />
      </div>
      <Skeleton className="h-16" />
      <Empty title="还没有模板" description="从 33 种标准版式开始" action={<Button size="sm">新建模板</Button>} />
    </div>
  ),
}

export const Form: StoryObj = {
  name: '表单',
  render: function Render() {
    const [name, setName] = useState('国庆出游季')
    const [desc, setDesc] = useState('')
    const [usage, setUsage] = useState('commercial')
    const [rec, setRec] = useState('shortLink')
    const [vendor, setVendor] = useState('huawei')
    return (
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>模板设置</CardTitle>
          <CardDescription>Field 统一标签、描述与错误</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="模板名称" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} showCount />
          </Field>
          <Field label="描述" error={[...desc].length > 69 ? '超出 69 字' : undefined}>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={80} showCount />
          </Field>
          <Field label="用途">
            <Segmented block value={usage} onValueChange={setUsage} options={[{ value: 'commercial', label: '商用' }, { value: 'test', label: '测试' }]} />
          </Field>
          <Field label="识别类型">
            <RadioOptions value={rec} onValueChange={setRec} options={[{ value: 'shortLink', label: '短链识别' }, { value: 'text', label: '文本识别' }]} />
          </Field>
          <Field label="预览厂商">
            <SimpleSelect value={vendor} onValueChange={setVendor} options={[{ value: 'huawei', label: '华为' }, { value: 'vivo', label: 'vivo' }]} />
          </Field>
          <label className="flex items-center justify-between text-sm">
            自动保存
            <Switch defaultChecked />
          </label>
        </CardContent>
      </Card>
    )
  },
}

export const Navigation: StoryObj = {
  name: '导航',
  render: () => (
    <div className="space-y-6">
      <Steps current={1} items={[{ title: '选择版式' }, { title: '编辑模板' }, { title: '提交审核' }]} />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="draft">草稿</TabsTrigger>
          <TabsTrigger value="reviewing">审核中</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="content">
        <TabsList variant="line">
          <TabsTrigger value="content">内容</TabsTrigger>
          <TabsTrigger value="style">样式</TabsTrigger>
          <TabsTrigger value="event">交互</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  ),
}
