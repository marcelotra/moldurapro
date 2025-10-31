import React, { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product } from '../types';

interface PurchaseOrderFormProps {
    order: PurchaseOrder | null;
    suppliers: Supplier[];
    products: Product[];
    onSave: (order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt'> & { id?: string }) => void;
    onClose: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ order, suppliers, products, onSave, onClose }) => {
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);
    const [status, setStatus] = useState<'Pendente' | 'Recebido' | 'Cancelado'>('Pendente');
    const [dueDate, setDueDate] = useState('');

    // State for adding new items
    const [productCode, setProductCode] = useState('');
    const [quantity, setQuantity] = useState<number | ''>(1);
    const [cost, setCost] = useState<number | ''>('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (order) {
            setSupplierId(order.supplierId);
            setItems(order.items);
            setStatus(order.status);
            setDueDate(order.dueDate || '');
        } else {
            setSupplierId(suppliers[0]?.id || '');
            setItems([]);
            setStatus('Pendente');
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            setDueDate(nextMonth.toISOString().split('T')[0]);
        }
    }, [order, suppliers]);
    
    useEffect(() => {
        const product = products.find(p => p.code.toLowerCase() === productCode.toLowerCase());
        if (product) {
            setSelectedProduct(product);
            setCost(product.cost);
        } else {
            setSelectedProduct(null);
            setCost('');
        }
    }, [productCode, products]);


    const handleAddItem = () => {
        if (selectedProduct && typeof quantity === 'number' && quantity > 0 && typeof cost === 'number' && cost >= 0) {
            const newItem: PurchaseOrderItem = {
                id: new Date().toISOString(),
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                productCode: selectedProduct.code,
                quantity,
                cost,
            };
            setItems(prev => [...prev, newItem]);
            // Reset form
            setProductCode('');
            setSelectedProduct(null);
            setQuantity(1);
            setCost('');
        } else {
            alert('Por favor, preencha o código do produto, quantidade e custo para adicionar.');
        }
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            alert('Selecione um fornecedor.');
            return;
        }
        if (items.length === 0) {
            alert('Adicione pelo menos um produto ao pedido.');
            return;
        }

        const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

        onSave({
            id: order?.id,
            supplierId,
            supplierName: supplier.name,
            items,
            totalCost,
            status,
            dueDate,
        });
    };
    
    const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {order ? 'Editar Ordem de Compra' : 'Nova Ordem de Compra'}
                        </h2>
                        
                        {/* Supplier Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                                <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-4">
                             <h3 className="text-lg font-semibold text-gray-800 mb-2">Itens do Pedido</h3>
                             <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Custo Unit.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td className="border-b px-4 py-2">{item.productName} ({item.productCode})</td>
                                            <td className="border-b px-4 py-2 text-right">{item.quantity}</td>
                                            <td className="border-b px-4 py-2 text-right">R$ {item.cost.toFixed(2)}</td>
                                            <td className="border-b px-4 py-2 text-right font-semibold">R$ {(item.cost * item.quantity).toFixed(2)}</td>
                                            <td className="border-b px-4 py-2 text-center">
                                                <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 font-bold">&times;</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                             <div className="text-right font-bold text-lg mt-2 pr-4">
                                Total: R$ {totalCost.toFixed(2)}
                             </div>
                        </div>

                        {/* Add Item Form */}
                        <div className="p-4 bg-gray-50 border rounded-md">
                            <h4 className="font-semibold mb-2">Adicionar Produto</h4>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Código do Produto</label>
                                    <input type="text" value={productCode} onChange={e => setProductCode(e.target.value)} list="product-codes" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                                    <datalist id="product-codes">
                                        {products.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
                                    </datalist>
                                     {selectedProduct && <p className="text-xs text-gray-600 mt-1">{selectedProduct.name}</p>}
                                </div>
                                <div className="col-span-2">
                                     <label className="block text-sm font-medium text-gray-700">Qtd.</label>
                                     <input type="number" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="col-span-2">
                                     <label className="block text-sm font-medium text-gray-700">Custo</label>
                                     <input type="number" value={cost} onChange={e => setCost(e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="col-span-2 flex items-end">
                                    <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full">Adicionar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="submit" className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 transition">
                            Salvar Ordem de Compra
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseOrderForm;