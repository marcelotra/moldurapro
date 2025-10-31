import React from 'react';
import { Product } from '../types';

interface FramingPreviewProps {
    artworkImage: string | null;
    artworkWidth: number;
    artworkHeight: number;
    frame1: Product | null;
    passepartout: Product | null;
    passepartoutWidth: number;
}

const FramingPreview: React.FC<FramingPreviewProps> = ({
    artworkImage,
    artworkWidth,
    artworkHeight,
    frame1,
    passepartout,
    passepartoutWidth,
}) => {
    // Determine the container size to fit the preview on screen
    const containerSize = 500; //px
    const frameProfileWidth = frame1?.width || 0;
    
    // Total dimensions of the framed piece in cm
    const totalWidthCm = artworkWidth + (passepartoutWidth * 2) + (frameProfileWidth * 2);
    const totalHeightCm = artworkHeight + (passepartoutWidth * 2) + (frameProfileWidth * 2);
    
    // Calculate scaling factor to fit in the container
    const scale = Math.min(containerSize / totalWidthCm, containerSize / totalHeightCm, 1);
    
    // Apply scale to all dimensions to get pixel values
    const frameProfilePx = frameProfileWidth * scale;
    const passepartoutWidthPx = passepartoutWidth * scale;
    const artworkWidthPx = artworkWidth * scale;
    const artworkHeightPx = artworkHeight * scale;

    const passepartoutBg = passepartout?.color || '#FFFFFF';
    const frameBg = frame1?.color || '#8D6E63'; // Default wood-like color

    return (
        <div 
            className="shadow-xl"
            style={{
                width: artworkWidthPx + (passepartoutWidthPx * 2) + (frameProfilePx * 2),
                height: artworkHeightPx + (passepartoutWidthPx * 2) + (frameProfilePx * 2),
                backgroundColor: frameBg,
                padding: frameProfilePx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: frame1?.imageUrl ? `url(${frame1.imageUrl})` : 'none',
                backgroundSize: frame1?.imageUrl ? 'cover' : 'auto', // Simple simulation
            }}
        >
            <div 
                style={{
                    width: artworkWidthPx + (passepartoutWidthPx * 2),
                    height: artworkHeightPx + (passepartoutWidthPx * 2),
                    backgroundColor: passepartoutBg,
                    padding: passepartoutWidthPx,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)', // Inner shadow for depth
                }}
            >
                {artworkImage ? (
                     <img 
                        src={artworkImage} 
                        alt="Artwork"
                        style={{
                            width: artworkWidthPx,
                            height: artworkHeightPx,
                            objectFit: 'cover',
                            boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                        }}
                    />
                ) : (
                    <div 
                        style={{
                            width: artworkWidthPx,
                            height: artworkHeightPx,
                        }}
                        className="flex items-center justify-center text-center text-gray-500 bg-gray-100"
                    >
                       Carregue uma imagem para começar
                    </div>
                )}
            </div>
        </div>
    );
};

export default FramingPreview;