import React, { useRef } from 'react';
import { CuttingPlanResult, StockMaterial } from '../types';

interface CuttingPlanVisualizerProps {
    plan: CuttingPlanResult | null;
    stockMaterial: StockMaterial | null;
}

const CuttingPlanVisualizer: React.FC<CuttingPlanVisualizerProps> = ({ plan, stockMaterial }) => {
    const printContentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printContentRef.current) return;

        const contentToPrint = printContentRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1000');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Plano de Corte</title>');
            
            // Copy all link and style tags from the main document
            document.head.querySelectorAll('link, style').forEach(node => {
                printWindow.document.head.appendChild(node.cloneNode(true));
            });

            printWindow.document.write('</head><body class="p-4">');
            printWindow.document.write(contentToPrint);
            printWindow.document.write('</body></html>');
            printWindow.document.close();

            printWindow.onload = () => {
                setTimeout(() => { // A short delay ensures all styles are applied before printing
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 500);
            };
        }
    };
    
    if (!plan || !stockMaterial) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md h-full flex items-center justify-center">
                <p className="text-gray-500">Gere um plano de corte para visualizar os resultados aqui.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 no-print">
                 <h2 className="text-2xl font-bold text-gray-800">Resultado da Otimização</h2>
                 <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Imprimir Plano</button>
            </div>
           
            <div ref={printContentRef}>
                 <div className="print-only mb-4 border-b pb-2">
                    <h1 className="text-2xl font-bold">Plano de Corte - {stockMaterial.productName} ({stockMaterial.productCode})</h1>
                    <p>Material: {stockMaterial.type === 'bar' 
                        ? `Barra de ${stockMaterial.width} cm` 
                        : `Chapa de ${stockMaterial.width} x ${stockMaterial.height} cm`}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-center">
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-600">Unidades de Material</div>
                        <div className="text-2xl font-bold">{plan.stockUnitsUsed}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-600">Aproveitamento</div>
                        <div className="text-2xl font-bold text-green-600">{(100 - plan.wastePercentage).toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-600">Desperdício</div>
                        <div className="text-2xl font-bold text-red-600">{plan.wastePercentage.toFixed(1)}%</div>
                    </div>
                     <div className="bg-gray-100 p-3 rounded">
                        <div className="text-sm text-gray-600">Sobra Total</div>
                        <div className="text-lg font-bold">
                            {stockMaterial.type === 'bar' 
                                ? `${plan.totalWaste.toFixed(2)} cm` 
                                : `${(plan.totalWaste / 10000).toFixed(3)} m²`}
                        </div>
                    </div>
                </div>

                <div className="space-y-8 mt-6">
                    {plan.layouts.map(layout => (
                        <div key={layout.stockUnitIndex} className="break-inside-avoid">
                            <h3 className="text-lg font-semibold mb-2">
                                {stockMaterial.type === 'bar' ? 'Barra' : 'Chapa'} #{layout.stockUnitIndex}
                            </h3>
                            <div className="border bg-gray-50 relative" style={{ 
                                width: '100%', 
                                paddingTop: stockMaterial.type === 'bar' ? `10%` : `${(stockMaterial.height / stockMaterial.width) * 100}%`,
                                height: 0
                            }}>
                                {layout.placedPieces.map(({ piece, x, y, rotated }) => {
                                    const pieceWidth = rotated ? piece.height : piece.width;
                                    const pieceHeight = rotated ? piece.width : piece.height;

                                    return (
                                    <div
                                        key={piece.id}
                                        className="absolute bg-indigo-200 border border-indigo-500 flex flex-col items-center justify-center text-center p-0.5 overflow-hidden"
                                        style={{
                                            left: `${(x / stockMaterial.width) * 100}%`,
                                            top: stockMaterial.type === 'bar' ? '0%' : `${(y / stockMaterial.height) * 100}%`,
                                            width: `${(pieceWidth / stockMaterial.width) * 100}%`,
                                            height: stockMaterial.type === 'bar' ? '100%' : `${(pieceHeight / stockMaterial.height) * 100}%`,
                                        }}
                                        title={`${piece.label}: ${piece.width}x${piece.height}`}
                                    >
                                        <span className="text-xs text-indigo-800 font-semibold leading-tight">{piece.label}</span>
                                        <span className="text-[10px] text-indigo-900 leading-tight font-mono">
                                             {stockMaterial.type === 'bar' 
                                                ? piece.width.toFixed(1)
                                                : `${piece.width.toFixed(1)}x${piece.height.toFixed(1)}`
                                            }
                                            {rotated && ' (R)'}
                                        </span>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CuttingPlanVisualizer;