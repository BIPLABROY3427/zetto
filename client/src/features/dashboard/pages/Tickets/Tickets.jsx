import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiPlus, FiMessageSquare, FiX, FiSend, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const [activeTicket, setActiveTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  useEffect(() => { fetchTickets(); return () => stopPolling(); }, []);

  useEffect(() => {
    if (activeTicket) { startPolling(activeTicket._id); scrollToBottom(); markAsRead(activeTicket._id); }
    else stopPolling();
  }, [activeTicket?._id]);

  useEffect(() => { scrollToBottom(); }, [activeTicket?.messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/tickets');
      setTickets(res.data.tickets || []);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/v1/tickets', { subject, initialMessage });
      toast.success('Ticket raised successfully!');
      setIsRaiseModalOpen(false);
      setSubject(''); setInitialMessage('');
      fetchTickets();
    } catch { toast.error('Failed to raise ticket'); }
  };

  const startPolling = (ticketId) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/v1/tickets/${ticketId}`);
        setActiveTicket(prev => {
          if (!prev) return prev;
          if (res.data.ticket.messages.length > prev.messages.length) return res.data.ticket;
          return prev;
        });
      } catch {}
    }, 5000);
  };

  const stopPolling = () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTicket) return;
    try {
      const res = await api.post(`/v1/tickets/${activeTicket._id}/message`, { text: chatMessage });
      setActiveTicket(res.data.ticket);
      setChatMessage('');
      fetchTickets();
    } catch { toast.error('Failed to send message'); }
  };

  const markAsRead = async (ticketId) => {
    try {
      await api.put(`/v1/tickets/${ticketId}/read`);
      setTickets(prev => prev.map(t => t._id === ticketId
        ? { ...t, messages: t.messages.map(m => m.senderId._id !== currentUser.id ? { ...m, read: true } : m) }
        : t
      ));
    } catch {}
  };

  const updateTicketStatus = async (status) => {
    if (!activeTicket || !isAdmin) return;
    try {
      const res = await api.put(`/v1/tickets/${activeTicket._id}/status`, { status });
      setActiveTicket(res.data.ticket);
      fetchTickets();
      toast.success(`Ticket marked as ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const getUnreadCount = (ticket) =>
    ticket.messages.filter(m => !m.read && m.senderId._id !== currentUser.id).length;

  const statusBadge = (s) => {
    if (s === 'resolved') return 'pg-status pg-status-completed';
    if (s === 'open' || s === 'in_progress') return 'pg-status pg-status-pending';
    return 'pg-status pg-status-failed';
  };

  return (
    <div className="pg-root">
      {/* Toolbar */}
      <div className="pg-toolbar">
        <div>
          <h3 className="tk-heading">Support Tickets</h3>
          <p className="tk-sub">View and manage your support requests</p>
        </div>
        <div className="pg-actions">
          <button className="pg-btn pg-btn-secondary" onClick={fetchTickets}><FiRefreshCw /></button>
          {!isAdmin && (
            <button className="pg-btn pg-btn-primary" onClick={() => setIsRaiseModalOpen(true)}>
              <FiPlus /> New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="pg-card">
        <div className="pg-card-header">
          <h4 className="pg-card-title">
            <span className="pg-card-title-icon"><FiMessageSquare /></span>
            All Tickets
          </h4>
          <span className="tk-count">{tickets.length} tickets</span>
        </div>
        <div className="pg-table-wrap">
          {loading ? (
            <div className="pg-loading"><FiRefreshCw /> Loading...</div>
          ) : (
            <table className="pg-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  {isAdmin && <th>Merchant</th>}
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5}>
                    <div className="pg-empty"><p>No tickets found</p></div>
                  </td></tr>
                ) : tickets.map(ticket => {
                  const unread = getUnreadCount(ticket);
                  return (
                    <tr key={ticket._id}>
                      <td className="tk-id">#{ticket._id.substring(18)}</td>
                      {isAdmin && <td className="tk-merchant">{ticket.merchantId?.name || 'Unknown'}</td>}
                      <td className="tk-subject">
                        <span style={{ fontWeight: unread > 0 ? 700 : 500 }}>{ticket.subject}</span>
                        {unread > 0 && <span className="tk-unread-badge">{unread} New</span>}
                      </td>
                      <td><span className={statusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</span></td>
                      <td className="tk-date">{new Date(ticket.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td>
                        <button className="pg-btn pg-btn-secondary pg-btn-sm" onClick={() => setActiveTicket(ticket)}>
                          <FiMessageSquare /> Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {isRaiseModalOpen && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setIsRaiseModalOpen(false)}>
          <div className="pg-modal pg-modal-sm">
            <div className="pg-modal-header">
              <h3 className="pg-modal-title"><FiMessageSquare style={{ marginRight: 8, color: 'var(--primary)' }} /> Raise a Ticket</h3>
              <button className="pg-modal-close" onClick={() => setIsRaiseModalOpen(false)}><FiX /></button>
            </div>
            <form onSubmit={handleRaiseTicket}>
              <div className="pg-modal-body pg-form">
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Subject</label>
                  <input type="text" required className="pg-field"
                    placeholder="e.g. Issue with recent payout"
                    value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="pg-form-row">
                  <label className="pg-label"><span className="pg-label-req">*</span> Message</label>
                  <textarea required className="pg-field pg-textarea"
                    placeholder="Describe your issue in detail..."
                    value={initialMessage} onChange={e => setInitialMessage(e.target.value)} />
                </div>
              </div>
              <div className="pg-modal-footer">
                <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setIsRaiseModalOpen(false)}>Cancel</button>
                <button type="submit" className="pg-btn pg-btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Window Modal */}
      {activeTicket && (
        <div className="pg-modal-backdrop" onClick={e => e.target === e.currentTarget && setActiveTicket(null)}>
          <div className="tk-chat-modal">
            {/* Chat Header */}
            <div className="tk-chat-header">
              <div>
                <h3 className="tk-chat-title">{activeTicket.subject}</h3>
                <span className={statusBadge(activeTicket.status)}>{activeTicket.status.replace('_', ' ')}</span>
                {isAdmin && <span className="tk-chat-meta"> · {activeTicket.merchantId?.name}</span>}
              </div>
              <div className="tk-chat-actions">
                {isAdmin && activeTicket.status !== 'resolved' && (
                  <button className="pg-btn pg-btn-success pg-btn-sm" onClick={() => updateTicketStatus('resolved')}>
                    <FiCheckCircle /> Resolve
                  </button>
                )}
                <button className="pg-modal-close" onClick={() => setActiveTicket(null)}><FiX /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="tk-messages">
              {activeTicket.messages.map(msg => {
                const isMe = msg.senderId._id === currentUser.id;
                return (
                  <div key={msg._id} className={`tk-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                    <div className={`tk-bubble ${isMe ? 'tk-bubble-me' : 'tk-bubble-them'}`}>
                      <div className="tk-bubble-sender">
                        {msg.senderId.name}{isAdmin && msg.senderId.role !== 'user' ? ' (Support)' : ''}
                      </div>
                      <div className="tk-bubble-text">{msg.text}</div>
                    </div>
                    <div className={`tk-bubble-time ${isMe ? 'time-right' : 'time-left'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="tk-chat-footer">
              <form onSubmit={handleSendMessage} className="tk-chat-form">
                <input
                  type="text" className="pg-field tk-chat-input"
                  placeholder={activeTicket.status === 'resolved' ? 'Ticket resolved. Reply to reopen...' : 'Type a message...'}
                  value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                />
                <button type="submit" className="pg-btn pg-btn-primary" disabled={!chatMessage.trim()}>
                  <FiSend />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
