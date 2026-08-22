import React, { useState, useRef, useEffect } from 'react';

export function AuthShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

	return (
		<>
			{/* Deep background */}
			<div aria-hidden="true" className="absolute inset-0 bg-[#09090b]" />

			<div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base faint grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"
        />

        {/* Spotlight grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff25_1px,transparent_1px),linear-gradient(to_bottom,#ffffff25_1px,transparent_1px)] bg-[size:32px_32px] transition-opacity duration-300"
          style={{
            maskImage: `radial-gradient(400px circle at ${position.x}px ${position.y}px, black, transparent)`,
            WebkitMaskImage: `radial-gradient(400px circle at ${position.x}px ${position.y}px, black, transparent)`,
          }}
        />

        {/* Outer radial mask to fade out the very edges of the section */}
        <div 
          className="absolute inset-0 bg-[#09090b] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_50%,black_100%)]" 
        />

        {/* Soft accent glow in the top-left corner */}
        <div 
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen" 
        />
      </div>
		</>
	);
}
