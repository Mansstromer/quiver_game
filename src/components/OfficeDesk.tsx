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

      </div>
    </div>
  );
}
