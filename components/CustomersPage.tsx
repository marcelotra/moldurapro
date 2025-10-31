import React, { useState, useMemo } from 'react';
import { Customer, Quote, CustomerNote } from '../types';
import CustomerForm from './CustomerForm';

interface CustomersPageProps {
    customers: Customer[];
    quotes: Quote[];
    customerNotes: CustomerNote[];
    onSave: (customer: Omit<Customer, 'id'> & { id?: string }) => void;
    onDelete: (customerId: string) => void;
    onSaveNote: (note: Omit<CustomerNote, 'id' | 'createdAt'>) => void;
    onDeleteNote: (noteId: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, quotes, customerNotes, onSave, onDelete, onSaveNote, onDeleteNote }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
    const [activeTab, setActiveTab] = useState<'history' | 'notes'>('history');
    const [newNoteContent, setNewNoteContent] = useState('');

    const handleSave = (customer: Omit<Customer, 'id'> & { id?: string }) => {
        onSave(customer);
        setIsFormOpen(false);
        setEditingCustomer(null);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCustomer(null);
    };
    
    const handleDelete = (customerId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Todas as suas notas também serão removidas.')) {
            onDelete(customerId);
            if(selectedCustomerId === customerId) {
                setSelectedCustomerId(customers.length > 1 ? customers.find(c => c.id !== customerId)!.id : null);
            }
        }
    };

    const handleAddNote = () => {
        if (newNoteContent.trim() && selectedCustomerId) {
            onSaveNote({
                customerId: selectedCustomerId,
                content: newNoteContent.trim()
            });
            setNewNoteContent('');
        }
    };

    const handleDeleteNote = (noteId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
            onDeleteNote(noteId);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.documentNumber && c.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) return null;
        return customers.find(c => c.id === selectedCustomerId);
    }, [selectedCustomerId, customers]);

    const customerQuotes = useMemo(() => {
        if (!selectedCustomer) return [];
        return quotes
            .filter(q => q.customerId === selectedCustomer.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [selectedCustomer, quotes]);

    const selectedCustomerNotes = useMemo(() => {
        if (!selectedCustomerId) return [];
        return customerNotes
            .filter(note => note.customerId === selectedCustomerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [selectedCustomerId, customerNotes]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
            </div>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Customer List */}
                <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md flex flex-col">
                    <div className="flex items-center space-x-2 mb-4">
                        <input 
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={handleAddNew} className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                    </div>
                    <ul className="flex-grow overflow-y-auto divide-y divide-gray-200">
                        {filteredCustomers.map(customer => (
                            <li key={customer.id} 
                                onClick={() => { setSelectedCustomerId(customer.id); setActiveTab('history'); }}
                                className={`p-3 cursor-pointer rounded-md transition-colors ${selectedCustomerId === customer.id ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}
                            >
                                <p className={`font-semibold ${selectedCustomerId === customer.id ? 'text-indigo-800' : 'text-gray-800'}`}>{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.phone}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Column: Customer Details */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    {selectedCustomer ? (
                        <div>
                             <div className="flex justify-between items-start mb-4 pb-4 border-b">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedCustomer.documentNumber}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(selectedCustomer)} className="text-indigo-600 hover:text-indigo-900 font-medium py-1 px-3 rounded-md hover:bg-indigo-50">Editar</button>
                                    <button onClick={() => handleDelete(selectedCustomer.id)} className="text-red-600 hover:text-red-900 font-medium py-1 px-3 rounded-md hover:bg-red-50">Excluir</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                                <div className="space-y-1">
                                    <p className="text-gray-500 font-medium">Email</p>
                                    <p className="text-gray-800">{selectedCustomer.email || 'N/A'}</p>
                                </div>
                                 <div className="space-y-1">
                                    <p className="text-gray-500 font-medium">Telefone</p>
                                    <p className="text-gray-800">{selectedCustomer.phone}</p>
                                </div>
                                 <div className="space-y-1 md:col-span-2">
                                    <p className="text-gray-500 font-medium">Endereço</p>
                                    <p className="text-gray-800">{selectedCustomer.address}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                        <button onClick={() => setActiveTab('history')} className={`${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                                            Histórico de Pedidos
                                        </button>
                                        <button onClick={() => setActiveTab('notes')} className={`${activeTab === 'notes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                                            Notas e Atividades
                                        </button>
                                    </nav>
                                </div>

                                <div className="mt-4">
                                    {activeTab === 'history' && (
                                        <div className="overflow-y-auto max-h-96 border rounded-md">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-600">Nº Pedido</th>
                                                        <th className="px-4 py-2 text-left font-medium text-gray-600">Data</th>
                                                        <th className="px-4 py-2 text-right font-medium text-gray-600">Valor</th>
                                                        <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {customerQuotes.map(quote => (
                                                        <tr key={quote.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 whitespace-nowrap">{quote.quoteNumber}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(quote.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 text-right whitespace-nowrap font-semibold">R$ {quote.total.toFixed(2)}</td>
                                                            <td className="px-4 py-2 text-center whitespace-nowrap">
                                                                <span className={`px-2 py-1 inline-block text-xs leading-tight rounded-full font-semibold ${
                                                                    quote.status === 'Vendido' ? 'bg-green-100 text-green-800' :
                                                                    quote.status === 'Aprovado' ? 'bg-blue-100 text-blue-800' :
                                                                    quote.status === 'Recusado' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {quote.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {customerQuotes.length === 0 && (
                                                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nenhum pedido encontrado.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {activeTab === 'notes' && (
                                        <div>
                                            <div className="mb-4">
                                                <textarea 
                                                    value={newNoteContent} 
                                                    onChange={e => setNewNoteContent(e.target.value)} 
                                                    rows={3} 
                                                    placeholder="Adicionar nova nota..." 
                                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <button 
                                                    onClick={handleAddNote} 
                                                    className="mt-2 py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
                                                >
                                                    Salvar Nota
                                                </button>
                                            </div>
                                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                                {selectedCustomerNotes.map(note => (
                                                    <div key={note.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                                        <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
                                                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                                                            <button 
                                                                onClick={() => handleDeleteNote(note.id)} 
                                                                className="text-red-500 hover:text-red-700 font-medium"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                 {selectedCustomerNotes.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">Nenhuma nota encontrada.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Selecione um cliente para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen && <CustomerForm customer={editingCustomer} onSave={handleSave} onClose={handleCloseForm} />}
        </div>
    );
};

export default CustomersPage;