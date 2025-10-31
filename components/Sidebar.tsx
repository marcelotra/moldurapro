import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Page } from '../App';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    userRole: 'admin' | 'employee';
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, userRole }) => {
    const { logout, user } = useAuth();

    if (!user) {
        return null; // Should not happen if App logic is correct, but a good safeguard.
    }

    const navItems: { page: Page; label: string; icon: string; adminOnly: boolean }[] = [
        { page: 'dashboard', label: 'Dashboard', icon: '📊', adminOnly: false },
        { page: 'studio', label: 'Estúdio Virtual', icon: '🖼️', adminOnly: false },
        { page: 'quotes', label: 'Orçamentos e Vendas', icon: '📝', adminOnly: false },
        { page: 'production', label: 'Produção', icon: '🏭', adminOnly: false },
        { page: 'cutting', label: 'Plano de Corte', icon: '✂️', adminOnly: false },
        { page: 'customers', label: 'Clientes', icon: '👥', adminOnly: false },
        { page: 'products', label: 'Produtos', icon: '📦', adminOnly: false },
        { page: 'suppliers', label: 'Fornecedores', icon: '🚚', adminOnly: false },
        { page: 'purchases', label: 'Compras', icon: '🛒', adminOnly: true },
        { page: 'financial', label: 'Financeiro', icon: '💰', adminOnly: true },
        { page: 'cashflow', label: 'Caixa', icon: '💵', adminOnly: false },
        { page: 'reports', label: 'Relatórios', icon: '📈', adminOnly: true },
        { page: 'settings', label: 'Configurações', icon: '⚙️', adminOnly: true },
    ];
    
    const availableNavItems = navItems.filter(item => !item.adminOnly || userRole === 'admin');

    return (
        <aside className="w-64 bg-gray-800 text-white flex flex-col no-print">
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold text-center">MolduraSoft</h1>
            </div>
            <nav className="flex-grow p-4">
                <ul>
                    {availableNavItems.map(item => (
                        <li key={item.page} className="mb-2">
                            <button
                                onClick={() => onNavigate(item.page)}
                                className={`w-full text-left flex items-center p-2 rounded-md transition-colors ${
                                    currentPage === item.page
                                        ? 'bg-indigo-600'
                                        : 'hover:bg-gray-700'
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                 <button
                    onClick={() => onNavigate('account')}
                    className={`w-full text-left flex items-center p-2 rounded-md transition-colors mb-2 ${
                        currentPage === 'account' ? 'bg-indigo-600' : 'hover:bg-gray-700'
                    }`}
                >
                    <span className="mr-3">👤</span>
                    Minha Conta
                </button>
                <p className="text-sm text-gray-400">Usuário: <span className="font-semibold">{user.username}</span></p>
                <p className="text-sm text-gray-400">Perfil: <span className="font-semibold">{user.role === 'admin' ? 'Admin' : 'Funcionário'}</span></p>
                <button onClick={logout} className="w-full mt-4 p-2 bg-red-600 rounded-md hover:bg-red-700 transition">
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;