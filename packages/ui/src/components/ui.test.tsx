import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'
import { Input } from './input'
import { Segmented } from './segmented'
import { Steps } from './steps'

describe('@aim/ui', () => {
  it('Button loading 时禁用并标记 aria-busy', () => {
    render(<Button loading>保存</Button>)
    const btn = screen.getByRole('button', { name: '保存' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('Input showCount 按字符计数（中文按 1 计）', () => {
    render(<Input showCount maxLength={17} value="阅信模板" onChange={() => {}} />)
    expect(screen.getByText('4/17')).toBeInTheDocument()
  })

  it('Segmented 切换触发回调', async () => {
    const onChange = vi.fn()
    render(
      <Segmented
        value="service"
        onValueChange={onChange}
        options={[
          { value: 'service', label: '服务类' },
          { value: 'notify', label: '通知类' },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('radio', { name: '通知类' }))
    expect(onChange).toHaveBeenCalledWith('notify')
  })

  it('Steps 标记当前步骤', () => {
    render(<Steps current={1} items={[{ title: '选择模板' }, { title: '编辑模板' }, { title: '提交审核' }]} />)
    expect(screen.getByRole('button', { name: /编辑模板/ })).toHaveAttribute('aria-current', 'step')
  })
})
