import React, { useRef, useMemo } from 'react';
import { Quote, PaymentDetails, Product, FrameConfiguration, Customer, CompanyInfo } from '../types';

interface CustomerPrintViewProps {
    quote: Omit<Quote, 'id'>;
    customer: Customer;
    products: Product[];
    companyInfo: CompanyInfo;
    paymentDetails: PaymentDetails;
    termsAndConditions: string;
    onClose: () => void;
}

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

    return { finalExternalWidth, finalExternalHeight };
};


const CustomerPrintView: React.FC<CustomerPrintViewProps> = ({ quote, customer, products, companyInfo, paymentDetails, termsAndConditions, onClose }) => {
    const printContentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printContentRef.current) return;

        const contentToPrint = printContentRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1000');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Imprimir</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            Array.from(document.styleSheets).forEach(styleSheet => {
                try {
                    const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
                    if (cssRules) {
                        const style = printWindow.document.createElement('style');
                        style.appendChild(printWindow.document.createTextNode(cssRules));
                        printWindow.document.head.appendChild(style);
                    }
                } catch (e) {
                    console.warn('Could not read stylesheet rules:', e);
                }
            });
            printWindow.document.write('</head><body style="font-family: Arial, sans-serif;">');
            printWindow.document.write(contentToPrint);
            printWindow.document.write('</body></html>');
            
            printWindow.document.close();
            
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            };
        }
    };

    const getProductName = (id?: string) => products.find(p => p.id === id)?.name;
    const isSale = quote.status === 'Vendido';
    const subTotal = quote.frames.reduce((sum, f) => sum + (f.totalPrice * f.quantity), 0);

    const discountAmount = paymentDetails ? subTotal - (paymentDetails.finalTotal - (paymentDetails.shippingCost || 0)) : 0;
    const shippingCost = paymentDetails?.shippingCost || 0;
    const finalTotal = paymentDetails?.finalTotal || subTotal;

    const totalItems = quote.frames.reduce((sum, frame) => sum + frame.quantity, 0);

    return (
        <div>
            <div className="fixed top-4 right-4 no-print flex gap-2 z-50">
                <button onClick={handlePrint} className="py-2 px-4 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700">Imprimir</button>
                <button onClick={onClose} className="py-2 px-4 bg-gray-700 text-white rounded-md shadow-lg hover:bg-gray-800">Fechar</button>
            </div>
            <div ref={printContentRef}>
                <div className="p-10 bg-white text-gray-900" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
                    <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
                        <div className="flex items-center">
                             {companyInfo.logo && <img src={companyInfo.logo} alt="Logotipo da Empresa" className="h-16 w-auto mr-4" />}
                             <div>
                                <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
                                <p className="text-xs text-gray-500 mt-1" style={{ whiteSpace: 'pre-line' }}>{companyInfo.address}</p>
                                <p className="text-xs text-gray-500 mt-1">{companyInfo.phone} | {companyInfo.email}</p>
                             </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-semibold uppercase tracking-wider">{isSale ? 'Recibo de Venda' : 'Orçamento'}</h2>
                            <p className="text-sm mt-1"><span className="font-semibold">Nº Pedido:</span> {quote.quoteNumber || 'N/A'}</p>
                            <p className="text-sm"><span className="font-semibold">Data do Pedido:</span> {new Date(quote.createdAt).toLocaleDateString()}</p>
                             {quote.deliveryDate && <p className="text-sm"><span className="font-semibold">Data de Entrega:</span> {new Date(quote.deliveryDate).toLocaleDateString()}</p>}
                             <p className="text-sm"><span className="font-semibold">Total de Itens:</span> {totalItems}</p>
                        </div>
                    </header>

                    <section className="mt-8 grid grid-cols-2 gap-x-8">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase">Cliente</h3>
                            <p className="text-lg font-medium text-gray-800">{customer.name}</p>
                            {customer.documentNumber && <p className="text-sm text-gray-600 mt-1">CPF/CNPJ: {customer.documentNumber}</p>}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                             <h3 className="text-sm font-semibold text-gray-500 uppercase">Contato</h3>
                             <p className="text-sm text-gray-600 mt-1">Telefone: {customer.phone}</p>
                             <p className="text-sm text-gray-600 mt-1">Endereço: {customer.address}</p>
                        </div>
                    </section>


                    <section className="mt-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 border-b-2 border-gray-200 bg-gray-100 text-sm font-semibold uppercase w-12">Qtd</th>
                                    <th className="p-3 border-b-2 border-gray-200 bg-gray-100 text-sm font-semibold uppercase">Descrição</th>
                                    <th className="p-3 border-b-2 border-gray-200 bg-gray-100 text-sm font-semibold uppercase text-right">Vlr. Unit.</th>
                                    <th className="p-3 border-b-2 border-gray-200 bg-gray-100 text-sm font-semibold uppercase text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.frames.map(frame => {
                                    const { finalExternalWidth, finalExternalHeight } = calculateFrameDimensions(frame, products);
                                    return (
                                        <tr key={frame.id} className="align-top hover:bg-gray-50">
                                            <td className="p-3 border-b border-gray-200">{frame.quantity}</td>
                                            <td className="p-3 border-b border-gray-200">
                                                <div className="flex items-start">
                                                    {frame.imageUrl && <img src={frame.imageUrl} alt="Artwork" className="h-16 w-16 rounded object-cover mr-4" />}
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-lg">{frame.name || 'Quadro'}</p>
                                                        <div className="text-sm text-gray-500 space-y-1 mt-1">
                                                            <p><span className="font-semibold">Medida Interna (Obra):</span> {frame.width} x {frame.height} cm</p>
                                                            <p><span className="font-semibold">Medida Externa (Final):</span> {finalExternalWidth.toFixed(2)} x {finalExternalHeight.toFixed(2)} cm</p>
                                                        </div>
                                                        <div className="text-sm text-gray-600 pl-4 mt-2 space-y-1">
                                                            {getProductName(frame.frame1Id) && <p>&bull; <span className="font-semibold">Primeira Moldura:</span> {getProductName(frame.frame1Id)}</p>}
                                                            {getProductName(frame.frame2Id) && <p>&bull; <span className="font-semibold">Segunda Moldura:</span> {getProductName(frame.frame2Id)}</p>}
                                                            {getProductName(frame.glassId) && <p>&bull; <span className="font-semibold">Vidro:</span> {getProductName(frame.glassId)}</p>}
                                                            {getProductName(frame.backingId) && <p>&bull; <span className="font-semibold">Fundo:</span> {getProductName(frame.backingId)}</p>}
                                                            {getProductName(frame.passepartoutId) && <p>&bull; <span className="font-semibold">Paspatur:</span> {getProductName(frame.passepartoutId)}</p>}
                                                            {getProductName(frame.chassisId) && <p>&bull; <span className="font-semibold">Chassis:</span> {getProductName(frame.chassisId)}</p>}
                                                            {getProductName(frame.printingId) && <p>&bull; <span className="font-semibold">Impressão:</span> {getProductName(frame.printingId)}</p>}
                                                            {getProductName(frame.substratoId) && <p>&bull; <span className="font-semibold">Substrato:</span> {getProductName(frame.substratoId)}</p>}
                                                            {getProductName(frame.servicoId) && <p>&bull; <span className="font-semibold">Serviço:</span> {getProductName(frame.servicoId)}</p>}
                                                            {frame.extraProduct.name && frame.extraProduct.price > 0 && <p>&bull; <span className="font-semibold">Extra:</span> {frame.extraProduct.name}</p>}
                                                        </div>
                                                        {frame.observations && (
                                                            <div className="mt-2 pt-1 border-t border-gray-100">
                                                                <p className="text-sm text-gray-700"><span className="font-semibold">Observações:</span> <span className="italic text-red-600 font-bold">{frame.observations}</span></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 border-b border-gray-200 text-right font-elegant text-lg">R$ {frame.totalPrice.toFixed(2)}</td>
                                            <td className="p-3 border-b border-gray-200 text-right font-elegant text-lg font-semibold">R$ {(frame.totalPrice * frame.quantity).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <section className="mt-8 flex justify-end">
                        <div className="w-full max-w-sm space-y-3">
                             <div className="flex justify-between items-baseline text-gray-700"><span className="font-medium">Subtotal:</span><span className="font-elegant text-lg">R$ {subTotal.toFixed(2)}</span></div>
                             {discountAmount > 0.01 && <div className="flex justify-between items-baseline text-gray-700"><span className="font-medium">Desconto:</span><span className="font-elegant text-lg text-red-600">- R$ {discountAmount.toFixed(2)}</span></div>}
                             {shippingCost > 0 && <div className="flex justify-between items-baseline text-gray-700"><span className="font-medium">Frete:</span><span className="font-elegant text-lg">R$ {shippingCost.toFixed(2)}</span></div>}
                             <div className="flex justify-between items-baseline text-xl font-bold text-gray-900 border-t-2 border-gray-200 pt-3"><span>Total:</span><span className="font-elegant text-2xl">R$ {finalTotal.toFixed(2)}</span></div>
                             
                             {isSale && paymentDetails && paymentDetails.paymentCondition === 'Sinal + Restante' && (
                                <>
                                    <div className="flex justify-between items-baseline text-sm text-gray-600 pt-2 border-t mt-2">
                                        <span className="font-medium">Sinal:</span>
                                        <span className={`${paymentDetails.isDownPaymentPaid ? 'text-green-600' : ''} font-elegant text-base font-semibold`}>
                                            R$ {paymentDetails.downPayment.toFixed(2)} {paymentDetails.isDownPaymentPaid && '(PAGO)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline text-lg font-bold">
                                        <span>Restante a Pagar:</span>
                                        <span className="font-elegant text-xl">R$ {(finalTotal - paymentDetails.downPayment).toFixed(2)}</span>
                                    </div>
                                </>
                             )}
                        </div>
                    </section>
                     
                    {isSale && paymentDetails ? (
                         <section className="mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-base text-gray-800 mb-2">Condições de Pagamento</h3>
                            <p><span className="font-semibold">Forma:</span> {paymentDetails.method}</p>
                            <p><span className="font-semibold">Condição:</span> {paymentDetails.paymentCondition}</p>
                        </section>
                    ) : (
                         <section className="mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-base text-gray-800 mb-2">Termos e Condições</h3>
                            <div className="whitespace-pre-wrap">{termsAndConditions}</div>
                        </section>
                    )}
                    
                    <footer className="mt-12 text-center text-xs text-gray-500 border-t border-gray-200 pt-6">
                        <p className="font-semibold">Obrigado pela preferência!</p>
                        <p className="mt-1">{companyInfo.website}</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default CustomerPrintView;