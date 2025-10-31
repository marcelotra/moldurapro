import React, { useState, useEffect } from 'react';
import { Product, Supplier, ProductType } from '../types';

interface ProductFormProps {
    product: Product | null;
    suppliers: Supplier[];
    onSave: (product: Omit<Product, 'id'> & { id?: string }) => void;
    onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, suppliers, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        code: '',
        productType: 'moldura',
        supplierId: null,
        cost: 0,
        price: 0,
        width: 0,
        length: 0,
        sheetWidth: 0,
        sheetHeight: 0,
        stockQuantity: 0,
        unit: 'm',
        imageUrl: '',
        color: '',
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                code: product.code,
                productType: product.productType,
                supplierId: product.supplierId,
                cost: product.cost,
                price: product.price,
                width: product.width || 0,
                length: product.length || 0,
                sheetWidth: product.sheetWidth || 0,
                sheetHeight: product.sheetHeight || 0,
                stockQuantity: product.stockQuantity || 0,
                unit: product.unit || 'm',
                imageUrl: product.imageUrl || '',
                color: product.color || '',
            });
        } else {
             setFormData({ name: '', code: '', productType: 'moldura', supplierId: suppliers[0]?.id || null, cost: 0, price: 0, width: 0, length: 0, sheetWidth: 0, sheetHeight: 0, stockQuantity: 0, unit: 'm', imageUrl: '', color: '' });
        }
    }, [product, suppliers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = ['cost', 'price', 'width', 'length', 'sheetWidth', 'sheetHeight', 'stockQuantity'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSend: Omit<Product, 'id'> & { id?: string } = { ...formData, id: product?.id };
    
        if (dataToSend.productType !== 'moldura') {
            dataToSend.width = undefined;
            dataToSend.length = undefined;
        }
        if (!['passe-partout', 'vidro', 'fundo', 'substrato'].includes(dataToSend.productType)) {
            dataToSend.sheetWidth = undefined;
            dataToSend.sheetHeight = undefined;
        }
        onSave(dataToSend);
    };
    
    const productTypes: { value: ProductType, label: string }[] = [
        { value: 'moldura', label: 'Moldura' },
        { value: 'vidro', label: 'Vidro' },
        { value: 'fundo', label: 'Fundo (Backing)' },
        { value: 'passe-partout', label: 'Passe-partout' },
        { value: 'substrato', label: 'Substrato' },
        { value: 'servico', label: 'Serviço' },
        { value: 'chassis', label: 'Chassis' },
        { value: 'impressao', label: 'Impressão' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 hover:scale-100">
                <form onSubmit={handleSubmit}>
                    <div className="p-8 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {product ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Imagem do Produto</label>
                                <div className="mt-1 flex items-center space-x-4 p-4 border border-dashed rounded-md">
                                    {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="h-20 w-auto object-contain rounded bg-gray-100 p-1" />}
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código/Referência</label>
                                <input type="text" name="code" id="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                             <div>
                                <label htmlFor="productType" className="block text-sm font-medium text-gray-700">Tipo de Produto</label>
                                <select name="productType" id="productType" value={formData.productType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                   {productTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Fornecedor</label>
                                <select name="supplierId" id="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                   <option value="">Nenhum</option>
                                   {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            {formData.productType === 'passe-partout' && (
                                <div>
                                    <label htmlFor="color" className="block text-sm font-medium text-gray-700">Cor (ex: #FFFFFF ou white)</label>
                                    <input type="text" name="color" id="color" value={formData.color} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            )}
                             {formData.productType === 'moldura' && (
                                <>
                                    <div>
                                        <label htmlFor="width" className="block text-sm font-medium text-gray-700">Largura da Moldura (cm)</label>
                                        <input type="number" step="0.1" name="width" id="width" value={formData.width} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="length" className="block text-sm font-medium text-gray-700">Comprimento da Barra (m)</label>
                                        <input type="number" step="0.01" name="length" id="length" value={formData.length} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </>
                            )}
                            {['passe-partout', 'vidro', 'fundo', 'substrato'].includes(formData.productType) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="sheetWidth" className="block text-sm font-medium text-gray-700">Largura da Chapa (cm)</label>
                                        <input type="number" step="0.1" name="sheetWidth" id="sheetWidth" value={formData.sheetWidth} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="sheetHeight" className="block text-sm font-medium text-gray-700">Altura da Chapa (cm)</label>
                                        <input type="number" step="0.1" name="sheetHeight" id="sheetHeight" value={formData.sheetHeight} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                            )}
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Qtd. em Estoque</label>
                                    <input type="number" step="0.01" name="stockQuantity" id="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade</label>
                                    <select name="unit" id="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="m">Metros (m)</option>
                                        <option value="m²">Metro Quadrado (m²)</option>
                                        <option value="un">Unidade (un)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Custo</label>
                                    <input type="number" step="0.01" name="cost" id="cost" value={formData.cost} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço de Venda</label>
                                    <input type="number" step="0.01" name="price" id="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
                            Cancelar
                        </button>
                        <button type="submit" className="py-2 px-4 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;