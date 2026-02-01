import React from 'react';
import './SummaryTiles.css';

/**
 * SummaryTiles Component
 * Displays clickable summary tiles with key metrics
 */
const SummaryTiles = ({ tiles = [], onTileClick = null }) => {
    const formatValue = (value, type, currency = 'USD') => {
        if (value == null) return '-';

        switch (type) {
            case 'currency':
                const symbol = currency === 'INR' ? '₹' : '$';
                return `${symbol}${parseFloat(value).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

            case 'number':
                return parseFloat(value).toLocaleString('en-US');

            case 'percentage':
                return `${(parseFloat(value) * 100).toFixed(2)}%`;

            default:
                return value;
        }
    };

    return (
        <div className="summary-tiles-container">
            {tiles.map((tile, index) => (
                <div
                    key={tile.id || index}
                    className={`summary-tile ${tile.variant || 'default'} ${onTileClick ? 'clickable' : ''}`}
                    onClick={() => onTileClick && onTileClick(tile.id)}
                >
                    {tile.icon && (
                        <div className="tile-icon" style={{ background: tile.iconBg || '#e8f0fe' }}>
                            {tile.icon}
                        </div>
                    )}
                    <div className="tile-content">
                        <div className="tile-label">{tile.label}</div>
                        <div className="tile-value">
                            {formatValue(tile.value, tile.type, tile.currency)}
                        </div>
                        {tile.subtitle && (
                            <div className="tile-subtitle">{tile.subtitle}</div>
                        )}
                    </div>
                    {tile.trend && (
                        <div className={`tile-trend ${tile.trend > 0 ? 'positive' : 'negative'}`}>
                            <span className="trend-icon">
                                {tile.trend > 0 ? '▲' : '▼'}
                            </span>
                            <span className="trend-value">
                                {Math.abs(tile.trend)}%
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SummaryTiles;
