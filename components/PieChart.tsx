import React from 'react';

interface PieChartProps {
    data: {
        labels: string[];
        datasets: {
            data: number[];
        }[];
    };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const PieChart: React.FC<PieChartProps> = ({ data }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const values = data.datasets[0]?.data || [];
    const labels = data.labels || [];
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        return <div ref={containerRef} className="flex items-center justify-center h-full text-gray-500">Sem dados para exibir</div>;
    }

    let startAngle = 0;
    const slices = values.map((value, index) => {
        const angle = (value / total) * 360;
        const largeArcFlag = angle > 180 ? 1 : 0;
        const endAngle = startAngle + angle;

        const startX = Math.cos((startAngle * Math.PI) / 180);
        const startY = Math.sin((startAngle * Math.PI) / 180);
        const endX = Math.cos((endAngle * Math.PI) / 180);
        const endY = Math.sin((endAngle * Math.PI) / 180);

        const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0 Z`;
        
        startAngle = endAngle;

        return {
            path: pathData,
            color: COLORS[index % COLORS.length],
            label: labels[index],
            percentage: (value / total * 100).toFixed(1)
        };
    });

    const size = Math.min(containerSize.width, containerSize.height);
    const legendWidth = containerSize.width > 300 ? Math.min(150, containerSize.width * 0.4) : 0;
    const chartSize = size - (containerSize.height > 200 ? 40 : 0);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} className="flex items-center justify-center">
            <div style={{ width: chartSize, height: chartSize }}>
                 <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                    {slices.map((slice, index) => (
                        <path key={index} d={slice.path} fill={slice.color} />
                    ))}
                </svg>
            </div>
            {legendWidth > 0 && (
                <div className="pl-4 overflow-y-auto" style={{ maxHeight: '100%', width: legendWidth }}>
                    <ul className="text-xs space-y-2">
                        {slices.map((slice, index) => (
                            <li key={index} className="flex items-center">
                                <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: slice.color }}></span>
                                <span>{slice.label} ({slice.percentage}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PieChart;