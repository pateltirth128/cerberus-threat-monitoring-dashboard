import React from "react";

const StatGrid = ({ title, bodyText, icon, tone }) => {
  const numberColor = tone === "rose" && Number(bodyText) > 0 ? "text-bad" : "text-ink";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{title}</span>
        {icon ? <span className="text-faint text-lg" aria-hidden="true">{icon}</span> : null}
      </div>
      <div className={`mt-3 font-mono text-3xl font-bold tracking-tight ${numberColor}`}>
        {bodyText}
      </div>
    </div>
  );
};

export default StatGrid;
