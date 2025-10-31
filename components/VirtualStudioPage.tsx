import React, { useState, useMemo } from 'react';
import { Product, LaborRate, FrameConfiguration, Quote } from '../types';
import FramingPreview from './FramingPreview';

interface VirtualStudioPageProps {
    products: Product[];
    laborRates: LaborRate[];
    onAddToQuote: (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'>) => void;
}

const VirtualStudioPage: React.FC<VirtualStudioPageProps> = ({ products, laborRates, onAddToQuote }) => {
    // Artwork states
    const [artworkImage, setArtworkImage] = useState<string | null>(null);
    const [artworkWidth, setArtworkWidth] = useState<number>(30);
    const [artworkHeight, setArtworkHeight] = useState<number>(40);

    // Component selections
    const [frame1, setFrame1] = useState<Product | null>(null);
    const [passepartout, setPassepartout] = useState<Product | null>(null);
    const [passepartoutWidth, setPassepartoutWidth] = useState<number>(0);

    const frameProducts = useMemo(() => products.filter(p => p.productType === 'moldura'), [products]);
    const passepartoutProducts = useMemo(() => products.filter(p => p.productType === 'passe-partout'), [products]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setArtworkImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const calculatedPrice = useMemo(() => {
        if (!frame1 && !passepartout) return { totalPrice: 0, totalCost: 0 };

        const frame1ProfileWidth = frame1?.width || 0;
        const sheetRequiredWidth = artworkWidth + (passepartoutWidth * 2);
        const sheetRequiredHeight = artworkHeight + (passepartoutWidth * 2);
        
        const frame1ExternalWidth = sheetRequiredWidth + (frame1ProfileWidth * 2);
        const frame1ExternalHeight = sheetRequiredHeight + (frame1ProfileWidth * 2);
        const frame1PerimeterM = (frame1ExternalWidth / 100) * 2 + (frame1ExternalHeight / 100) * 2;
        
        let price = 0;
        let cost = 0;

        if (frame1) {
            price += frame1PerimeterM * frame1.price;
            cost += frame1PerimeterM * frame1.cost;
        }

        if (passepartout) {
            const areaM2 = (sheetRequiredWidth / 100) * (sheetRequiredHeight / 100);
            price += areaM2 * passepartout.price;
            cost += areaM2 * passepartout.cost;
        }

        // Labor cost
        const perimeterCm = frame1PerimeterM * 100;
        if (perimeterCm > 0 && laborRates.length > 0) {
            const sortedRates = [...laborRates].sort((a, b) => b.minPerimeter - a.minPerimeter);
            const applicableRate = sortedRates.find(rate => perimeterCm >= rate.minPerimeter);
            if(applicableRate) {
                price += applicableRate.price;
            }
        }

        return { totalPrice: price, totalCost: cost };

    }, [artworkWidth, artworkHeight, frame1, passepartout, passepartoutWidth, laborRates]);

    const handleAddToQuote = () => {
        if (!artworkImage) {
            alert('Por favor, carregue a imagem da obra de arte.');
            return;
        }
        if (!frame1) {
            alert('Por favor, selecione uma moldura.');
            return;
        }

        const newFrame: FrameConfiguration = {
            id: new Date().toISOString(),
            name: 'Quadro do Estúdio',
            width: artworkWidth,
            height: artworkHeight,
            quantity: 1,
            imageUrl: artworkImage,
            frame1Id: frame1?.id,
            passepartoutId: passepartout?.id,
            passepartoutWidth: passepartoutWidth,
            totalPrice: calculatedPrice.totalPrice,
            totalCost: calculatedPrice.totalCost,
            // Default other fields
            glassId: undefined,
            backingId: undefined,
            glassMargin: 0,
            printingMargin: 0,
            extraProduct: { name: '', price: 0 },
            observations: 'Criado no Estúdio Virtual',
        };
        
        const newQuote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'total'> = {
            customerId: '', // Will be selected in checkout
            customerName: '',
            frames: [newFrame],
            status: 'Orçamento',
        };

        onAddToQuote(newQuote);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Left Panel: Controls */}
            <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md flex flex-col space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Controles</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obra de Arte</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Largura (cm)</label>
                        <input type="number" value={artworkWidth} onChange={e => setArtworkWidth(parseFloat(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Altura (cm)</label>
                        <input type="number" value={artworkHeight} onChange={e => setArtworkHeight(parseFloat(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                </div>
                <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Preço Estimado</h3>
                    <div className="bg-indigo-50 p-3 rounded-md text-center">
                        <p className="text-3xl font-bold text-indigo-800">R$ {calculatedPrice.totalPrice.toFixed(2)}</p>
                    </div>
                    <button onClick={handleAddToQuote} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
                        Adicionar ao Orçamento
                    </button>
                </div>
            </div>

            {/* Center Panel: Preview */}
            <div className="lg:col-span-2 bg-gray-200 p-4 rounded-lg shadow-inner flex items-center justify-center">
                 <FramingPreview
                    artworkImage={artworkImage}
                    artworkWidth={artworkWidth}
                    artworkHeight={artworkHeight}
                    frame1={frame1}
                    passepartout={passepartout}
                    passepartoutWidth={passepartoutWidth}
                />
            </div>

            {/* Right Panel: Selections */}
            <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Componentes</h2>
                 <div className="space-y-4">
                     <div>
                        <h3 className="text-md font-semibold text-gray-700">Moldura</h3>
                        <div className="h-48 overflow-y-auto border rounded-md p-2 mt-1 space-y-2">
                           {frameProducts.map(p => (
                               <div key={p.id} onClick={() => setFrame1(p)} className={`flex items-center p-2 rounded cursor-pointer ${frame1?.id === p.id ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}`}>
                                   <img src={p.imageUrl} alt={p.name} className="h-10 w-10 object-cover rounded-sm mr-2" />
                                   <span className="text-sm">{p.name}</span>
                               </div>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h3 className="text-md font-semibold text-gray-700">Paspatur</h3>
                        <div className="flex items-center space-x-2 mt-1">
                            <span>Largura (cm):</span>
                            <input type="number" value={passepartoutWidth} onChange={e => setPassepartoutWidth(parseFloat(e.target.value))} className="w-20 p-1 border rounded-md"/>
                        </div>
                        <div className="h-48 overflow-y-auto border rounded-md p-2 mt-1 space-y-2">
                           {passepartoutProducts.map(p => (
                               <div key={p.id} onClick={() => setPassepartout(p)} className={`flex items-center p-2 rounded cursor-pointer ${passepartout?.id === p.id ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}`}>
                                   <div className="h-10 w-10 rounded-sm mr-2 border" style={{backgroundColor: p.color || '#FFFFFF'}}></div>
                                   <span className="text-sm">{p.name}</span>
                               </div>
                           ))}
                        </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default VirtualStudioPage;