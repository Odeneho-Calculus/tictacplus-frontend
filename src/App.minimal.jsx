import React from 'react';

function MinimalApp() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1>🎮 TicTac+ Game</h1>
                <p>Advanced AAA-Style Tic Tac Toe</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    width: '200px',
                    height: '200px',
                    margin: '20px auto',
                    background: '#444'
                }}>
                    {[...Array(9)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#333'
                            }}
                            onClick={() => console.log(`Cell ${i} clicked`)}
                        >
                            {i % 3 === 0 ? 'X' : i % 3 === 1 ? 'O' : ''}
                        </div>
                    ))}
                </div>
                <p>🔌 Backend: <span style={{ color: '#90EE90' }}>Connected</span></p>
                <p>💾 Database: <span style={{ color: '#90EE90' }}>MongoDB Atlas</span></p>
                <p>⚡ Cache: <span style={{ color: '#90EE90' }}>Redis</span></p>
            </div>
        </div>
    );
}

export default MinimalApp;