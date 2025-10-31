import React, { useState, useMemo } from 'react';
import { CashFlowSession, CashFlowEntry } from '../types';

interface CashFlowPageProps {
    sessions: CashFlowSession[];
    entries: CashFlowEntry[];
    onOpenSession: (openingBalance: number) => void;
    onAddEntry: (entryData: Omit<CashFlowEntry, 'id' | 'createdAt'>) => void;
    onCloseSession: (sessionId: string, closingBalance: number) => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${color}`}>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
);

const CashFlowPage: React.FC<CashFlowPageProps> = ({ sessions, entries, onOpenSession, onAddEntry, onCloseSession }) => {
    const [openingBalance, setOpeningBalance] = useState<number | ''>('');
    const [isClosing, setIsClosing] = useState(false);
    const [countedBalance, setCountedBalance] = useState<number | ''>('');

    const [isEntryFormVisible, setIsEntryFormVisible] = useState(false);
    const [entryType, setEntryType] = useState<'entrada' | 'saida'>('entrada');
    const [entryDescription, setEntryDescription] = useState('');
    const [entryAmount, setEntryAmount] = useState<number | ''>('');
    const [entryMethod, setEntryMethod] = useState<CashFlowEntry['method']>('Dinheiro');

    const openSession = useMemo(() => sessions.find(s => s.status === 'aberto'), [sessions]);
    const closedSessions = useMemo(() => sessions.filter(s => s.status === 'fechado').sort((a,b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()), [sessions]);

    const sessionData = useMemo(() => {
        if (!openSession) return null;

        const sessionEntries = entries.filter(e => e.sessionId === openSession.id);
        const totalEntries = sessionEntries.filter(e => e.type === 'entrada').reduce((sum, e) => sum + e.amount, 0);
        const totalWithdrawals = sessionEntries.filter(e => e.type === 'saida').reduce((sum, e) => sum + e.amount, 0);
        const currentBalance = openSession.openingBalance + totalEntries - totalWithdrawals;
        
        return { sessionEntries, totalEntries, totalWithdrawals, currentBalance };
    }, [openSession, entries]);
    
    const handleOpenSession = () => {
        if (typeof openingBalance === 'number' && openingBalance >= 0) {
            onOpenSession(openingBalance);
            setOpeningBalance('');
        }
    };
    
    const handleCloseSession = () => {
        if (openSession && typeof countedBalance === 'number' && countedBalance >= 0) {
            onCloseSession(openSession.id, countedBalance);
            setIsClosing(false);
            setCountedBalance('');
        }
    };

    const handleAddEntry = (e: React.FormEvent) => {
        e.preventDefault();
        if (openSession && entryDescription && typeof entryAmount === 'number' && entryAmount > 0) {
            onAddEntry({
                sessionId: openSession.id,
                type: entryType,
                description: entryDescription,
                amount: entryAmount,
                method: entryMethod,
            });
            // Reset form
            setIsEntryFormVisible(false);
            setEntryDescription('');
            setEntryAmount('');
            setEntryMethod('Dinheiro');
        }
    };

    if (!openSession) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Caixa</h1>
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhum caixa aberto</h2>
                    <p className="text-gray-600 mb-4">Para começar a registrar as movimentações, abra o caixa informando o saldo inicial.</p>
                    <div className="mt-4 max-w-sm mx-auto">
                        <label htmlFor="opening-balance" className="block text-sm font-medium text-gray-700">Saldo Inicial em Dinheiro</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">R$</span>
                            <input
                                type="number"
                                id="opening-balance"
                                value={openingBalance}
                                onChange={e => setOpeningBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="0.00"
                                className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                            />
                        </div>
                        <button
                            onClick={handleOpenSession}
                            className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                        >
                            Abrir Caixa
                        </button>
                    </div>
                </div>

                {closedSessions.length > 0 && (
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Sessões Anteriores</h2>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full leading-normal">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Abertura</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {closedSessions.map(s => (
                                        <tr key={s.id}>
                                            <td className="border-b px-4 py-2 text-sm">{new Date(s.openedAt).toLocaleString()}</td>
                                            <td className="border-b px-4 py-2 text-sm text-right">R$ {s.openingBalance.toFixed(2)}</td>
                                            <td className="border-b px-4 py-2 text-sm text-right">R$ {s.closingBalance?.toFixed(2)}</td>
                                            <td className={`border-b px-4 py-2 text-sm text-right font-bold ${s.difference && s.difference > 0 ? 'text-green-600' : s.difference && s.difference < 0 ? 'text-red-600' : ''}`}>
                                                R$ {s.difference?.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Caixa (Aberto)</h1>
                <div>
                    {!isClosing ? (
                        <button onClick={() => setIsClosing(true)} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
                            Fechar Caixa
                        </button>
                    ) : (
                         <button onClick={() => { setIsClosing(false); setCountedBalance(''); }} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition">
                            Cancelar Fechamento
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Saldo Inicial" value={`R$ ${openSession.openingBalance.toFixed(2)}`} color="border-gray-500" />
                <StatCard title="Total de Entradas" value={`R$ ${sessionData?.totalEntries.toFixed(2)}`} color="border-green-500" />
                <StatCard title="Total de Saídas" value={`R$ ${sessionData?.totalWithdrawals.toFixed(2)}`} color="border-red-500" />
                <StatCard title="Saldo Atual (Calculado)" value={`R$ ${sessionData?.currentBalance.toFixed(2)}`} color="border-blue-500" />
            </div>

            {/* Closing Form */}
            {isClosing && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                    <h2 className="text-xl font-semibold text-yellow-800 mb-2">Fechar Caixa</h2>
                    <p className="text-sm text-yellow-700 mb-4">Conte todo o dinheiro em caixa e insira o valor total abaixo para fechar a sessão.</p>
                    <div className="flex items-center gap-4">
                        <label className="font-medium">Valor Contado:</label>
                        <input
                            type="number"
                            value={countedBalance}
                            onChange={e => setCountedBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            placeholder="0.00"
                            className="p-2 border rounded-md"
                        />
                        <button onClick={handleCloseSession} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Confirmar Fechamento</button>
                    </div>
                </div>
            )}

            {/* Entry Form and Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-semibold text-gray-800">Movimentações do Dia</h2>
                     <button onClick={() => setIsEntryFormVisible(!isEntryFormVisible)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                        {isEntryFormVisible ? 'Cancelar' : 'Nova Movimentação'}
                    </button>
                </div>

                {isEntryFormVisible && (
                     <form onSubmit={handleAddEntry} className="p-4 bg-gray-50 rounded-md mb-6 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                <select value={entryType} onChange={e => setEntryType(e.target.value as 'entrada' | 'saida')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="entrada">Entrada (Recebimento)</option>
                                    <option value="saida">Saída (Pagamento/Sangria)</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <input type="text" value={entryDescription} onChange={e => setEntryDescription(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Valor</label>
                                <input type="number" value={entryAmount} onChange={e => setEntryAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0.01" step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                             </div>
                         </div>
                         <div className="flex justify-between items-end">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Forma</label>
                                <select value={entryMethod} onChange={e => setEntryMethod(e.target.value as CashFlowEntry['method'])} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option>Dinheiro</option><option>PIX</option><option>Cartão de Crédito</option><option>Cartão de Débito</option><option>Transferência</option><option>Outro</option>
                                </select>
                             </div>
                             <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">Adicionar</button>
                         </div>
                     </form>
                )}
                
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forma</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessionData?.sessionEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td className="border-b px-4 py-2 text-sm">{new Date(entry.createdAt).toLocaleTimeString()}</td>
                                    <td className="border-b px-4 py-2 text-sm">{entry.description}</td>
                                    <td className="border-b px-4 py-2 text-sm">{entry.method}</td>
                                    <td className={`border-b px-4 py-2 text-sm text-right font-semibold ${entry.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.type === 'saida' && '- '}R$ {entry.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CashFlowPage;
