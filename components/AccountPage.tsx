import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AccountPage: React.FC = () => {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('error');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!isSupabaseConfigured) {
            setMessage('A alteração de senha não está disponível no modo de demonstração.');
            setMessageType('error');
            return;
        }

        if (newPassword.length < 6) {
             setMessage('A nova senha deve ter pelo menos 6 caracteres.');
            setMessageType('error');
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('A nova senha e a confirmação não correspondem.');
            setMessageType('error');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage(`Ocorreu um erro: ${error.message}`);
            setMessageType('error');
        } else {
            setMessage('Senha alterada com sucesso!');
            setMessageType('success');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Minha Conta</h1>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
                <h2 className="text-xl font-semibold mb-2">Informações do Usuário</h2>
                <p className="mb-6"><span className="font-medium">Usuário:</span> {user?.username} | <span className="font-medium">Perfil:</span> {user?.role === 'admin' ? 'Administrador' : 'Funcionário'}</p>

                <h2 className="text-xl font-semibold mb-4 border-t pt-4">Alterar Senha</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>

                    {message && (
                        <p className={`text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}

                    <div>
                        <button type="submit" className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                            Salvar Nova Senha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountPage;