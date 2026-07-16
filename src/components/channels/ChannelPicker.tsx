import { useEffect, useState } from 'react'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { fetchChannels } from '@/services/channels'
import type { Channel } from '@/types/database'

type Props = {
  channelId: string
  source: string
  onChannelChange: (channelId: string) => void
  onSourceChange: (source: string) => void
  disabled?: boolean
}

export default function ChannelPicker({
  channelId,
  source,
  onChannelChange,
  onSourceChange,
  disabled,
}: Props) {
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    fetchChannels().then(setChannels).catch(() => setChannels([]))
  }, [])

  const options = [
    { value: '', label: '不关联渠道 / 手动填写' },
    ...channels.map((ch) => ({
      value: ch.id,
      label: `${ch.name}（${ch.entity_type}）`,
    })),
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Select
        id="channel_id"
        label="渠道中介"
        value={channelId}
        onChange={(e) => onChannelChange(e.target.value)}
        options={options}
        disabled={disabled}
      />
      <Input
        id="source"
        label={channelId ? '来源补充（可选）' : '来源'}
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        placeholder={
          channelId ? '如：具体介绍人、活动名称' : '如：介绍、线上、活动'
        }
        disabled={disabled}
      />
    </div>
  )
}
