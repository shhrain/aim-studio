'use client'

import type { RcsSourceMaterial, RmsFrame } from '@aim/template-schema'
import { u, useResolver } from './hooks'
import { lazy } from './elements/basic'
import { renderTextHtml, renderTextPlain } from './params'

/** RCS（5G 消息 / iPhone）卡片预览 */
export function RcsView({ material }: { material: RcsSourceMaterial }) {
  const r = useResolver()
  const multi = material.tplType === 'multiCard'
  const sheet = material.actionSheet ?? []
  return (
    <div className="aim-scope">
      <div className="aim-rcs">
        <div className="aim-rcs-cards" data-multi={multi || undefined}>
          {material.content.map((c, i) => {
            const buttons = c.buttons ?? (multi ? [] : sheet)
            const isVideo = c.media?.mtalType === 'video'
            const media = isVideo ? c.media.coverUrl : c.media?.mtalAddress
            return (
              <div key={i} className="aim-rcs-card">
                {media ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      className="aim-rcs-media"
                      src={media}
                      alt=""
                      style={material.tplType === 'media' ? { aspectRatio: 'auto' } : undefined}
                    />
                    {isVideo && <span className="aim-play" />}
                  </div>
                ) : (
                  <div className="aim-rcs-media" />
                )}
                {material.tplType !== 'media' && (c.title || c.description) && (
                  <div className="aim-rcs-body">
                    {c.title && (
                      <div
                        className="aim-t1"
                        dangerouslySetInnerHTML={{ __html: renderTextHtml(c.title, r) }}
                      />
                    )}
                    {c.description && (
                      <div
                        className="aim-t2"
                        style={{ marginTop: u(4) }}
                        dangerouslySetInnerHTML={{ __html: renderTextHtml(c.description, r) }}
                      />
                    )}
                  </div>
                )}
                {buttons.length > 0 && material.tplType !== 'media' && (
                  <div className="aim-rcs-suggestions">
                    {buttons.map((b, j) => (
                      <button
                        key={j}
                        type="button"
                        data-missing={!b.action || undefined}
                        title={b.action || '需补填链接'}
                      >
                        {renderTextPlain(b.name, r)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {(multi || material.tplType === 'media') && sheet.length > 0 && (
          <div className="aim-rcs-chips">
            {sheet.map((b, j) => (
              <span key={j}>{renderTextPlain(b.name, r)}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** RMS（视频短信 / 其他终端）帧序列预览 */
export function RmsView({ title, frames }: { title: string; frames: RmsFrame[] }) {
  const r = useResolver()
  return (
    <div className="aim-scope">
      <div className="aim-rms">
        {title && <div className="aim-rms-title">{renderTextPlain(title, r)}</div>}
        {frames.map((f, i) => (
          <div key={i} className="aim-rms-frame">
            {f.type === 'text' && (
              <div
                className="aim-rms-text"
                dangerouslySetInnerHTML={{ __html: renderTextHtml(String(f.text ?? ''), r) }}
              />
            )}
            {f.type === 'image' && f.src && (
              <img src={String(f.src)} alt="" loading={lazy(String(f.src))} />
            )}
            {f.type === 'video' && (
              <div className="aim-media" style={{ aspectRatio: '16 / 9' }}>
                {f.fistFramePath && (
                  <img className="aim-media-cover" src={String(f.fistFramePath)} alt="" />
                )}
                <span className="aim-play" />
              </div>
            )}
            {f.type === 'audio' && (
              <div className="aim-audio" style={{ height: u(56) }}>
                <span className="aim-audio-btn" />
                <span className="aim-audio-title">{String(f.title ?? '音频')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
