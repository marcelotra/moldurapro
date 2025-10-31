import React, { useState, useEffect } from 'react';
import { CompanyInfo, LaborRate, User } from '../types';
import UserForm from './UserForm';

interface SettingsPageProps {
    companyInfo: CompanyInfo;
    laborRates: LaborRate[];
    termsAndConditions: string;
    users: User[];
    onSaveCompanyInfo: (info: CompanyInfo) => void;
    onSaveLaborRates: (rates: LaborRate[]) => void;
    onSaveTerms: (terms: string) => void;
    onSaveUser: (user: Omit<User, 'id'> & { id?: string; password?: string }) => void;
    onDeleteUser: (userId: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    companyInfo, laborRates, termsAndConditions, users, 
    onSaveCompanyInfo, onSaveLaborRates, onSaveTerms, onSaveUser, onDeleteUser
}) => {
    const [activeTab, setActiveTab] = useState('company');
    const [localCompanyInfo, setLocalCompanyInfo] = useState(companyInfo);
    const [localLaborRates, setLocalLaborRates] = useState(laborRates);
    const [localTerms, setLocalTerms] = useState(termsAndConditions);
    
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => setLocalCompanyInfo(companyInfo), [companyInfo]);
    useEffect(() => setLocalLaborRates(laborRates), [laborRates]);
    useEffect(() => setLocalTerms(termsAndConditions), [termsAndConditions]);

    const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalCompanyInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalCompanyInfo(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleRateChange = (id: string, field: 'minPerimeter' | 'price', value: number) => {
        setLocalLaborRates(localLaborRates.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleAddRate = () => {
        setLocalLaborRates([...localLaborRates, { id: `new-${Date.now()}`, minPerimeter: 0, price: 0 }]);
    };
    
    const handleRemoveRate = (id: string) => {
        setLocalLaborRates(localLaborRates.filter(r => r.id !== id));
    };

    const handleSaveUser = (user: Omit<User, 'id' | 'password'> & { id: string }) => {
        onSaveUser(user);
        setIsUserFormOpen(false);
        setEditingUser(null);
    }
    
    const handleDeleteUser = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            onDeleteUser(id);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>
            
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('company')} className={`${activeTab === 'company' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Empresa</button>
                    <button onClick={() => setActiveTab('labor')} className={`${activeTab === 'labor' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Mão de Obra</button>
                    <button onClick={() => setActiveTab('terms')} className={`${activeTab === 'terms' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Termos</button>
                    <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Usuários</button>
                </nav>
            </div>

            {activeTab === 'company' && (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                    <h2 className="text-xl font-semibold mb-4">Informações da Empresa</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Logo</label>
                            {localCompanyInfo.logo && <img src={localCompanyInfo.logo} alt="logo" className="h-20 my-2" />}
                            <input type="file" onChange={handleLogoChange} />
                        </div>
                        <input name="name" value={localCompanyInfo.name} onChange={handleCompanyInfoChange} placeholder="Nome da Empresa" className="w-full p-2 border rounded"/>
                        <textarea name="address" value={localCompanyInfo.address} onChange={handleCompanyInfoChange} placeholder="Endereço" rows={3} className="w-full p-2 border rounded"/>
                        <input name="phone" value={localCompanyInfo.phone} onChange={handleCompanyInfoChange} placeholder="Telefone" className="w-full p-2 border rounded"/>
                        <input name="email" value={localCompanyInfo.email} onChange={handleCompanyInfoChange} placeholder="Email" className="w-full p-2 border rounded"/>
                        <input name="website" value={localCompanyInfo.website || ''} onChange={handleCompanyInfoChange} placeholder="Website/Rede Social" className="w-full p-2 border rounded"/>
                    </div>
                    <button onClick={() => onSaveCompanyInfo(localCompanyInfo)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar Informações</button>
                </div>
            )}
            
            {activeTab === 'labor' && (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                     <h2 className="text-xl font-semibold mb-4">Tabela de Mão de Obra (por Perímetro)</h2>
                     <div className="space-y-2">
                         {localLaborRates.map(rate => (
                            <div key={rate.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                                <span className="text-sm">A partir de</span>
                                <input type="number" value={rate.minPerimeter} onChange={e => handleRateChange(rate.id, 'minPerimeter', parseFloat(e.target.value))} className="w-24 p-1 border rounded" />
                                <span className="text-sm">cm, cobrar</span>
                                <input type="number" value={rate.price} onChange={e => handleRateChange(rate.id, 'price', parseFloat(e.target.value))} className="w-24 p-1 border rounded" />
                                <span className="text-sm">R$</span>
                                <button onClick={() => handleRemoveRate(rate.id)} className="text-red-500 font-bold">&times;</button>
                            </div>
                         ))}
                     </div>
                     <button onClick={handleAddRate} className="mt-4 text-sm bg-gray-200 hover:bg-gray-300 p-2 rounded">Adicionar Faixa</button>
                     <button onClick={() => onSaveLaborRates(localLaborRates)} className="mt-4 ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar Tabela</button>
                </div>
            )}

            {activeTab === 'terms' && (
                 <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                     <h2 className="text-xl font-semibold mb-4">Termos e Condições do Orçamento</h2>
                     <textarea value={localTerms} onChange={e => setLocalTerms(e.target.value)} rows={15} className="w-full p-2 border rounded font-mono text-sm"/>
                     <button onClick={() => onSaveTerms(localTerms)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Salvar Termos</button>
                </div>
            )}
            
            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4 text-sm text-blue-800">
                        <b>Importante:</b> A adição de novos usuários e a exclusão permanente devem ser feitas diretamente no painel do Supabase (em <b>Authentication</b>) por motivos de segurança. Use esta tela para visualizar os usuários e gerenciar seus perfis.
                    </div>
                     <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuário (Email)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="border-b px-4 py-2">{user.username}</td>
                                    <td className="border-b px-4 py-2">{user.role === 'admin' ? 'Administrador' : 'Funcionário'}</td>
                                    <td className="border-b px-4 py-2 text-right">
                                        <button onClick={() => { setEditingUser(user); setIsUserFormOpen(true); }} className="text-indigo-600 hover:text-indigo-800 font-medium mr-4">Editar Perfil</button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 font-medium">Excluir Perfil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            )}
            
            {isUserFormOpen && <UserForm user={editingUser} onSave={handleSaveUser} onClose={() => setIsUserFormOpen(false)} allUsers={users} />}
        </div>
    );
};

export default SettingsPage;