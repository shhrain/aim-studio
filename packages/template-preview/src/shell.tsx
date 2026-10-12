'use client'

import type { ReactNode } from 'react'
import type { VendorTheme } from './themes'

export interface PhoneShellProps {
  theme: VendorTheme
  chatbotName?: string
  chatbotAvatar?: string
  statusTime?: string
  children: ReactNode
  /** 叠加层（toast / 弹窗），渲染在屏幕内 */
  overlay?: ReactNode
}

/** CSS 绘制的手机外壳：状态栏 + 会话头 + 消息区 + 输入栏，按厂商主题变化 */
export function PhoneShell({
  theme,
  chatbotName = '5G阅信',
  chatbotAvatar,
  statusTime,
  children,
  overlay,
}: PhoneShellProps) {
  return (
    <div className="aim-phone-scope">
      <div className="aim-phone" data-vendor={theme.id}>
        <div className="aim-screen">
          <div className="aim-status">
            <span>{statusTime ?? theme.shell.statusTime}</span>
            <span className="aim-camera" data-type={theme.shell.camera} />
            <span className="aim-status-icons" aria-hidden>
              <i style={{ width: 'calc(var(--s) * 12)', height: 'calc(var(--s) * 7)' }} />
              <i
                style={{ width: 'calc(var(--s) * 9)', height: 'calc(var(--s) * 7)', opacity: 0.8 }}
              />
              <i
                style={{
                  width: 'calc(var(--s) * 18)',
                  height: 'calc(var(--s) * 8)',
                  borderRadius: 'calc(var(--s) * 2)',
                }}
              />
            </span>
          </div>
          <div className="aim-header">
            <span className="aim-header-back" aria-hidden />
            {chatbotAvatar ? (
              <img className="aim-header-avatar" src={chatbotAvatar} alt="" />
            ) : (
              <span className="aim-header-avatar" />
            )}
            <span className="aim-header-name">{chatbotName}</span>
            <span className="aim-header-actions" aria-hidden>
              <i />
              <i style={{ borderRadius: '50%' }} />
            </span>
          </div>
          <div className="aim-messages">{children}</div>
          <div className="aim-input-bar" data-variant={theme.shell.inputBar} aria-hidden>
            <i />
            <span>请输入</span>
            <i />
          </div>
          {overlay}
        </div>
      </div>
    </div>
  )
}
