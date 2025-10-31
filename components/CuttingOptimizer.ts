import { CutPiece, CuttingPlanResult, Layout, PlacedPiece } from '../types';

/**
 * Optimizes cutting for 1D materials like frame bars.
 * Uses the First Fit Decreasing algorithm.
 * @param barLength The length of the stock bar in cm.
 * @param pieces An array of all individual pieces to be cut.
 * @returns A CuttingPlanResult object.
 */
export function optimizeBarCutting(barLength: number, pieces: CutPiece[]): CuttingPlanResult {
    // Sort pieces by length in descending order
    const sortedPieces = [...pieces].sort((a, b) => b.width - a.width);

    const layouts: Layout[] = [];
    const bins: { pieces: PlacedPiece[], remaining: number }[] = [];

    for (const piece of sortedPieces) {
        let placed = false;
        // Try to place in an existing bin
        for (let i = 0; i < bins.length; i++) {
            if (piece.width <= bins[i].remaining) {
                const x = barLength - bins[i].remaining;
                bins[i].pieces.push({ piece, x, y: 0, rotated: false });
                bins[i].remaining -= piece.width;
                placed = true;
                break;
            }
        }
        // If not placed, create a new bin
        if (!placed) {
            const newBin = {
                pieces: [{ piece, x: 0, y: 0, rotated: false }],
                remaining: barLength - piece.width,
            };
            bins.push(newBin);
        }
    }
    
    let totalPiecesArea = 0;
    bins.forEach((bin, index) => {
        let waste = bin.remaining;
        totalPiecesArea += (barLength - waste);
        layouts.push({
            stockUnitIndex: index + 1,
            placedPieces: bin.pieces,
            waste: waste,
        });
    });

    const stockUnitsUsed = bins.length;
    const totalStockArea = stockUnitsUsed * barLength;
    const totalWaste = totalStockArea - totalPiecesArea;

    return {
        stockUnitsUsed,
        totalPiecesArea,
        totalStockArea,
        totalWaste,
        wastePercentage: totalStockArea > 0 ? (totalWaste / totalStockArea) * 100 : 0,
        layouts,
    };
}


// --- New Guillotine Algorithm for 2D Sheet Cutting ---

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Optimizes cutting for 2D materials like glass, backing, etc.
 * Uses a more advanced Guillotine algorithm with Best Short Side Fit (BSSF) heuristic.
 * This provides significantly better packing efficiency than the simple shelf algorithm.
 * @param sheetWidth The width of the stock sheet in cm.
 * @param sheetHeight The height of the stock sheet in cm.
 * @param pieces An array of all individual pieces to be cut.
 * @returns A CuttingPlanResult object.
 */
export function optimizeSheetCutting(sheetWidth: number, sheetHeight: number, pieces: CutPiece[]): CuttingPlanResult {
    const layouts: Layout[] = [];
    const bins: { placedPieces: PlacedPiece[], freeRectangles: Rect[] }[] = [];
    
    const sortedPieces = [...pieces].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));

    for (const piece of sortedPieces) {
        let bestFit: { binIndex: number, rectIndex: number, node: Rect, rotated: boolean, score: number } | null = null;
        
        // Find the best position across all bins
        for (let binIndex = 0; binIndex < bins.length; binIndex++) {
            const bin = bins[binIndex];
            for (let rectIndex = 0; rectIndex < bin.freeRectangles.length; rectIndex++) {
                const freeRect = bin.freeRectangles[rectIndex];
                
                // Try original orientation
                if (piece.width <= freeRect.width && piece.height <= freeRect.height) {
                    const score = Math.min(freeRect.width - piece.width, freeRect.height - piece.height);
                    if (bestFit === null || score < bestFit.score) {
                        bestFit = { binIndex, rectIndex, node: { x: freeRect.x, y: freeRect.y, width: piece.width, height: piece.height }, rotated: false, score };
                    }
                }
                
                // Try rotated orientation
                if (piece.height <= freeRect.width && piece.width <= freeRect.height) {
                    const score = Math.min(freeRect.width - piece.height, freeRect.height - piece.width);
                     if (bestFit === null || score < bestFit.score) {
                        bestFit = { binIndex, rectIndex, node: { x: freeRect.x, y: freeRect.y, width: piece.height, height: piece.width }, rotated: true, score };
                    }
                }
            }
        }
        
        // If no fit was found, open a new bin
        if (bestFit === null) {
            const newBin = { placedPieces: [], freeRectangles: [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }] };
            bins.push(newBin);
            const binIndex = bins.length - 1;
            
            // Re-run placement logic for the new bin
             for (let rectIndex = 0; rectIndex < newBin.freeRectangles.length; rectIndex++) {
                const freeRect = newBin.freeRectangles[rectIndex];
                 if (piece.width <= freeRect.width && piece.height <= freeRect.height) {
                    const score = Math.min(freeRect.width - piece.width, freeRect.height - piece.height);
                     if (bestFit === null || score < bestFit.score) {
                        bestFit = { binIndex, rectIndex, node: { x: freeRect.x, y: freeRect.y, width: piece.width, height: piece.height }, rotated: false, score };
                    }
                }
                 if (piece.height <= freeRect.width && piece.width <= freeRect.height) {
                     const score = Math.min(freeRect.width - piece.height, freeRect.height - piece.width);
                     if (bestFit === null || score < bestFit.score) {
                        bestFit = { binIndex, rectIndex, node: { x: freeRect.x, y: freeRect.y, width: piece.height, height: piece.width }, rotated: true, score };
                    }
                }
            }
        }
        
        // Place the piece and split the free rectangle
        if (bestFit !== null) {
            const { binIndex, rectIndex, node, rotated } = bestFit;
            const bin = bins[binIndex];
            const freeRect = bin.freeRectangles[rectIndex];

            // Add the placed piece to the bin
            bin.placedPieces.push({ piece, x: node.x, y: node.y, rotated });

            // Remove the free rectangle that was just used
            bin.freeRectangles.splice(rectIndex, 1);
            
            // Split the used rectangle (Guillotine cut)
            // New rectangle on the right
            if (node.width < freeRect.width) {
                const newRect: Rect = {
                    x: freeRect.x + node.width,
                    y: freeRect.y,
                    width: freeRect.width - node.width,
                    height: freeRect.height
                };
                bin.freeRectangles.push(newRect);
            }
            
            // New rectangle on the bottom
            if (node.height < freeRect.height) {
                 const newRect: Rect = {
                    x: freeRect.x,
                    y: freeRect.y + node.height,
                    width: node.width, // Only the width of the placed piece
                    height: freeRect.height - node.height
                };
                bin.freeRectangles.push(newRect);
            }
            
            // Merge adjacent free rectangles (optional but improves performance)
            // This part can be complex; skipping for simplicity to ensure stability.
        } else {
             console.error(`Piece ${piece.label} is too large for the sheet.`);
        }
    }

    // --- Calculate final results ---
    let totalPiecesArea = 0;
    bins.forEach((bin, index) => {
        const usedArea = bin.placedPieces.reduce((sum, p) => sum + (p.piece.width * p.piece.height), 0);
        totalPiecesArea += usedArea;
        layouts.push({
            stockUnitIndex: index + 1,
            placedPieces: bin.placedPieces,
            waste: (sheetWidth * sheetHeight) - usedArea,
        });
    });

    const stockUnitsUsed = bins.length;
    const totalStockArea = stockUnitsUsed * sheetWidth * sheetHeight;
    const totalWaste = totalStockArea - totalPiecesArea;

    return {
        stockUnitsUsed,
        totalPiecesArea,
        totalStockArea,
        totalWaste,
        wastePercentage: totalStockArea > 0 ? (totalWaste / totalStockArea) * 100 : 0,
        layouts,
    };
}