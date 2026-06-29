import { useEffect, useMemo } from 'react';
import './GuitarSoundSideBar.scss';
import { useGuitarSelection, type GuitarPreset } from '../../services/GuitarSelectionService';

export default function GuitarSoundSideBar() {
  const { selected, presets, presetsLoaded, setSelected, loadPresets } = useGuitarSelection();

  useEffect(() => {
    if (!presetsLoaded) loadPresets();
  }, [presetsLoaded, loadPresets]);

  const byCategory = useMemo(() => {
    const map = new Map<string, GuitarPreset[]>();
    for (const p of presets) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [presets]);

  return (
    <div className="guitar-sidebar">
      <div className="guitar-sidebar__header">
        <span className="material-symbols-outlined">music_note</span>
        <span>Son de guitare</span>
      </div>

      {!presetsLoaded && (
        <div className="guitar-sidebar__loading">Chargement…</div>
      )}

      {[...byCategory.entries()].map(([category, items]) => (
        <div key={category} className="guitar-sidebar__category">
          <h3 className="guitar-sidebar__category-title">{category}</h3>
          <div className="guitar-sidebar__list">
            {items.map((p) => {
              const isActive = selected.bank === p.bank && selected.preset === p.preset;
              return (
                <button
                  key={`${p.bank}:${p.preset}`}
                  className={['guitar-sidebar__item', isActive ? 'active' : ''].filter(Boolean).join(' ')}
                  onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                  title={p.name}
                >
                  {isActive && (
                    <span className="material-symbols-outlined guitar-sidebar__check">check</span>
                  )}
                  <span className="guitar-sidebar__name">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
