import React, { useState, useMemo, useEffect } from 'react';
import { Quote, PaymentDetails, Product, Customer, CompanyInfo } from '../types';
import CustomerForm from './CustomerForm';
import CustomerPrintView from './CustomerPrintView';
import ProductionPrintView from './ProductionPrintView';

interface CheckoutPageProps {
    quote: Omit<Quote, 'id'> & { id?: string };
    customers: Customer[];
    products: Product[];
    termsAndConditions: string;
    companyInfo: CompanyInfo;
    onFinalizeSale: (quoteData: Omit<Quote, 'id'> & { id?: string }, paymentDetails: PaymentDetails) => void;
    onSaveAsQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => void;
    onSaveCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => void;
    onBack: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ quote, customers, products, termsAndConditions, companyInfo, onFinalizeSale, onSaveAsQuote, onSaveCustomer, onBack }) => {
    const [localQuote, setLocalQuote] = useState(quote);
    const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
    const [newlyCreatedCustomerName, setNewlyCreatedCustomerName] = useState<string | null>(null);
    const [printView, setPrintView] = useState<'customer' | 'production' | null>(null);

    // State for payment and delivery details
    const [paymentMethod, setPaymentMethod] = useState<PaymentDetails['method']>(quote.payment?.method || 'Dinheiro');
    const [discountType, setDiscountType] = useState<PaymentDetails['discountType']>(quote.payment?.discountType || 'fixed');
    const [discountValue, setDiscountValue] = useState(quote.payment?.discountValue || 0);
    const [shippingCost, setShippingCost] = useState(quote.payment?.shippingCost || 0);
    const [paymentCondition, setPaymentCondition] = useState<PaymentDetails['paymentCondition']>(quote.payment?.paymentCondition || 'À Vista');
    const [downPayment, setDownPayment] = useState(quote.payment?.downPayment || 0);
    const [isDownPaymentPaid, setIsDownPaymentPaid] = useState(quote.payment?.isDownPaymentPaid || false);
    const [deliveryDate, setDeliveryDate] = useState(quote.deliveryDate || '');


    useEffect(() => {
        if (newlyCreatedCustomerName) {
            const newCustomer = customers.find(c => c.name === newlyCreatedCustomerName);
            if (newCustomer) {
                setLocalQuote(prev => ({
                    ...prev,
                    customerId: newCustomer.id,
                    customerName: newCustomer.name,
                }));
                setNewlyCreatedCustomerName(null);
            }
        }
    }, [customers, newlyCreatedCustomerName]);
    
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedCustomer = customers.find(c => c.id === selectedId);
        if (selectedCustomer) {
            setLocalQuote(prev => ({
                ...prev,
                customerId: selectedId,
                customerName: selectedCustomer.name
            }));
        }
    };

    const handleNewCustomerSave = (customerData: Omit<Customer, 'id'> & { id?: string }) => {
        onSaveCustomer(customerData);
        setNewlyCreatedCustomerName(customerData.name);
        setIsCustomerFormOpen(false);
    };

    const subTotal = useMemo(() => {
        // The subtotal is the sum of frame prices, which now include the distributed surcharge
        return localQuote.frames.reduce((sum, frame) => sum + (frame.totalPrice * frame.quantity), 0);
    }, [localQuote.frames]);


    const finalTotal = useMemo(() => {
        let final = subTotal;
        if (discountType === 'fixed') {
            final -= discountValue;
        } else {
            final -= final * (discountValue / 100);
        }
        final += shippingCost;
        return Math.max(0, final);
    }, [subTotal, discountType, discountValue, shippingCost]);

    const paymentDetails: PaymentDetails = {
        method: paymentMethod,
        discountType,
        discountValue,
        shippingCost,
        paymentCondition,
        downPayment,
        isDownPaymentPaid,
        finalTotal
    };

    const getQuoteDataWithDetails = () => ({
        ...localQuote,
        deliveryDate,
        payment: paymentDetails,
    });
    
    const customer = useMemo(() => customers.find(c => c.id === localQuote.customerId), [customers, localQuote.customerId]);

    const handleFinalize = () => {
        onFinalizeSale(getQuoteDataWithDetails(), paymentDetails);
    };
    
    const handleSaveAsQuote = () => {
        onSaveAsQuote(getQuoteDataWithDetails());
    };
    
    const handlePrint = (type: 'customer' | 'production') => {
        setPrintView(type);
    };
    
    return (
        <>
            <div className="no-print" style={{ display: printView ? 'none' : 'block' }}>
                 <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h1 className="text-3xl font-bold text-gray-800">Finalizar Venda</h1>
                        <button onClick={onBack} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Voltar para o Orçamento
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Order Summary */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Pedido</h2>
                            <div className="bg-gray-50 p-4 rounded-md border">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Cliente</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <select value={localQuote.customerId} onChange={handleCustomerChange} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button onClick={() => setIsCustomerFormOpen(true)} className="py-2 px-4 bg-indigo-600 text-white rounded-md text-sm whitespace-nowrap">Novo Cliente</button>
                                    </div>
                                </div>
                                <h3 className="text-md font-semibold text-gray-700 mt-4 mb-2">Itens:</h3>
                                <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {localQuote.frames.map(frame => (
                                    <li key={frame.id} className="py-2">
                                        <div className="flex justify-between text-sm">
                                            <p className="font-medium text-gray-800">{frame.quantity}x {frame.name || 'Quadro'}</p>
                                            <p className="text-gray-700">R$ {(frame.totalPrice * frame.quantity).toFixed(2)}</p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                                <div className="border-t pt-2 mt-2 space-y-1">
                                    <div className="flex justify-between text-lg font-bold pt-1">
                                        <span>Subtotal:</span>
                                        <span>R$ {subTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Payment and Finalization */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagamento e Entrega</h2>
                            <div className="bg-gray-50 p-4 rounded-md border space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
                                    <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                                        <div className="flex">
                                            <select value={discountType} onChange={e => setDiscountType(e.target.value as PaymentDetails['discountType'])} className="px-3 py-2 border border-gray-300 bg-white rounded-l-md z-10">
                                                <option value="fixed">R$</option>
                                                <option value="percentage">%</option>
                                            </select>
                                            <input type="number" value={discountValue || ''} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border border-gray-300 rounded-r-md -ml-px" />
                                        </div>
                                    </div>
                                    <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-1">Frete</label>
                                         <input type="number" value={shippingCost || ''} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Condição de Pagamento</label>
                                    <select value={paymentCondition} onChange={e => setPaymentCondition(e.target.value as PaymentDetails['paymentCondition'])} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                        <option>À Vista</option>
                                        <option>Sinal + Restante</option>
                                        <option>Parcelado</option>
                                    </select>
                                </div>
                                {paymentCondition.includes('Sinal') && (
                                     <div className="grid grid-cols-2 gap-4 items-end">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Sinal</label>
                                            <input type="number" value={downPayment || ''} onChange={e => setDownPayment(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border border-gray-300 rounded-md" />
                                        </div>
                                        <div className="flex items-center h-full pb-2">
                                            <input id="isDownPaymentPaid" type="checkbox" checked={isDownPaymentPaid} onChange={e => setIsDownPaymentPaid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600"/>
                                            <label htmlFor="isDownPaymentPaid" className="ml-2 block text-sm text-gray-900">Sinal Pago</label>
                                        </div>
                                     </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentDetails['method'])} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                        <option>Dinheiro</option>
                                        <option>Cartão de Crédito</option>
                                        <option>Cartão de Débito</option>
                                        <option>PIX</option>
                                        <option>Transferência</option>
                                    </select>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-md"><span className="text-gray-600">Subtotal:</span><span className="font-medium">R$ {subTotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-md"><span className="text-gray-600">Desconto:</span><span className="font-medium text-red-600">- R$ {(subTotal - (finalTotal-shippingCost)).toFixed(2)}</span></div>
                                    <div className="flex justify-between text-md"><span className="text-gray-600">Frete:</span><span className="font-medium">R$ {shippingCost.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-2xl font-bold text-gray-900"><span>Total a Pagar:</span><span>R$ {finalTotal.toFixed(2)}</span></div>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações</h2>
                                <div className="bg-gray-50 p-4 rounded-md border space-y-3">
                                    <div className="flex gap-4">
                                        <button onClick={() => handlePrint('customer')} className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700">Imprimir (Cliente)</button>
                                        <button onClick={() => handlePrint('production')} className="w-full py-2 px-4 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600">Imprimir (Produção)</button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button onClick={handleSaveAsQuote} className="w-full py-3 px-4 bg-gray-600 border border-transparent rounded-md text-lg font-medium text-white hover:bg-gray-700">Salvar como Orçamento</button>
                                        <button onClick={handleFinalize} className="w-full py-3 px-4 bg-green-600 border border-transparent rounded-md text-lg font-medium text-white hover:bg-green-700">Finalizar Venda</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {printView === 'customer' && customer && (
                <CustomerPrintView
                    quote={getQuoteDataWithDetails()}
                    customer={customer}
                    products={products}
                    paymentDetails={paymentDetails}
                    termsAndConditions={termsAndConditions}
                    companyInfo={companyInfo}
                    onClose={() => setPrintView(null)}
                />
            )}
            {printView === 'production' && (
                <ProductionPrintView
                    quote={getQuoteDataWithDetails()}
                    products={products}
                    companyInfo={companyInfo}
                    onClose={() => setPrintView(null)}
                />
            )}
            
             {isCustomerFormOpen && (
                <CustomerForm 
                    customer={null} 
                    onSave={handleNewCustomerSave}
                    onClose={() => setIsCustomerFormOpen(false)} 
                />
             )}
        </>
    );
};

export default CheckoutPage;