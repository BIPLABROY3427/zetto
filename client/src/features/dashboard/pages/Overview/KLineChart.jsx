import { useEffect, useState } from 'react';
import { FiPieChart, FiRefreshCw } from 'react-icons/fi';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../../../services/apiClient';
import './KLineChart.css';

const KLineChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('payment'); // 'payment' | 'withdrawal'
  const [status, setStatus] = useState('all'); // 'Init', 'Success', 'Fail', etc. -> maps to 'all', 'completed', 'pending', 'failed'

  // Format today's date to YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const fetchKLineData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/kline', { params: { date, type, status } });
      setData(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch K-Line data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKLineData();
  }, [date, type, status]);

  const mapStatusToApi = (displayStatus) => {
    switch (displayStatus) {
      case 'Init': return 'all';
      case 'Success': return 'completed';
      case 'Fail': return 'failed';
      case 'Ing': return 'pending';
      case 'Close': return 'failed'; // Assuming close maps to failed or cancelled
      case 'Refund': return 'failed';
      case 'Fetch': return 'all';
      default: return 'all';
    }
  };

  const handleStatusChange = (e) => {
    setStatus(mapStatusToApi(e.target.value));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="kline-tooltip">
          <p className="kline-tooltip-time">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="kline-tooltip-row">
              <span className="kline-tooltip-dot" style={{ backgroundColor: entry.color }}></span>
              <span className="kline-tooltip-name">{entry.name}</span>
              <span className="kline-tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="kline-container">
      <div className="kline-header">
        <div className="kline-title">
          <span className="kline-icon">📈</span> K-Line Chart
        </div>

        <div className="kline-controls">
          <div className="kline-toggles">
            <button
              className={`kline-toggle-btn ${type === 'payment' ? 'active payin' : ''}`}
              onClick={() => setType('payment')}
            >
              Pay In
            </button>
            <button
              className={`kline-toggle-btn ${type === 'withdrawal' ? 'active payout' : ''}`}
              onClick={() => setType('withdrawal')}
            >
              Pay Out
            </button>
          </div>

          <div className="kline-filters">
            <select className="kline-select" onChange={handleStatusChange}>
              <option value="Init">Init</option>
              <option value="Success">Success</option>
              <option value="Fail">Fail</option>
              <option value="Ing">Ing (Pending)</option>
            </select>

            <input
              type="date"
              className="kline-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
            />
          </div>
        </div>
      </div>

      <div className="kline-subtitle">
        Amount - {type === 'payment' ? 'Pay In' : 'Pay Out'}
      </div>

      <div className="kline-chart-wrapper">
        {loading ? (
          <div className="kline-loading">
            <FiRefreshCw className="spin" /> Loading Chart Data...
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={true}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />

              <Line type="monotone" dataKey="0-200" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="200-500" stroke="#84cc16" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="500-1000" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="1000-3000" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="3000+" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Summary" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="kline-empty">
            <FiPieChart />
            <p>No transactions found for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KLineChart;
