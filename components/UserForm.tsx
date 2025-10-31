import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface UserFormProps {
    user: User | null;
    onSave: (user: Omit<User, 'id' | 'password'> & { id: string }) => void;
    onClose: () => void;
    allUsers: User[];
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose }) => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<'admin' | 'employee'>('employee');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setRole(user.role);
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError('Nenhum usuário selecionado para edição.');
            return;
        }

        onSave({
            id: user.id,
            username,
            role,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            Editar Perfil do Usuário
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                                <input 
                                    type="text" 
                                    id="username" 
                                    value={username} 
                                    disabled
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Perfil</label>
                                 <select id="role" value={role} onChange={e => setRole(e.target.value as 'admin' | 'employee')} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md">
                                    <option value="employee">Funcionário</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;