import React, { useMemo, useState } from 'react';
import { Quote, Product, FrameConfiguration, CompanyInfo } from '../types';

type ProductionStatus = 'Em produção' | 'Pronto' | 'Entregue';

interface ProductionFrame extends FrameConfiguration {
  quoteId: string;
  quoteNumber: string;
  customerName: string;
}

interface ProductionPageProps {
    quotes: Quote[];
    products: Product[];
    companyInfo: CompanyInfo;
    onUpdateFrameStatus: (quoteId: string, frameId: string, newStatus: ProductionStatus) => void;
}

const ProductionPage: React.FC<ProductionPageProps> = ({ quotes, products, onUpdateFrameStatus }) => {

    const productionFrames = useMemo<ProductionFrame[]>(() => {
        return quotes
            .filter(q => q.status === 'Aprovado' || q.status === 'Vendido')
            .flatMap(q => 
                q.frames.map(f => ({
                    ...f,
                    quoteId: q.id,
                    quoteNumber: q.quoteNumber,
                    customerName: q.customerName,
                }))
            );
    }, [quotes]);
    
    const columns: Record<ProductionStatus, ProductionFrame[]> = {
        'Em produção': productionFrames.filter(f => (f.productionStatus || 'Em produção') === 'Em produção'),
        'Pronto': productionFrames.filter(f => f.productionStatus === 'Pronto'),
        'Entregue': productionFrames.filter(f => f.productionStatus === 'Entregue'),
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, frame: ProductionFrame) => {
        e.dataTransfer.setData('frameId', frame.id);
        e.dataTransfer.setData('quoteId', frame.quoteId);
        e.currentTarget.classList.add('opacity-50', 'scale-105');
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50', 'scale-105');
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
        e.currentTarget.classList.add('bg-indigo-100');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
         e.currentTarget.classList.remove('bg-indigo-100');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: ProductionStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-indigo-100');
        const frameId = e.dataTransfer.getData('frameId');
        const quoteId = e.dataTransfer.getData('quoteId');
        if (frameId && quoteId) {
            onUpdateFrameStatus(quoteId, frameId, newStatus);
        }
    };
    
    const getProductCode = (id?: string) => products.find(p => p.id === id)?.code || 'N/A';

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Produção</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                {(Object.keys(columns) as ProductionStatus[]).map(status => (
                    <div 
                        key={status} 
                        className="bg-gray-100 rounded-lg p-4 flex flex-col transition-colors duration-200"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, status)}
                    >
                        <h2 className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-300 sticky top-0 bg-gray-100 pt-2">
                           {status} ({columns[status].length})
                        </h2>
                        <div className="space-y-4 overflow-y-auto" style={{minHeight: '200px'}}>
                            {columns[status].map(frame => (
                                <div
                                    key={frame.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, frame)}
                                    onDragEnd={handleDragEnd}
                                    className="bg-white p-4 rounded-md shadow-sm border hover:shadow-md cursor-grab transition-all duration-150"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-gray-800">{frame.name || 'Quadro'}</p>
                                        <span className="text-xs font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                            #{frame.quoteNumber}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {frame.quantity}x <span className="font-semibold">{frame.width} x {frame.height} cm</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3">{frame.customerName}</p>
                                    
                                    {frame.imageUrl && (
                                        <div className="mb-3">
                                            <img src={frame.imageUrl} alt="Artwork" className="w-full h-auto rounded-md" />
                                        </div>
                                    )}

                                    <div className="border-t pt-2 mt-2 space-y-1 text-xs">
                                        <h4 className="font-semibold text-gray-600">Componentes:</h4>
                                        <ul className="list-disc list-inside text-gray-700">
                                            {frame.frame1Id && <li>Moldura: {getProductCode(frame.frame1Id)}</li>}
                                            {frame.frame2Id && <li>Moldura 2: {getProductCode(frame.frame2Id)}</li>}
                                            {frame.glassId && <li>Vidro: {getProductCode(frame.glassId)}</li>}
                                            {frame.backingId && <li>Fundo: {getProductCode(frame.backingId)}</li>}
                                            {frame.passepartoutId && <li>Paspatur: {getProductCode(frame.passepartoutId)}</li>}
                                            {frame.chassisId && <li>Chassis: {getProductCode(frame.chassisId)}</li>}
                                            {frame.printingId && <li>Impressão: {getProductCode(frame.printingId)}</li>}
                                        </ul>
                                    </div>

                                    {frame.observations && (
                                        <div className="mt-3 pt-2 border-t">
                                            <p className="text-xs text-red-600 font-semibold italic">{frame.observations}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                             {columns[status].length === 0 && (
                                <div className="text-center py-10 text-sm text-gray-500">
                                    Nenhum item aqui.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductionPage;