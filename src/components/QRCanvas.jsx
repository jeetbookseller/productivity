/**
 * QRCanvas — canvas-based visual sync code renderer.
 * Draws the sync code data as a pixel grid with QR-style finder squares.
 * Not a standard-compliant QR code; visual aid for manual code sharing.
 */
import React, { useEffect, useRef } from 'react';

export function QRCanvas({ data = '', size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Guard: jsdom / environments without canvas support
    const bytes = new TextEncoder().encode(data);
    const totalBits = bytes.length * 8;
    const cells = Math.max(21, Math.ceil(Math.sqrt(totalBits)) + 4);
    const cellSize = Math.max(1, Math.floor(size / (cells + 2)));
    const gridSize = cells * cellSize;
    const offset = Math.floor((size - gridSize) / 2);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw a finder square (QR corner marker)
    const drawFinder = (x, y) => {
      const s = cellSize;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, s * 7, s * 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + s, y + s, s * 5, s * 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + s * 2, y + s * 2, s * 3, s * 3);
    };

    // Three finder squares: top-left, top-right, bottom-left
    drawFinder(offset, offset);
    drawFinder(offset + (cells - 7) * cellSize, offset);
    drawFinder(offset, offset + (cells - 7) * cellSize);

    // Timing strips (alternating cells between finders)
    for (let i = 8; i < cells - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(offset + i * cellSize, offset + 6 * cellSize, cellSize, cellSize);
        ctx.fillRect(offset + 6 * cellSize, offset + i * cellSize, cellSize, cellSize);
      }
    }

    // Data pixels — skip finder/timing zones
    let bitIdx = 0;
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        // Skip finder and timing zones
        const inTopLeftFinder = row < 8 && col < 8;
        const inTopRightFinder = row < 8 && col >= cells - 8;
        const inBottomLeftFinder = row >= cells - 8 && col < 8;
        const onTimingRow = row === 6 && col >= 8 && col < cells - 8;
        const onTimingCol = col === 6 && row >= 8 && row < cells - 8;
        if (inTopLeftFinder || inTopRightFinder || inBottomLeftFinder || onTimingRow || onTimingCol) {
          continue;
        }

        const byteIdx = Math.floor(bitIdx / 8);
        const bitPos = 7 - (bitIdx % 8);
        const bit = byteIdx < bytes.length ? (bytes[byteIdx] >> bitPos) & 1 : 0;
        if (bit) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(offset + col * cellSize, offset + row * cellSize, cellSize, cellSize);
        }
        bitIdx++;
      }
    }
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-label="Sync QR code"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
