import React, { useRef } from 'react';
import { Quote, Product, FrameConfiguration, CompanyInfo } from '../types';

interface ProductionPrintViewProps {
    quote: Omit<Quote, 'id'>;
    products: Product[];
    companyInfo: CompanyInfo;
    onClose: () => void;
}

// Helper function to calculate dimensions for a single frame
const calculateFrameDimensions = (frame: FrameConfiguration, products: Product[]) => {
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

    const finalExternalWidth = frame2ProfileWidth > 0 ? frame2ExternalWidth : frame1ExternalWidth;
    const finalExternalHeight = frame2ProfileWidth > 0 ? frame2ExternalHeight : frame1ExternalHeight;

    return {
        sheetRequiredWidth,
        sheetRequiredHeight,
        finalExternalWidth,
        finalExternalHeight,
    };
};


const ProductionPrintView: React.FC<ProductionPrintViewProps> = ({ quote, products, companyInfo, onClose }) => {
    const printContentRef = useRef<HTMLDivElement>(null);

    const handlePrint = (printStyle: 'one-per-page' | 'all-in-one') => {
        if (!printContentRef.current) return;

        const contentToPrint = printContentRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1000');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Imprimir Ordem de Serviço</title></head><body></body></html>');
            printWindow.document.close();

            document.head.querySelectorAll('link, style').forEach(node => {
                printWindow.document.head.appendChild(node.cloneNode(true));
            });
            
            const printBody = printWindow.document.body;

            const wrapper = printWindow.document.createElement('div');
            if (printStyle === 'one-per-page') {
                wrapper.className = 'printing-one-per-page';
            }
            wrapper.innerHTML = contentToPrint;
            printBody.appendChild(wrapper);

            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 500); // Small delay to ensure styles are applied
            };
        }
    };

    return (
        <div>
            <div className="fixed top-4 right-4 no-print flex gap-2 z-50">
                 <button 
                    onClick={() => handlePrint('all-in-one')}
                    className="py-2 px-4 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Imprimir Tudo Numa Página
                </button>
                 <button 
                    onClick={() => handlePrint('one-per-page')}
                    className="py-2 px-4 bg-orange-500 text-white rounded-md shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                    Imprimir Item por Página
                </button>
                <button 
                    onClick={onClose}
                    className="py-2 px-4 bg-gray-700 text-white rounded-md shadow-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    Fechar
                </button>
            </div>
            <div ref={printContentRef}>
                 <div className="p-8 bg-white text-gray-900">
                    <header className="flex justify-between items-start pb-4 border-b">
                        <div className="flex items-center">
                            {companyInfo.logo && <img src={companyInfo.logo} alt="Logotipo da Empresa" className="h-12 w-auto mr-4" />}
                            <div>
                                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                                <p className="text-lg text-gray-700">Ordem de Serviço</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-semibold mt-1">Pedido Nº: {quote.quoteNumber}</p>
                            <p className="text-sm">Cliente: {quote.customerName}</p>
                            <p className="text-sm">Data: {new Date(quote.createdAt).toLocaleDateString()}</p>
                            {quote.deliveryDate && <p className="text-sm font-bold text-red-600">Entrega: {new Date(quote.deliveryDate).toLocaleDateString()}</p>}
                        </div>
                    </header>

                    <section className="mt-6 space-y-6">
                        {quote.frames.map((frame, index) => {
                            const dimensions = calculateFrameDimensions(frame, products);
                            const getProduct = (id?: string) => products.find(p => p.id === id);
                            
                            const components = [
                                { label: 'Primeira Moldura', product: getProduct(frame.frame1Id), size: null },
                                { label: 'Segunda Moldura', product: getProduct(frame.frame2Id), size: null },
                                { label: 'Vidro', product: getProduct(frame.glassId), size: `${dimensions.sheetRequiredWidth.toFixed(2)} x ${dimensions.sheetRequiredHeight.toFixed(2)} cm` },
                                { label: 'Fundo', product: getProduct(frame.backingId), size: `${dimensions.sheetRequiredWidth.toFixed(2)} x ${dimensions.sheetRequiredHeight.toFixed(2)} cm` },
                                { label: 'Paspatur', product: getProduct(frame.passepartoutId), size: `${dimensions.sheetRequiredWidth.toFixed(2)} x ${dimensions.sheetRequiredHeight.toFixed(2)} cm` },
                                { label: 'Chassis', product: getProduct(frame.chassisId), size: `${frame.width} x ${frame.height} cm` },
                                { label: 'Impressão', product: getProduct(frame.printingId), size: `${frame.width} x ${frame.height} cm` },
                            ].filter(c => c.product);

                            if (frame.extraProduct.name) {
                                components.push({ label: 'Serviço/Produto Extra', product: { code: frame.extraProduct.name } as Product, size: null });
                            }
                            
                            return (
                                <div key={frame.id} className="print-item-wrapper p-4 border border-gray-400 rounded-lg break-inside-avoid">
                                    <div className="flex justify-between items-start border-b pb-2 mb-4">
                                        <h2 className="text-xl font-bold">
                                            Item {index + 1}: {frame.name || 'Quadro'} <span className="font-normal text-lg">({frame.quantity}x)</span>
                                        </h2>
                                        <div className="text-right">
                                            {frame.productionStatus && (
                                                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-200 whitespace-nowrap">
                                                    {frame.productionStatus}
                                                </span>
                                            )}
                                            {frame.productionStatus === 'Entregue' && frame.deliveryDate && (
                                                 <p className="text-xs text-gray-600 mt-1">
                                                    Entregue em: {new Date(frame.deliveryDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            {/* --- SUMMARY --- */}
                                            <div className="bg-gray-50 p-3 rounded-md mb-4">
                                                <h3 className="font-semibold text-base mb-2">Resumo das Medidas</h3>
                                                <div className="grid grid-cols-2 gap-x-4 text-sm">
                                                    <div>
                                                        <span className="font-semibold">Tamanho Interno (Obra):</span> 
                                                        <span className="font-mono font-bold ml-2">{frame.width} x {frame.height} cm</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Tamanho Externo Final:</span> 
                                                        <span className="font-mono font-bold ml-2">{dimensions.finalExternalWidth.toFixed(2)} x {dimensions.finalExternalHeight.toFixed(2)} cm</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* --- COMPONENTS --- */}
                                            <div>
                                                <h3 className="font-semibold text-base mb-2">Componentes e Cortes</h3>
                                                <div className="space-y-3">
                                                    {components.map(comp => (
                                                        <div key={comp.label} className="border-t pt-2">
                                                            <div className="flex justify-between items-baseline">
                                                                <span className="font-semibold text-gray-800">{comp.label}:</span>
                                                                <span className="font-mono font-bold text-indigo-700">{comp.product?.code}</span>
                                                            </div>
                                                            {comp.size && (
                                                                <div className="flex justify-between items-baseline text-sm">
                                                                    <span className="text-gray-600">Medida de Corte:</span>
                                                                    <span className="font-mono font-bold">{comp.size}</span>
                                                                </div>
                                                            )}
                                                            {comp.label === 'Paspatur' && frame.passepartoutWidth > 0 && (
                                                                <div className="flex justify-between items-baseline text-sm">
                                                                    <span className="text-gray-600">Largura da Margem:</span>
                                                                    <span className="font-mono font-bold">{frame.passepartoutWidth} cm</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            {frame.imageUrl && (
                                                <div>
                                                    <h3 className="font-semibold text-base mb-2">Obra de Arte</h3>
                                                    <img src={frame.imageUrl} alt="Artwork" className="w-full h-auto rounded-md border" />
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    {frame.observations && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h3 className="font-bold text-base">Observações:</h3>
                                            <p className="text-lg font-bold text-red-600 mt-1">{frame.observations}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProductionPrintView;