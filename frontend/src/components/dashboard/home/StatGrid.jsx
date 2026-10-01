import React from "react";
import { IoBagHandle } from "react-icons/io5";

const StatGrid = ({ title, bodyText, icon = <IoBagHandle />, tone = "accent" }) => {
  const underline = {
    sky: "bg-info",
    emerald: "bg-ok",
    amber: "bg-warn",
    rose: "bg-bad",
    accent: "bg-accent",
  }[tone] || "bg-accent";

  const numberColor = tone === "rose" ? "text-bad" : "text-ink";

  return (
    <div className="relative card card-hover p-5 overflow-hidden">
      <span className="absolute right-4 top-4 text-faint text-xl">{icon}</span>
      <span className="text-sm text-muted">{title}</span>
      <div className={`mt-3 font-mono text-3xl font-bold tracking-tight ${numberColor}`}>
        {bodyText}
      </div>
      <span className={`absolute left-5 bottom-4 h-[3px] w-8 rounded ${underline}`} />
    </div>
  );
};

export default StatGrid;
