import React, { useState, useMemo } from 'react';
import { Quote, Customer, Product, PaymentDetails, CompanyInfo, LaborRate } from '../types';
import QuoteForm from './QuoteForm';
import CustomerPrintView from './CustomerPrintView';
import ProductionPrintView from './ProductionPrintView';

interface QuotesPageProps {
    quotes: Quote[];
    customers: Customer[];
    products: Product[];
    termsAndConditions: string;
    companyInfo: CompanyInfo;
    laborRates: LaborRate[];
    onProceedToCheckout: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => void;
    onSave: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => void;
    onDelete: (quoteId: string) => void;
    onDuplicate: (quoteId: string) => void;
}

const QuotesPage: React.FC<QuotesPageProps> = ({ quotes, customers, products, termsAndConditions, companyInfo, laborRates, onProceedToCheckout, onSave, onDelete, onDuplicate }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [printingQuote, setPrintingQuote] = useState<Quote | null>(null);
    const [printView, setPrintView] = useState<'customer' | 'production' | null>(null);
    const [showPrintOptions, setShowPrintOptions] = useState<string | null>(null);
    
    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCustomer, setFilterCustomer] = useState<string>('all');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');


    const handleProceed = (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => {
        onProceedToCheckout(quoteData);
    };
    
    const handleSaveDraft = (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> & {id?: string}) => {
        onSave(quoteData);
        setView('list');
        setSelectedQuote(null);
    }

    const handleEdit = (quote: Quote) => {
        setSelectedQuote(quote);
        setView('form');
    };

    const handleAddNew = () => {
        setSelectedQuote(null);
        setView('form');
    };
    
    const handleCancelForm = () => {
        setView('list');
        setSelectedQuote(null);
    };

    const handleStatusChange = (quote: Quote, newStatus: Quote['status']) => {
        onSave({ ...quote, status: newStatus });
    };

    const handlePrint = (quote: Quote, type: 'customer' | 'production') => {
        setPrintingQuote(quote);
        setPrintView(type);
        setShowPrintOptions(null);
    };

    const handleClosePrintView = () => {
        setPrintingQuote(null);
        setPrintView(null);
    };
    
    const filteredQuotes = useMemo(() => {
        return quotes
            .filter(q => {
                if (filterStatus !== 'all' && q.status !== filterStatus) return false;
                if (filterCustomer !== 'all' && q.customerId !== filterCustomer) return false;
                
                const quoteDate = new Date(q.createdAt);
                if (filterStartDate) {
                    const startDate = new Date(filterStartDate);
                    startDate.setHours(0,0,0,0);
                    if (quoteDate < startDate) return false;
                }
                if (filterEndDate) {
                    const endDate = new Date(filterEndDate);
                    endDate.setHours(23,59,59,999);
                    if (quoteDate > endDate) return false;
                }
                
                return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [quotes, filterStatus, filterCustomer, filterStartDate, filterEndDate]);
    
    const resetFilters = () => {
        setFilterStatus('all');
        setFilterCustomer('all');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const getAggregateProductionStatus = (quote: Quote) => {
        if (quote.status !== 'Aprovado' && quote.status !== 'Vendido') {
            return <span className="text-gray-400">-</span>;
        }

        if (!quote.frames || quote.frames.length === 0) {
            return <span className="text-gray-400">-</span>;
        }

        const statuses = quote.frames.map(f => f.productionStatus);
        const baseClasses = "px-2 py-1 inline-block text-xs leading-tight rounded-full font-semibold";

        if (statuses.every(s => s === 'Entregue')) {
            return <span className={`${baseClasses} bg-purple-200 text-purple-800`}>Entregue</span>;
        }
        
        if (statuses.every(s => s === 'Pronto' || s === 'Entregue')) {
            return <span className={`${baseClasses} bg-teal-200 text-teal-800`}>Pronto</span>;
        }
        
        return <span className={`${baseClasses} bg-cyan-200 text-cyan-800`}>Em produção</span>;
    };

    if (view === 'form') {
        return <QuoteForm 
                    quote={selectedQuote} 
                    customers={customers}
                    products={products}
                    laborRates={laborRates}
                    onProceedToCheckout={handleProceed} 
                    onSaveDraft={handleSaveDraft}
                    onCancel={handleCancelForm} 
                />;
    }

    const customerForPrintingQuote = printingQuote ? customers.find(c => c.id === printingQuote.customerId) : null;

    const defaultPaymentDetails: PaymentDetails | undefined = printingQuote ? {
        method: 'Dinheiro',
        discountType: 'fixed',
        discountValue: 0,
        shippingCost: 0,
        paymentCondition: 'À Vista',
        downPayment: 0,
        isDownPaymentPaid: false,
        finalTotal: printingQuote.total,
    } : undefined;
    
    const paymentDetailsForPrint = (printingQuote?.payment || defaultPaymentDetails)!;

    return (
        <>
            {printView === 'customer' && printingQuote && customerForPrintingQuote && (
                <CustomerPrintView
                    quote={printingQuote}
                    customer={customerForPrintingQuote}
                    products={products}
                    paymentDetails={paymentDetailsForPrint}
                    termsAndConditions={termsAndConditions}
                    companyInfo={companyInfo}
                    onClose={handleClosePrintView}
                />
            )}
            {printView === 'production' && printingQuote && (
                <ProductionPrintView
                    quote={printingQuote}
                    products={products}
                    companyInfo={companyInfo}
                    onClose={handleClosePrintView}
                />
            )}
        
            <div className="no-print" style={{ display: printView ? 'none' : 'block' }}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Orçamentos e Vendas</h1>
                    <button onClick={handleAddNew} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                        Novo Orçamento
                    </button>
                </div>
                
                 <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                                <option value="all">Todos</option>
                                <option value="Orçamento">Orçamento</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Recusado">Recusado</option>
                                <option value="Vendido">Vendido</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Cliente</label>
                            <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                                <option value="all">Todos</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Data Início</label>
                            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                         <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Data Fim</label>
                            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="col-span-1">
                            <button onClick={resetFilters} className="w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600">Limpar Filtros</button>
                        </div>
                    </div>
                </div>


                 <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nº</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Lucro</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Venda</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Produção</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.map(quote => {
                                const totalCost = quote.frames.reduce((sum, f) => sum + (f.totalCost * f.quantity), 0);
                                const profit = quote.total - totalCost;

                                return (
                                <tr key={quote.id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{quote.quoteNumber}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{quote.customerName}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(quote.createdAt).toLocaleDateString()}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-semibold">R$ {quote.total.toFixed(2)}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-semibold text-green-700">R$ {profit.toFixed(2)}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <select
                                            value={quote.status}
                                            onChange={(e) => handleStatusChange(quote, e.target.value as Quote['status'])}
                                            className={`w-full appearance-none border-none text-center rounded-full px-2 py-1 font-semibold leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                                                quote.status === 'Vendido' ? 'bg-green-100 text-green-800' :
                                                quote.status === 'Aprovado' ? 'bg-blue-100 text-blue-800' :
                                                quote.status === 'Recusado' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            <option value="Orçamento">Orçamento</option>
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Recusado">Recusado</option>
                                            <option value="Vendido">Vendido</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {getAggregateProductionStatus(quote)}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm whitespace-nowrap">
                                        <button onClick={() => handleEdit(quote)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium">Editar</button>
                                        <button onClick={() => onDuplicate(quote.id)} className="text-green-600 hover:text-green-900 mr-4 font-medium">Duplicar</button>
                                         <div className="relative inline-block text-left">
                                            <button
                                                onClick={() => setShowPrintOptions(showPrintOptions === quote.id ? null : quote.id)}
                                                className="text-gray-600 hover:text-gray-900 font-medium mr-4"
                                            >
                                                Imprimir
                                            </button>
                                            {showPrintOptions === quote.id && (
                                                <div 
                                                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                                                  onMouseLeave={() => setShowPrintOptions(null)}
                                                >
                                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handlePrint(quote, 'customer'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Recibo (Cliente)</a>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handlePrint(quote, 'production'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Ordem (Produção)</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => onDelete(quote.id)} className="text-red-600 hover:text-red-900 font-medium">Excluir</button>
                                    </td>
                                </tr>
                                )
                            })}
                             {filteredQuotes.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">Nenhum resultado encontrado para os filtros aplicados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default QuotesPage;