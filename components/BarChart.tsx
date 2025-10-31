import React from 'react';

interface BarChartProps {
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            color: string;
        }[];
    };
    showLabels?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, showLabels = true }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(0);
    const [height, setHeight] = React.useState(0);

    React.useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
                setHeight(containerRef.current.offsetHeight);
            }
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (width === 0 || height === 0) {
        return <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>;
    }

    const allData = data.datasets.flatMap(ds => ds.data);
    const yMax = allData.length > 0 ? Math.max(...allData) * 1.1 : 1;
    const yMin = 0; // Assuming no negative values for simplicity

    const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

    const numYAxisLabels = 5;
    const yAxisLabels = Array.from({ length: numYAxisLabels + 1 }, (_, i) => {
        const value = yMin + (yMax - yMin) * (i / numYAxisLabels);
        return { value, y: yScale(value) };
    });
    
    const barWidth = chartWidth / (data.labels.length || 1);
    const groupWidth = barWidth * 0.8;
    const individualBarWidth = groupWidth / data.datasets.length;


    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                <g transform={`translate(${padding.left}, ${padding.top})`}>
                    {/* Y-Axis */}
                    {yAxisLabels.map(({ value, y }) => (
                        <g key={value} className="text-gray-400">
                            <line x1={-5} y1={y} x2={chartWidth} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                            <text x={-10} y={y} dy="0.32em" textAnchor="end" className="text-xs fill-current">
                                {value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toFixed(0)}
                            </text>
                        </g>
                    ))}

                    {/* Bars */}
                    {data.labels.map((label, i) => {
                        const x = i * barWidth + (barWidth - groupWidth) / 2;
                        return (
                            <g key={label} transform={`translate(${x}, 0)`}>
                                {data.datasets.map((dataset, j) => {
                                    const barHeight = chartHeight - yScale(dataset.data[i]);
                                    return (
                                        <rect
                                            key={dataset.label}
                                            x={j * individualBarWidth}
                                            y={yScale(dataset.data[i])}
                                            width={individualBarWidth * 0.9}
                                            height={Math.max(0, barHeight)}
                                            fill={dataset.color}
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* X-Axis */}
                     {showLabels && data.labels.map((label, i) => (
                        <text
                            key={label}
                            x={i * barWidth + barWidth / 2}
                            y={chartHeight + 15}
                            textAnchor="middle"
                            className="text-xs fill-current text-gray-500"
                        >
                            {label}
                        </text>
                    ))}
                </g>
            </svg>
            <div style={{ position: 'absolute', bottom: 0, right: padding.right, display: 'flex', gap: '1rem' }}>
                 {data.datasets.map(ds => (
                    <div key={ds.label} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: ds.color, marginRight: '4px', borderRadius: '2px' }}></div>
                        <span>{ds.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;