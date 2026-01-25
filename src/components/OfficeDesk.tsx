import { ReactNode } from 'react';

interface OfficeDeskProps {
  children: ReactNode;
}

export function OfficeDesk({ children }: OfficeDeskProps) {
  return (
    <div className="office-desk">
      <div className="desk-surface">
        <div className="monitor">
          <div className="monitor-frame">
            <div className="monitor-screen">{children}</div>
          </div>
          <div className="monitor-stand">
            <div className="monitor-stand-neck" />
            <div className="monitor-stand-base" />
          </div>
        </div>

        <div className="desk-items">
          <div className="keyboard">
            <div className="keyboard-keys">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="key" />
              ))}
            </div>
          </div>
          <div className="mouse" />
          <div className="coffee-mug">
            <div className="mug-handle" />
          </div>
          <div className="plant">
            <div className="plant-pot" />
            <div className="plant-leaves">
              <div className="leaf" />
              <div className="leaf" />
              <div className="leaf" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
