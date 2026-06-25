import { useState, type ReactNode } from 'react'
import './TabGroup.scss'

interface Tab {
  label: string
  content: ReactNode
}

interface TabGroupProps {
  tabs: Tab[]
  defaultIndex?: number
}

export default function TabGroup({ tabs, defaultIndex = 0 }: TabGroupProps) {
  const [active, setActive] = useState(defaultIndex)

  return (
    <div className="tab-group">
      <div className="tab-bar">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className={`tab-btn${active === i ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs[active]?.content}
      </div>
    </div>
  )
}
