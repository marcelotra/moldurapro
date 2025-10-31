import React, { useState } from 'react';
import { AccountReceivable, AccountPayable, CashFlowEntry } from '../types';

interface PaymentModalProps {
    account: AccountReceivable | AccountPayable;
    type: 'receivable' | 'payable';
    onClose: () => void;
    onSave: (accountId: string, amount: number, method: CashFlowEntry['method']) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ account, type, onClose, onSave }) => {
    const remainingAmount = account.totalAmount - account.paidAmount;
    
    const [amount, setAmount] = useState<number | ''>(remainingAmount);
    const [method, setMethod] = useState<CashFlowEntry['method']>('Dinheiro');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof amount !== 'number' || amount <= 0) {
            alert('O valor do pagamento deve ser maior que zero.');
            return;
        }
        if (amount > remainingAmount) {
            alert(`O valor do pagamento (R$ ${amount.toFixed(2)}) não pode ser maior que o valor pendente (R$ ${remainingAmount.toFixed(2)}).`);
            return;
        }
        onSave(account.id, amount, method);
    };

    const title = type === 'receivable' ? 'Registrar Recebimento' : 'Registrar Pagamento';
    const partyLabel = type === 'receivable' ? 'Cliente' : 'Fornecedor';
    const partyName = 'customerName' in account ? account.customerName : account.supplierName;
    const saveButtonColor = type === 'receivable' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                        <div className="text-sm text-gray-600 mb-6">
                            <p><span className="font-semibold">{partyLabel}:</span> {partyName}</p>
                            <p><span className="font-semibold">Valor Pendente:</span> <span className="font-bold text-lg">R$ {remainingAmount.toFixed(2)}</span></p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor a Registrar</label>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    id="amount" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                                    required 
                                    max={remainingAmount}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="method" className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                                <select 
                                    name="method" 
                                    id="method" 
                                    value={method} 
                                    onChange={e => setMethod(e.target.value as CashFlowEntry['method'])} 
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
                                >
                                    <option>Dinheiro</option>
                                    <option>PIX</option>
                                    <option>Cartão de Crédito</option>
                                    <option>Cartão de Débito</option>
                                    <option>Transferência</option>
                                    <option>Outro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit" className={`py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white ${saveButtonColor} transition`}>
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;