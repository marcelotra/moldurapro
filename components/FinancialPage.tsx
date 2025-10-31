import React, { useState, useMemo } from 'react';
import { AccountReceivable, AccountPayable, CashFlowEntry } from '../types';
import PaymentModal from './PaymentModal';

interface FinancialPageProps {
    accountsReceivable: AccountReceivable[];
    accountsPayable: AccountPayable[];
    onRegisterPayment: (receivableId: string, amount: number, method: CashFlowEntry['method']) => void;
    onMakePayment: (payableId: string, amount: number, method: CashFlowEntry['method']) => void;
}

type ActiveTab = 'receivable' | 'payable';
type FilterStatus = 'all' | 'Pendente' | 'Pago Parcialmente' | 'Pago' | 'vencido';

const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${color}`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

const FinancialPage: React.FC<FinancialPageProps> = ({ accountsReceivable, accountsPayable, onRegisterPayment, onMakePayment }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('receivable');
    const [paymentModalData, setPaymentModalData] = useState<{ type: ActiveTab, account: AccountReceivable | AccountPayable } | null>(null);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterName, setFilterName] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const isOverdue = (dueDate: string, status: string) => {
        if (status === 'Pago') return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        return new Date(dueDate) < today;
    };

    const financialData = useMemo(() => {
        const totalReceivable = accountsReceivable.filter(ar => ar.status !== 'Pago').reduce((sum, ar) => sum + (ar.totalAmount - ar.paidAmount), 0);
        const overdueReceivable = accountsReceivable.filter(ar => isOverdue(ar.dueDate, ar.status)).reduce((sum, ar) => sum + (ar.totalAmount - ar.paidAmount), 0);

        const totalPayable = accountsPayable.filter(ap => ap.status !== 'Pago').reduce((sum, ap) => sum + (ap.totalAmount - ap.paidAmount), 0);
        const overduePayable = accountsPayable.filter(ap => isOverdue(ap.dueDate, ap.status)).reduce((sum, ap) => sum + (ap.totalAmount - ap.paidAmount), 0);

        return {
            totalReceivable,
            overdueReceivable,
            totalPayable,
            overduePayable,
        };
    }, [accountsReceivable, accountsPayable]);
    
    const applyFilters = <T extends AccountReceivable | AccountPayable>(accounts: T[]): T[] => {
        return accounts.filter(acc => {
            // Name filter
            const name = 'customerName' in acc ? acc.customerName : acc.supplierName;
            if (filterName && !name.toLowerCase().includes(filterName.toLowerCase())) return false;
            
            // Status filter
            if (filterStatus !== 'all') {
                if(filterStatus === 'vencido') {
                    if(!isOverdue(acc.dueDate, acc.status)) return false;
                } else if (acc.status !== filterStatus) return false;
            }

            // Date filter
            const dueDate = new Date(acc.dueDate);
            if (filterStartDate) {
                const startDate = new Date(filterStartDate);
                startDate.setHours(0,0,0,0);
                if (dueDate < startDate) return false;
            }
            if (filterEndDate) {
                const endDate = new Date(filterEndDate);
                endDate.setHours(23,59,59,999);
                if (dueDate > endDate) return false;
            }

            return true;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const filteredReceivables = useMemo(() => applyFilters(accountsReceivable), [accountsReceivable, filterStatus, filterName, filterStartDate, filterEndDate]);
    const filteredPayables = useMemo(() => applyFilters(accountsPayable), [accountsPayable, filterStatus, filterName, filterStartDate, filterEndDate]);


    const handleSavePayment = (accountId: string, amount: number, method: CashFlowEntry['method']) => {
        if (paymentModalData?.type === 'receivable') {
            onRegisterPayment(accountId, amount, method);
        } else {
            onMakePayment(accountId, amount, method);
        }
        setPaymentModalData(null);
    };
    
    const resetFilters = () => {
        setFilterStatus('all');
        setFilterName('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Financeiro</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total a Receber" value={`R$ ${financialData.totalReceivable.toFixed(2)}`} color="border-green-500" />
                <StatCard title="Recebimentos Vencidos" value={`R$ ${financialData.overdueReceivable.toFixed(2)}`} color="border-yellow-500" />
                <StatCard title="Total a Pagar" value={`R$ ${financialData.totalPayable.toFixed(2)}`} color="border-red-500" />
                <StatCard title="Pagamentos Vencidos" value={`R$ ${financialData.overduePayable.toFixed(2)}`} color="border-orange-500" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => { setActiveTab('receivable'); resetFilters(); }} className={`${activeTab === 'receivable' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Contas a Receber
                        </button>
                        <button onClick={() => { setActiveTab('payable'); resetFilters(); }} className={`${activeTab === 'payable' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            Contas a Pagar
                        </button>
                    </nav>
                </div>

                <div className="p-4 bg-gray-50 my-4 rounded-md">
                    <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Vencimento Início</label>
                            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                         <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Vencimento Fim</label>
                            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)} className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                                <option value="all">Todos</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Pago Parcialmente">Pago Parcialmente</option>
                                <option value="Pago">Pago</option>
                                <option value="vencido">Vencido</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-sm font-medium text-gray-600">{activeTab === 'receivable' ? 'Cliente' : 'Fornecedor'}</label>
                            <input type="text" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Buscar por nome..." className="w-full mt-1 p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="col-span-1">
                            <button onClick={resetFilters} className="w-full bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600">Limpar</button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4">
                    {activeTab === 'receivable' && (
                        <table className="min-w-full leading-normal">
                             <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Valor Total</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Valor Pendente</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                                </tr>
                            </thead>
                             <tbody>
                                {filteredReceivables.map(ar => (
                                    <tr key={ar.id} className={`${isOverdue(ar.dueDate, ar.status) ? 'bg-yellow-50' : ''}`}>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-semibold">{new Date(ar.dueDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{ar.customerName} (#{ar.quoteNumber})</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">R$ {ar.totalAmount.toFixed(2)}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-bold">R$ {(ar.totalAmount - ar.paidAmount).toFixed(2)}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                                            <span className={`px-2 py-1 text-xs leading-tight rounded-full font-semibold ${
                                                ar.status === 'Pago' ? 'bg-green-100 text-green-800' :
                                                ar.status === 'Pago Parcialmente' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>{ar.status}</span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                            {ar.status !== 'Pago' && <button onClick={() => setPaymentModalData({ type: 'receivable', account: ar })} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">Registrar Pagamento</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {activeTab === 'payable' && (
                         <table className="min-w-full leading-normal">
                             <thead>
                                <tr>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Fornecedor</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Valor Total</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Valor Pendente</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                                </tr>
                            </thead>
                             <tbody>
                                {filteredPayables.map(ap => (
                                     <tr key={ap.id} className={`${isOverdue(ap.dueDate, ap.status) ? 'bg-yellow-50' : ''}`}>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm font-semibold">{new Date(ap.dueDate).toLocaleDateString()}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm">{ap.supplierName} (#{ap.purchaseOrderNumber})</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">R$ {ap.totalAmount.toFixed(2)}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right font-bold">R$ {(ap.totalAmount - ap.paidAmount).toFixed(2)}</td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-center">
                                            <span className={`px-2 py-1 text-xs leading-tight rounded-full font-semibold ${
                                                ap.status === 'Pago' ? 'bg-green-100 text-green-800' :
                                                ap.status === 'Pago Parcialmente' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>{ap.status}</span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-sm text-right">
                                            {ap.status !== 'Pago' && <button onClick={() => setPaymentModalData({ type: 'payable', account: ap })} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">Registrar Pagamento</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {paymentModalData && (
                <PaymentModal 
                    account={paymentModalData.account}
                    type={paymentModalData.type}
                    onClose={() => setPaymentModalData(null)}
                    onSave={handleSavePayment}
                />
            )}
        </div>
    );
};

export default FinancialPage;