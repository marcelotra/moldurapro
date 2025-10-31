import React, { useState } from 'react';
import { PurchaseOrder, Supplier, Product } from '../types';
import PurchaseOrderForm from './PurchaseOrderForm';

interface PurchasesPageProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    onSave: (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'> & { id?: string }) => void;
    onDelete: (id: string) => void;
    onReceive: (id: string) => void;
}

const PurchasesPage: React.FC<PurchasesPageProps> = ({ purchaseOrders, suppliers, products, onSave, onDelete, onReceive }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    const handleSave = (orderData: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'> & { id?: string }) => {
        onSave(orderData);
        setIsFormOpen(false);
        setSelectedOrder(null);
    };

    const handleEdit = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedOrder(null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedOrder(null);
    };
    
    const handleDeleteClick = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta ordem de compra?')) {
            onDelete(id);
        }
    };
    
    const handleReceiveClick = (id: string) => {
        if (window.confirm('Confirma o recebimento de todos os itens desta ordem? Esta ação atualizará o estoque e o financeiro, e não poderá ser desfeita.')) {
            onReceive(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestão de Compras</h1>
                <button onClick={handleAddNew} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                    Nova Ordem de Compra
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Nº</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Fornecedor</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">Custo Total</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.map(order => (
                            <tr key={order.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.orderNumber}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.supplierName}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-semibold">R$ {order.totalCost.toFixed(2)}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                    <span className={`px-2 py-1 inline-block text-xs leading-tight rounded-full font-semibold ${
                                        order.status === 'Recebido' ? 'bg-green-100 text-green-800' :
                                        order.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm whitespace-nowrap">
                                    {order.status === 'Pendente' && (
                                        <>
                                            <button onClick={() => handleReceiveClick(order.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 mr-2">Receber</button>
                                            <button onClick={() => handleEdit(order)} className="text-indigo-600 hover:text-indigo-900 mr-2 font-medium">Editar</button>
                                            <button onClick={() => handleDeleteClick(order.id)} className="text-red-600 hover:text-red-900 font-medium">Excluir</button>
                                        </>
                                    )}
                                    {order.status === 'Recebido' && (
                                        <span className="text-gray-500 text-xs">Recebido em {new Date(order.receivedAt!).toLocaleDateString()}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {purchaseOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma ordem de compra encontrada.</td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <PurchaseOrderForm
                    order={selectedOrder}
                    suppliers={suppliers}
                    products={products}
                    onSave={handleSave}
                    onClose={handleCloseForm}
                />
            )}
        </div>
    );
};

export default PurchasesPage;
