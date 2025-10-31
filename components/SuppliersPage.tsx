import React, { useState } from 'react';
import { Supplier } from '../types';
import SupplierForm from './SupplierForm';

interface SuppliersPageProps {
    suppliers: Supplier[];
    onSave: (supplier: Omit<Supplier, 'id'> & { id?: string }) => void;
    onDelete: (supplierId: string) => void;
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({ suppliers, onSave, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const handleSave = (supplier: Omit<Supplier, 'id'> & { id?: string }) => {
        onSave(supplier);
        setIsFormOpen(false);
        setSelectedSupplier(null);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedSupplier(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Fornecedores</h1>
                <button onClick={handleAddNew} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                    Adicionar Fornecedor
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome da Empresa</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contato</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telefone</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(supplier => (
                            <tr key={supplier.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{supplier.name}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{supplier.contactPerson || ''}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{supplier.email || ''}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{supplier.phone || ''}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button onClick={() => handleEdit(supplier)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium">Editar</button>
                                    <button onClick={() => onDelete(supplier.id)} className="text-red-600 hover:text-red-900 font-medium">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <SupplierForm supplier={selectedSupplier} onSave={handleSave} onClose={handleCloseForm} />}
        </div>
    );
};

export default SuppliersPage;