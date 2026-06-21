import React, { useEffect, useState } from 'react';

export default function SystemStatsHUD() {
  const [stats, setStats] = useState({ cpu: 0, ram_used_gb: 0, ram_total_gb: 0, ram_percent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/system-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch system stats:", err);
      }
    };

    // Poll every 2 seconds
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-card">
      <h3>System Status</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>CPU USAGE:</span>
          <span>{stats.cpu.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(64,196,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.cpu}%`, height: '100%', background: stats.cpu > 80 ? 'var(--color-energy)' : 'var(--color-primary)', transition: 'width 0.5s ease-out' }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>RAM USAGE:</span>
          <span>{stats.ram_percent}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(64,196,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
          <div style={{ width: `${stats.ram_percent}%`, height: '100%', background: stats.ram_percent > 80 ? 'var(--color-energy)' : 'var(--color-primary)', transition: 'width 0.5s ease-out' }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', opacity: 0.7 }}>
          {stats.ram_used_gb} GB / {stats.ram_total_gb} GB
        </div>
      </div>
    </div>
  );
}
