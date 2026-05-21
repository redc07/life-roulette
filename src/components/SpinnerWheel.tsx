import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ActiveWheelItem } from '../types';
import { Sparkles, Compass, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';

interface SpinnerWheelProps {
  events: ActiveWheelItem[];
  isSpinning: boolean;
  onSpinEnd: (winningEvent: ActiveWheelItem, randomNumber: number) => void;
  isValid: boolean;
  currentPoints: number;
  expectedValue: number;
}

export default function SpinnerWheel({
  events,
  isSpinning: isSpinningProp,
  onSpinEnd,
  isValid,
  currentPoints,
  expectedValue
}: SpinnerWheelProps) {
  const controls = useAnimation();
  const [internalSpinning, setInternalSpinning] = useState(false);
  const [lastSelected, setLastSelected] = useState<ActiveWheelItem | null>(null);
  const currentRotationRef = useRef<number>(0);

  const isExpectedPositive = currentPoints + expectedValue > 0;
  const triggerAllowed = isValid && isExpectedPositive;

  // polar-to-cartesian helper for wedges
  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    // Math.PI * (angle - 90) / 180 matches 12 o'clock as 0 degrees
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    if (endAngle - startAngle >= 360) {
      return '';
    }
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', x, y,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ');
  }

  // Pre-calculate segments coordinates & angles
  const sectors: Array<{
    event: ActiveWheelItem;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    pathData: string;
    textX: number;
    textY: number;
  }> = [];

  let currentAngle = 0;
  events.forEach((event) => {
    // 100 units = 360 degrees, so 1 weight unit = 3.6 degrees
    const angleSpan = event.weight * 3.6;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    const midAngle = startAngle + angleSpan / 2;

    const pathData = describeArc(150, 150, 140, startAngle, endAngle);
    
    // Position of sector text (radial coordinates at radius = 95 for single line)
    const textPos = polarToCartesian(150, 150, 95, midAngle);

    sectors.push({
      event,
      startAngle,
      endAngle,
      midAngle,
      pathData,
      textX: textPos.x,
      textY: textPos.y,
    });

    currentAngle = endAngle;
  });

  const launchSpin = async () => {
    if (internalSpinning || !triggerAllowed || events.length === 0) return;

    setInternalSpinning(true);

    // 1. Generate random number from 1 to 100
    const randomNumber = Math.floor(Math.random() * 100) + 1;

    // 2. Determine target winning event
    let accumulatedCell = 0;
    let winningEvent = events[0];

    for (const event of events) {
      const start = accumulatedCell;
      const end = accumulatedCell + event.weight;
      if (randomNumber > start && randomNumber <= end) {
        winningEvent = event;
        break;
      }
      accumulatedCell = end;
    }

    // Find winning event's segment starting/end angles
    let targetAngle = 180;
    const matchedSector = sectors.find(s => s.event.id === winningEvent.id);
    if (matchedSector) {
      const sectorSpan = matchedSector.endAngle - matchedSector.startAngle;
      // Add a small safety padding from borders so pointer does not rest on grid separation line
      const padding = sectorSpan > 6 ? 2.5 : 0.2;
      targetAngle = matchedSector.startAngle + padding + Math.random() * (sectorSpan - 2 * padding);
    }

    // 3. Compute rotation destination
    // Selected random angle location needs to end up at 0 degrees top (12 o'clock)
    const targetBaseRotation = 360 - targetAngle;
    
    // Add multiple full turns for visual flair (e.g., 5 solid cycles)
    const extraTurns = 5;
    
    // To make consecutive spins smooth, accumulate on top of current actual rotation
    const currentBaseRot = currentRotationRef.current % 360;
    const delta = (targetBaseRotation - currentBaseRot + 360) % 360;
    
    // Standard rotation transition target
    const finalRotation = currentRotationRef.current + (extraTurns * 360) + (delta || 360);
    currentRotationRef.current = finalRotation;

    // 4. Animate!
    await controls.start({
      rotate: finalRotation,
      transition: {
        duration: 4.5,
        ease: [0.15, 0.85, 0.35, 1], // beautiful custom cubic-bezier deceleration
      },
    });

    setLastSelected(winningEvent);
    setInternalSpinning(false);
    onSpinEnd(winningEvent, randomNumber);
  };

  // Keep a trigger effect if the parent starts it
  useEffect(() => {
    if (isSpinningProp && !internalSpinning) {
      launchSpin();
    }
  }, [isSpinningProp]);

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Dynamic Background subtle ring decoration */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-slate-50 opacity-60 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-slate-50 opacity-40 pointer-events-none" />

      {/* Responsive columns layout: Wheel on the left, metadata controls on the right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center">
        
        {/* Left column: Wheel visualization */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          
          {/* Pointer Needle Indicator at 12 o'clock */}
          <div className="relative w-full max-w-[325px] aspect-square flex items-center justify-center">
            
            {/* Pointer Needle pin top */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-rose-500 -mt-1 drop-shadow-md" />
            </div>

            {/* Spinning body */}
            <div className="w-full h-full rounded-full border-4 border-slate-800 bg-slate-100 flex items-center justify-center relative shadow-lg overflow-hidden">
              {events.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50 text-center select-none">
                  <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">转盘暂无可配置项</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">请在下方将左侧事件库登记的习惯拖拽或点击加入本轮盘</p>
                </div>
              ) : events.every(e => e.weight === 100 || events.length === 1) ? (
                // Single event fallback
                <div 
                  className="w-full h-full flex items-center justify-center font-bold text-white text-center p-4 transition-transform duration-500"
                  style={{ backgroundColor: events[0]?.color || '#cbd5e1' }}
                >
                  <div className="relative z-10 rotate-0 flex flex-col items-center gap-1 leading-tight">
                    <span className="text-xl">{events[0]?.emoji || '🍀'}</span>
                    <span className="block text-sm font-black tracking-tight opacity-90">{events[0]?.name}</span>
                  </div>
                </div>
              ) : (
                <svg
                  className="w-full h-full cursor-pointer opacity-100"
                  viewBox="0 0 300 300"
                  onClick={triggerAllowed && !internalSpinning ? launchSpin : undefined}
                >
                  <motion.g
                    animate={controls}
                    initial={{ rotate: 0 }}
                    style={{ transformOrigin: '150px 150px' }}
                  >
                    {sectors.map((sec, index) => {
                      return (
                        <g key={sec.event.id} className="group cursor-pointer">
                          {/* The Wedge Sector path */}
                          <path
                            d={sec.pathData}
                            fill={sec.event.color}
                            className="transition-opacity duration-300 hover:opacity-90 active:opacity-95"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />

                          {/* Radial Sector Grid Labels */}
                          <g transform={`translate(${sec.textX}, ${sec.textY})`}>
                            <g transform={`rotate(${sec.midAngle > 90 && sec.midAngle < 270 ? sec.midAngle + 180 : sec.midAngle})`}>
                              <text
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="10.5"
                                fontWeight="bold"
                                className="font-sans antialiased select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]"
                              >
                                {`${sec.event.emoji || '✨'} ${sec.event.name.length > 6 ? `${sec.event.name.slice(0, 5)}…` : sec.event.name}`}
                              </text>
                            </g>
                          </g>
                        </g>
                      );
                    })}
                  </motion.g>

                  {/* Central Hub Core */}
                  <circle cx="150" cy="150" r="28" fill="#1e293b" className="shadow-inner" />
                  <circle cx="150" cy="150" r="14" fill="#334155" />
                </svg>
              )}
            </div>

          </div>

        </div>

        {/* Right column: Action panel & descriptions */}
        <div className="md:col-span-7 flex flex-col gap-4 font-sans justify-center relative z-10">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-mono mb-2 border border-indigo-100">
              <Compass className="w-3.5 h-3.5 animate-spin-slow text-indigo-500" />
              <span>DECISION MATRIX WHEEL PLATFORM</span>
            </div>
            {/* Title modified from "命运惯性摆盘" to "今日转盘" */}
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">今日转盘</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              指针落定的部分不仅是叙事主演，所有的格数组合也会相互共振。每天通过拖拽左侧习惯，调整本轮占格数，以便重组您的命运平均值结算！
            </p>
          </div>

          {/* Settle info & state summaries */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold block">当前动能分数</span>
              <strong className="text-lg font-black font-mono text-slate-800 mt-0.5">{currentPoints} <span className="text-[10px] text-slate-400 font-normal">分</span></strong>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-600/80 font-bold block">当次并轨期望分值</span>
              <strong className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                {events.length === 0 ? '0.00' : `${expectedValue.toFixed(2)}`} <span className="text-[10px] text-indigo-400 font-normal">分/轮</span>
              </strong>
            </div>
          </div>

          {/* Settle Spin Trigger button */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={launchSpin}
              disabled={!triggerAllowed || internalSpinning || events.length === 0}
              style={{ backgroundColor: (triggerAllowed && !internalSpinning && events.length > 0) ? '#4f46e5' : undefined }}
              className={`w-full py-3 px-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-300 text-xs sm:text-xs cursor-pointer ${
                !triggerAllowed || events.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  : internalSpinning
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 cursor-wait'
                  : 'text-white hover:opacity-95 hover:shadow active:scale-[0.98]'
              }`}
            >
              {internalSpinning ? (
                <span className="flex items-center gap-2 text-indigo-650">
                  <svg className="animate-spin h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  转轮能量摩擦中... ({Math.floor(Math.random() * 20) + 70}ms)
                </span>
              ) : (
                <span className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-amber-200 fill-amber-300" />
                  开始命运摆轮 (抽 1~100)
                </span>
              )}
            </button>

            {/* Constraints warnings & helper notifications */}
            {!isValid && events.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] flex gap-1.5 items-start mt-1">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>命运必须占满100格，且正负项格数各自不超过80，请在下面左侧事件区域微调！</span>
              </div>
            )}
            {isValid && !isExpectedPositive && events.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] flex gap-1.5 items-start mt-1 select-text">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                <span className="leading-snug">
                  <b>⚠️ 结算风险过重警告：</b>并轨清算后的下届分数将沦为负分（当前 {currentPoints} + 结算期望 {expectedValue.toFixed(2)} = {(currentPoints + expectedValue).toFixed(2)}分）。无法继续正常承载，请微调减少负向习惯占格，或先进行分数手动修正！
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}