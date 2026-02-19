import React from "react";
import { Camera } from "lucide-react";

interface EndnoteScreenshotProps {
  papers: any[];
}

export default function EndnoteScreenshot({ papers }: EndnoteScreenshotProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "hsl(var(--gold))" }}>
        <Camera className="w-4 h-4" /> EndNote Library Simulation
      </h3>
      {/* Simulated EndNote window */}
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "hsl(var(--navy-border))" }}>
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "hsl(220, 25%, 18%)" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            EndNote X21 — My Library
          </span>
        </div>
        {/* Toolbar sim */}
        <div className="flex gap-4 px-3 py-1.5 text-xs" style={{ background: "hsl(220, 22%, 15%)", color: "hsl(var(--muted-foreground))" }}>
          <span>File</span><span>Edit</span><span>References</span><span>Groups</span><span>Tools</span>
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-1 px-2 py-1 text-xs font-semibold border-b"
          style={{ background: "hsl(220, 20%, 16%)", borderColor: "hsl(var(--navy-border))", color: "hsl(var(--muted-foreground))" }}>
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Author</div>
          <div className="col-span-2">Journal</div>
          <div className="col-span-1">Year</div>
        </div>
        {/* Paper rows */}
        {papers?.slice(0, 5).map((p: any, i: number) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-1 px-2 py-1.5 text-xs border-b hover:opacity-90 transition-opacity"
            style={{
              background: i % 2 === 0 ? "hsl(220, 20%, 12%)" : "hsl(220, 18%, 10%)",
              borderColor: "hsl(var(--navy-border))",
              color: "hsl(var(--foreground) / 0.8)"
            }}
          >
            <div className="col-span-1 font-mono font-bold" style={{ color: "hsl(var(--gold))" }}>{i + 1}</div>
            <div className="col-span-5 truncate">{p.title?.substring(0, 50)}</div>
            <div className="col-span-3 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
              {p.authors?.[0]}{p.authors?.length > 1 ? " et al." : ""}
            </div>
            <div className="col-span-2 truncate" style={{ color: "hsl(var(--blue-glow))" }}>{p.venue?.substring(0, 12) || "IEEE"}</div>
            <div className="col-span-1">{p.year}</div>
          </div>
        ))}
        {/* Status bar */}
        <div className="px-3 py-1.5 text-xs flex justify-between"
          style={{ background: "hsl(220, 22%, 14%)", color: "hsl(var(--muted-foreground))" }}>
          <span>Showing {Math.min(5, papers?.length || 0)} of {papers?.length || 0} references</span>
          <span style={{ color: "hsl(var(--gold))" }}>IEEE • Research Assignment</span>
        </div>
      </div>
      <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
        Simulated EndNote library view. Export .RIS to open in real EndNote.
      </p>
    </div>
  );
}
