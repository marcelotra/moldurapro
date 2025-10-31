import React, { useState, useMemo, useEffect } from 'react';
import { Product, StockMaterial, CutPiece, CuttingPlanResult, Quote, FrameConfiguration } from '../types';
import { optimizeBarCutting, optimizeSheetCutting } from './CuttingOptimizer';
import CuttingPlanVisualizer from './CuttingPlanVisualizer';

interface CuttingPlanPageProps {
    products: Product[];
    quotes: Quote[];
}

type Cut = { width: number; height: number; label: string };

const getCutsForQuote = (quote: Quote, products: Product[]): Map<string, Cut[]> => {
    const cutsByProduct = new Map<string, Cut[]>();

    const addCut = (productId: string, cut: Cut, quantity: number) => {
        if (!cutsByProduct.has(productId)) {
            cutsByProduct.set(productId, []);
        }
        for (let i = 0; i < quantity; i++) {
            cutsByProduct.get(productId)!.push(cut);
        }
    };

    quote.frames.forEach(frame => {
        // --- Calculate Dimensions ---
        const { width, height, passepartoutWidth, frame1Id, frame2Id, glassMargin, printingMargin } = frame;
        const frame1 = products.find(p => p.id === frame1Id);
        const frame2 = products.find(p => p.id === frame2Id);
        const frame1ProfileWidth = frame1?.width || 0;
        const frame2ProfileWidth = frame2?.width || 0;
        const sheetRequiredWidth = width + (printingMargin * 2) + (glassMargin * 2) + (passepartoutWidth * 2);
        const sheetRequiredHeight = height + (printingMargin * 2) + (glassMargin * 2) + (passepartoutWidth * 2);

        const frame1ExternalWidth = sheetRequiredWidth + (frame1ProfileWidth * 2);
        const frame1ExternalHeight = sheetRequiredHeight + (frame1ProfileWidth * 2);

        const frame2ExternalWidth = frame1ExternalWidth + (frame2ProfileWidth * 2);
        const frame2ExternalHeight = frame1ExternalHeight + (frame2ProfileWidth * 2);

        // --- Add Cuts ---
        const label = `#${quote.quoteNumber}`;

        if (frame.frame1Id) {
            addCut(frame.frame1Id, { width: frame1ExternalWidth, height: 0, label }, frame.quantity * 2);
            addCut(frame.frame1Id, { width: frame1ExternalHeight, height: 0, label }, frame.quantity * 2);
        }
        if (frame.frame2Id) {
            addCut(frame.frame2Id, { width: frame2ExternalWidth, height: 0, label }, frame.quantity * 2);
            addCut(frame.frame2Id, { width: frame2ExternalHeight, height: 0, label }, frame.quantity * 2);
        }
        
        const sheetCut = { width: sheetRequiredWidth, height: sheetRequiredHeight, label };
        if (frame.glassId) addCut(frame.glassId, sheetCut, frame.quantity);
        if (frame.backingId) addCut(frame.backingId, sheetCut, frame.quantity);
        if (frame.passepartoutId) addCut(frame.passepartoutId, sheetCut, frame.quantity);
    });

    return cutsByProduct;
};


const CuttingPlanPage: React.FC<CuttingPlanPageProps> = ({ products, quotes }) => {
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
    const [cutsByProduct, setCutsByProduct] = useState<Map<string, Cut[]>>(new Map());
    
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [pieces, setPieces] = useState<{ id: number, width: string, height: string, quantity: string, label: string }[]>([]);
    const [plan, setPlan] = useState<CuttingPlanResult | null>(null);
    
    const productionQuotes = useMemo(() => {
        return quotes.filter(q => q.status === 'Aprovado' || q.status === 'Vendido');
    }, [quotes]);

    const availableMaterials = useMemo(() => {
        if (selectedQuoteId) {
            return products.filter(p => cutsByProduct.has(p.id));
        }
        return products.filter(p => ['moldura', 'vidro', 'fundo', 'passe-partout'].includes(p.productType));
    }, [products, selectedQuoteId, cutsByProduct]);

    useEffect(() => {
        if (selectedQuoteId) {
            const quote = quotes.find(q => q.id === selectedQuoteId);
            if (quote) {
                setCutsByProduct(getCutsForQuote(quote, products));
                // Reset subsequent selections
                setSelectedProductId('');
                setPieces([]);
                setPlan(null);
            }
        } else {
            setCutsByProduct(new Map());
        }
    }, [selectedQuoteId, quotes, products]);

    useEffect(() => {
        if (selectedQuoteId && selectedProductId) {
            const cuts = cutsByProduct.get(selectedProductId);
            if (cuts) {
                const groupedCuts: { [key: string]: { width: number, height: number, quantity: number, label: string } } = {};
                cuts.forEach(cut => {
                    const key = `${cut.width.toFixed(2)}x${cut.height.toFixed(2)}`;
                    if (!groupedCuts[key]) {
                        groupedCuts[key] = { width: cut.width, height: cut.height, quantity: 0, label: cut.label };
                    }
                    groupedCuts[key].quantity += 1;
                });

                const newPieces = Object.values(groupedCuts).map((group, index) => ({
                    id: Date.now() + index,
                    width: String(group.width),
                    height: String(group.height),
                    quantity: String(group.quantity),
                    label: group.label
                }));
                setPieces(newPieces);
            }
        }
    }, [selectedProductId, selectedQuoteId, cutsByProduct]);

    const handleClearQuoteSelection = () => {
        setSelectedQuoteId('');
        setSelectedProductId('');
        setPieces([]);
        setPlan(null);
    };

    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId);
    }, [selectedProductId, products]);

    const stockMaterial: StockMaterial | null = useMemo(() => {
        if (!selectedProduct) return null;
        if (selectedProduct.productType === 'moldura') {
            return {
                productId: selectedProduct.id,
                productCode: selectedProduct.code,
                productName: selectedProduct.name,
                type: 'bar',
                width: (selectedProduct.length || 0) * 100, // convert m to cm
                height: selectedProduct.width || 0, // bar thickness as height for viz
            };
        } else {
             return {
                productId: selectedProduct.id,
                productCode: selectedProduct.code,
                productName: selectedProduct.name,
                type: 'sheet',
                width: selectedProduct.sheetWidth || 0,
                height: selectedProduct.sheetHeight || 0,
            };
        }
    }, [selectedProduct]);

    const handleAddPiece = () => {
        setPieces(prev => [...prev, { id: Date.now(), width: '', height: '', quantity: '1', label: '' }]);
    };

    const handlePieceChange = (id: number, field: keyof typeof pieces[0], value: string) => {
        setPieces(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleRemovePiece = (id: number) => {
        setPieces(prev => prev.filter(p => p.id !== id));
    };

    const handleGeneratePlan = () => {
        if (!stockMaterial) {
            alert('Por favor, selecione um material.');
            return;
        }

        const parsedPieces: CutPiece[] = [];
        for (const piece of pieces) {
            const quantity = parseInt(piece.quantity, 10);
            const width = parseFloat(piece.width);
            const height = stockMaterial.type === 'sheet' ? parseFloat(piece.height) : 0;
            if (isNaN(quantity) || isNaN(width) || (stockMaterial.type === 'sheet' && isNaN(height)) || quantity <= 0 || width <= 0 || (stockMaterial.type === 'sheet' && height <= 0)) {
                alert('Por favor, preencha todas as medidas e quantidades com valores válidos.');
                return;
            }
            for (let i = 0; i < quantity; i++) {
                parsedPieces.push({
                    id: `${piece.id}-${i}`,
                    width,
                    height,
                    label: piece.label || `L:${width} A:${height}`
                });
            }
        }
        
        let result;
        if (stockMaterial.type === 'bar') {
            result = optimizeBarCutting(stockMaterial.width, parsedPieces);
        } else {
            result = optimizeSheetCutting(stockMaterial.width, stockMaterial.height, parsedPieces);
        }
        setPlan(result);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">Plano de Corte Otimizado</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6 no-print">
                     {/* Step 0: Quote Selection */}
                     <div className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">0. (Opcional) Selecionar Pedido</h2>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedQuoteId}
                                onChange={e => setSelectedQuoteId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            >
                                <option value="">-- Modo Manual --</option>
                                {productionQuotes.map(q => (
                                    <option key={q.id} value={q.id}>
                                        #{q.quoteNumber} - {q.customerName}
                                    </option>
                                ))}
                            </select>
                            {selectedQuoteId && (
                                <button onClick={handleClearQuoteSelection} title="Limpar seleção" className="p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step 1: Material Selection */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">1. Selecione o Material</h2>
                        <select
                            value={selectedProductId}
                            onChange={e => { setSelectedProductId(e.target.value); setPlan(null); }}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            disabled={selectedQuoteId && cutsByProduct.size === 0}
                        >
                            <option value="">-- Escolha um material --</option>
                            {availableMaterials.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.code})
                                </option>
                            ))}
                        </select>
                        {stockMaterial && (
                            <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                                {stockMaterial.type === 'bar'
                                    ? `Barra de ${stockMaterial.width} cm de comprimento`
                                    : `Chapa de ${stockMaterial.width} x ${stockMaterial.height} cm`
                                }
                            </div>
                        )}
                    </div>
                    
                    {/* Step 2: Pieces to Cut */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">2. Informe as Peças</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {pieces.map((piece) => (
                            <div key={piece.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded">
                                <div className={stockMaterial?.type === 'sheet' ? 'col-span-3' : 'col-span-4'}>
                                    <input type="number" placeholder={stockMaterial?.type === 'sheet' ? 'Larg.' : 'Comp.'} value={piece.width} onChange={e => handlePieceChange(piece.id, 'width', e.target.value)} className="w-full p-1 border rounded" disabled={!!selectedQuoteId} />
                                </div>
                                {stockMaterial?.type === 'sheet' && (
                                     <div className="col-span-3">
                                        <input type="number" placeholder="Alt." value={piece.height} onChange={e => handlePieceChange(piece.id, 'height', e.target.value)} className="w-full p-1 border rounded" disabled={!!selectedQuoteId} />
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <input type="number" placeholder="Qtd" value={piece.quantity} onChange={e => handlePieceChange(piece.id, 'quantity', e.target.value)} className="w-full p-1 border rounded" disabled={!!selectedQuoteId} />
                                </div>
                                <div className="col-span-3">
                                    <input type="text" placeholder="Rótulo" value={piece.label} onChange={e => handlePieceChange(piece.id, 'label', e.target.value)} className="w-full p-1 border rounded" disabled={!!selectedQuoteId} />
                                </div>
                                <div className="col-span-1">
                                    <button onClick={() => handleRemovePiece(piece.id)} className="text-red-500 font-bold" disabled={!!selectedQuoteId}>&times;</button>
                                </div>
                            </div>
                        ))}
                        </div>
                        <button onClick={handleAddPiece} className="mt-2 w-full text-sm bg-gray-200 hover:bg-gray-300 p-2 rounded" disabled={!!selectedQuoteId}>Adicionar Peça</button>
                    </div>

                    {/* Step 3: Generate */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">3. Gerar Plano</h2>
                        <button
                            onClick={handleGeneratePlan}
                            disabled={!stockMaterial || pieces.length === 0}
                            className="w-full p-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            Gerar Plano de Corte
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                     <CuttingPlanVisualizer plan={plan} stockMaterial={stockMaterial} />
                </div>
            </div>
        </div>
    );
};

export default CuttingPlanPage;
