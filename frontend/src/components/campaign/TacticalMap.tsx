import React, { useState, useRef, useEffect } from 'react';
import { Target, Eye, EyeOff, Navigation, Maximize, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface MapToken {
  id: number;
  type: 'player' | 'enemy' | 'npc' | 'boss';
  label: string;
  x: number;
  y: number;
  hpCurrent?: number;
  hpMax?: number;
  color?: string;
  isHidden?: boolean;
}

export interface TacticalMapProps {
  imageUrl?: string;
  gridEnabled?: boolean;
  gridSize?: number;
  tokens: MapToken[];
  revealState: Record<string, boolean>;
  isDM: boolean;
  activeTurnTokenId?: number;
  onTokenMove: (tokenId: number, x: number, y: number, snapped: boolean) => void;
  onMapReveal?: (revealState: Record<string, boolean>) => void;
  onPing?: (x: number, y: number) => void;
  mode: 'map' | 'narration';
}

type ToolMode = 'pan' | 'ping' | 'reveal' | 'hide';

export function TacticalMap({
  imageUrl = "https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=2000&auto=format&fit=crop", // Placeholder if none
  gridEnabled = true,
  gridSize = 50,
  tokens,
  revealState,
  isDM,
  activeTurnTokenId,
  onTokenMove,
  onMapReveal,
  onPing,
  mode
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const [activeTool, setActiveTool] = useState<ToolMode>('pan');
  
  // Dragging states
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [draggingToken, setDraggingToken] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Map dimensions (assumed for FOW overlay)
  const mapWidth = 2000;
  const mapHeight = 2000;
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setScale(s => Math.min(s * 1.1, 4));
    } else {
      setScale(s => Math.max(s * 0.9, 0.2));
    }
  };

  const getMapCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / scale;
    const y = (clientY - rect.top - pan.y) / scale;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (activeTool === 'pan') {
      setIsDraggingMap(true);
      setDragStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (activeTool === 'ping') {
      const coords = getMapCoordinates(e.clientX, e.clientY);
      onPing?.(coords.x, coords.y);
      setActiveTool('pan'); // auto revert
    } else if ((activeTool === 'reveal' || activeTool === 'hide') && isDM) {
      const coords = getMapCoordinates(e.clientX, e.clientY);
      const gridX = Math.floor(coords.x / gridSize);
      const gridY = Math.floor(coords.y / gridSize);
      const key = `${gridX},${gridY}`;
      
      const newState = { ...revealState };
      if (activeTool === 'reveal') {
        newState[key] = true;
      } else {
        delete newState[key];
      }
      onMapReveal?.(newState);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingMap) {
      setPan({
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y
      });
    } else if (draggingToken !== null) {
      // Optically drag token (we could use state, but keeping it simple for the hook event)
      // Actual implementation might keep local state for smoothness before dropping
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDraggingMap(false);
    if (draggingToken !== null) {
      const coords = getMapCoordinates(e.clientX, e.clientY);
      let finalX = coords.x;
      let finalY = coords.y;
      
      if (gridEnabled) {
        finalX = Math.floor(finalX / gridSize) * gridSize + (gridSize / 2);
        finalY = Math.floor(finalY / gridSize) * gridSize + (gridSize / 2);
      }
      
      onTokenMove(draggingToken, finalX, finalY, gridEnabled);
      setDraggingToken(null);
    }
  };

  const handleTokenPointerDown = (e: React.PointerEvent, tokenId: number) => {
    e.stopPropagation();
    setDraggingToken(tokenId);
  };

  return (
    <div className={`relative w-full h-[600px] tavern-bg overflow-hidden tavern-border border rounded-lg shadow-2xl transition-all duration-700 ${mode === 'narration' ? 'opacity-30 grayscale saturate-0 pointer-events-none blur-sm' : 'opacity-100'}`}>
      {/* Map Tools Header (DM & Player) */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Card className="tavern-card backdrop-blur-md tavern-border border p-1 flex items-center gap-1">
          <Button 
            variant={activeTool === 'pan' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="w-8 h-8 rounded"
            onClick={() => setActiveTool('pan')}
            title="Pan/Select"
          >
            <MousePointer2 className="w-4 h-4" />
          </Button>
          <Button 
            variant={activeTool === 'ping' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="w-8 h-8 rounded"
            onClick={() => setActiveTool('ping')}
            title="Ping Map"
          >
            <Target className="w-4 h-4 text-emerald-400" />
          </Button>
          
          {isDM && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <Button 
                variant={activeTool === 'reveal' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-8 h-8 rounded hover:text-amber-400"
                onClick={() => setActiveTool('reveal')}
                title="Reveal Fog"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant={activeTool === 'hide' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-8 h-8 rounded hover:text-rose-400"
                onClick={() => setActiveTool('hide')}
                title="Hide Fog"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Card className="tavern-card backdrop-blur-md tavern-border border p-1 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="w-8 h-8 rounded" onClick={() => setScale(s => Math.max(s * 0.8, 0.2))}>-</Button>
          <span className="text-xs font-mono w-10 text-center text-zinc-400">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" className="w-8 h-8 rounded" onClick={() => setScale(s => Math.min(s * 1.2, 4))}>+</Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="sm" className="w-8 h-8 rounded" onClick={() => { setScale(1); setPan({x:0, y:0}); }} title="Reset View">
            <Maximize className="w-4 h-4" />
          </Button>
        </Card>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-crosshair touch-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            width: mapWidth,
            height: mapHeight
          }}
        >
          {/* Base Map Image */}
          <div 
            className="absolute inset-0 bg-[#0c0a09] bg-cover bg-center bg-no-repeat rounded"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Grid Overlay */}
          {gridEnabled && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                backgroundSize: `${gridSize}px ${gridSize}px`
              }}
            />
          )}

          {/* Fog of War Overlay (Simple representation) */}
          {/* In a production app with true FOW, this would be a canvas mask. We use CSS grid visualization for the MVP. */}
          {!isDM && (
             <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-90 bg-black">
                {/* Simulated revealed areas cutouts would go here. For complex FOW, SVG masks or Canvas is required. */}
             </div>
          )}

          {/* Tokens */}
          {tokens.map(token => {
            if (token.isHidden && !isDM) return null;
            
            const isDragging = draggingToken === token.id;
            const isTurn = activeTurnTokenId === token.id;
            
            return (
              <div
                key={token.id}
                className={`absolute group touch-none select-none ${isDragging ? 'z-50 opacity-80' : 'z-10'} transition-all duration-200`}
                style={{
                  left: token.x,
                  top: token.y,
                  transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.1)' : 'scale(1)'}`,
                  width: gridSize * 0.8,
                  height: gridSize * 0.8,
                }}
                onPointerDown={(e) => handleTokenPointerDown(e, token.id)}
              >
                {/* Turn Indicator Halo */}
                {isTurn && (
                  <div className="absolute inset-[-8px] rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                )}
                {isTurn && (
                  <div className="absolute inset-[-4px] rounded-full border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                )}
                
                {/* Token Body */}
                <div 
                  className={`w-full h-full rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.8)] border-2 ${
                    token.type === 'player' ? 'bg-[#1a2b4c] border-[#87a8ff]' :
                    token.type === 'enemy' ? 'bg-[#4a0d0c] border-[#ab211f]' :
                    token.type === 'boss' ? 'bg-[#2a0845] border-[#d5b45d]' :
                    'bg-[#0f2e1b] border-[#4ade80]'
                  } ${token.isHidden ? 'opacity-50 border-dashed' : ''} overflow-hidden`}
                  style={{ backgroundColor: token.color }}
                >
                  <span className="text-[#f5efe2] font-display font-bold text-xs pointer-events-none drop-shadow-md" style={{ fontSize: `${gridSize * 0.3}px` }}>
                    {token.label.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                
                {/* Hidden Indicator */}
                {token.isHidden && (
                  <div className="absolute -top-1 -right-1 bg-[#0c0a09] rounded-full p-0.5 border tavern-border shadow-md">
                    <EyeOff className="w-3 h-3 text-[#ab211f]" />
                  </div>
                )}

                {/* HP Bar */}
                {token.hpMax !== undefined && token.hpCurrent !== undefined && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-black">
                    <div 
                      className={`h-full transition-all ${
                        (token.hpCurrent / token.hpMax) > 0.5 ? 'bg-emerald-500' : 
                        (token.hpCurrent / token.hpMax) > 0.2 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (token.hpCurrent / token.hpMax) * 100))}%` }}
                    />
                  </div>
                )}

                {/* Hover Details */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                  <div className="bg-[#0c0a09]/95 backdrop-blur-md border tavern-border rounded px-2 py-1.5 shadow-2xl whitespace-nowrap min-w-[100px]">
                    <div className="text-xs font-bold text-[#f5efe2] mb-0.5 flex justify-between gap-3">
                      <span>{token.label}</span>
                      <span className="uppercase text-[9px] text-[#cbc3b5]/70 tracking-wider">{token.type}</span>
                    </div>
                    {token.hpMax !== undefined && (
                      <div className="text-[10px] text-[#cbc3b5]/70 font-mono">
                        HP: <span className={token.hpCurrent! <= token.hpMax * 0.2 ? 'text-[#ab211f] font-bold' : ''}>{token.hpCurrent}</span> / {token.hpMax}
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-[#0c0a09]/95 border-r border-b tavern-border rotate-45 -mt-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
