import React, { useState, useEffect, useRef } from 'react';
import api from '../../../../services/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { toast } from 'react-toastify';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  // Raise Ticket Modal
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // Chat Modal
  const [activeTicket, setActiveTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  useEffect(() => {
    fetchTickets();
    return () => stopPolling();
  }, []);

  // Poll for new messages when a chat is open
  useEffect(() => {
    if (activeTicket) {
      startPolling(activeTicket._id);
      scrollToBottom();
      // Mark as read when opened
      markAsRead(activeTicket._id);
    } else {
      stopPolling();
    }
  }, [activeTicket?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [activeTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/tickets');
      setTickets(res.data.tickets);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/v1/tickets', { subject, initialMessage });
      toast.success('Ticket raised successfully');
      setIsRaiseModalOpen(false);
      setSubject('');
      setInitialMessage('');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to raise ticket');
    }
  };

  const startPolling = (ticketId) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/v1/tickets/${ticketId}`);
        // Only update if there's a new message to prevent unwanted re-renders of the input
        setActiveTicket(prev => {
          if (!prev) return prev;
          if (res.data.ticket.messages.length > prev.messages.length) {
             return res.data.ticket;
          }
          return prev;
        });
      } catch (error) {
        console.error('Polling error');
      }
    }, 5000); // Check every 5 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTicket) return;

    try {
      const res = await api.post(`/v1/tickets/${activeTicket._id}/message`, { text: chatMessage });
      setActiveTicket(res.data.ticket);
      setChatMessage('');
      fetchTickets(); // Refresh list to update latest message preview/unread count
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const markAsRead = async (ticketId) => {
    try {
      await api.put(`/v1/tickets/${ticketId}/read`);
      // Update local unread status for the list view
      setTickets(prev => prev.map(t => {
        if (t._id === ticketId) {
           return {
             ...t,
             messages: t.messages.map(m => (m.senderId._id !== currentUser.id ? { ...m, read: true } : m))
           }
        }
        return t;
      }));
    } catch (error) {}
  };

  const updateTicketStatus = async (status) => {
    if (!activeTicket || !isAdmin) return;
    try {
      const res = await api.put(`/v1/tickets/${activeTicket._id}/status`, { status });
      setActiveTicket(res.data.ticket);
      fetchTickets();
      toast.success(`Ticket marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getUnreadCount = (ticket) => {
    return ticket.messages.filter(m => !m.read && m.senderId._id !== currentUser.id).length;
  };

  if (loading && tickets.length === 0) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="payment-page">
      <div className="payment-filters">
        <h3 style={{ margin: 0 }}>Support Tickets</h3>
        {!isAdmin && (
          <button className="btn-primary" onClick={() => setIsRaiseModalOpen(true)}>
            Raise Ticket
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
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
            {tickets.map(ticket => {
              const unread = getUnreadCount(ticket);
              return (
                <tr key={ticket._id} onClick={() => setActiveTicket(ticket)} style={{ cursor: 'pointer', background: unread > 0 ? '#f0f9ff' : 'transparent' }}>
                  <td style={{ fontWeight: 500, color: '#3b82f6' }}>#{ticket._id.substring(18)}</td>
                  {isAdmin && <td>{ticket.merchantId?.name || 'Unknown'}</td>}
                  <td style={{ fontWeight: unread > 0 ? 'bold' : 'normal' }}>
                    {ticket.subject}
                    {unread > 0 && <span style={{ marginLeft: '8px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '12px' }}>{unread} New</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${ticket.status === 'resolved' ? 'completed' : ticket.status === 'open' ? 'pending' : 'processing'}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{new Date(ticket.updatedAt).toLocaleString()}</td>
                  <td>
                    <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '13px' }}>View Chat</button>
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center" style={{ padding: '2rem' }}>
                  No Support Tickets Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RAISE TICKET MODAL */}
      {isRaiseModalOpen && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Raise a Ticket</h2>
            <form onSubmit={handleRaiseTicket}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  required 
                  style={inputStyle} 
                  placeholder="E.g. Issue with recent payout"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Message</label>
                <textarea 
                  value={initialMessage} 
                  onChange={e => setInitialMessage(e.target.value)} 
                  required 
                  style={{ ...inputStyle, minHeight: '100px' }} 
                  placeholder="Describe your issue..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsRaiseModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAT WINDOW MODAL */}
      {activeTicket && (
        <div className="modal-overlay" style={overlayStyle}>
          <div className="modal-content" style={{ ...modalContentStyle, width: '600px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            
            {/* Chat Header */}
            <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{activeTicket.subject}</h3>
                <small style={{ color: '#64748b' }}>
                  Status: {activeTicket.status} | {isAdmin ? `Merchant: ${activeTicket.merchantId.name}` : `Ticket #${activeTicket._id.substring(18)}`}
                </small>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isAdmin && activeTicket.status !== 'resolved' && (
                  <button onClick={() => updateTicketStatus('resolved')} style={{ ...cancelBtnStyle, background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Mark Resolved</button>
                )}
                <button onClick={() => setActiveTicket(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTicket.messages.map(msg => {
                const isMe = msg.senderId._id === currentUser.id;
                return (
                  <div key={msg._id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ 
                      background: isMe ? '#3b82f6' : '#ffffff', 
                      color: isMe ? '#ffffff' : '#0f172a', 
                      padding: '10px 14px', 
                      borderRadius: '12px',
                      borderBottomRightRadius: isMe ? '2px' : '12px',
                      borderBottomLeftRadius: !isMe ? '2px' : '12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px', fontWeight: 'bold' }}>
                        {msg.senderId.name} {isAdmin && msg.senderId.role !== 'user' ? '(Support)' : ''}
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.text}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: '16px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                  disabled={activeTicket.status === 'closed'}
                />
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }} disabled={activeTicket.status === 'closed' || !chatMessage.trim()}>
                  Send
                </button>
              </form>
              {activeTicket.status === 'resolved' && !isAdmin && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                  Replying will automatically reopen this ticket.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline styles for modals
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  justifyContent: 'center', alignItems: 'center', zIndex: 1000
};
const modalContentStyle = {
  background: '#ffffff', borderRadius: '12px', width: '100%',
  maxWidth: '400px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
};
const labelStyle = { display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500 };
const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '8px',
  border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px'
};
const cancelBtnStyle = {
  padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1',
  borderRadius: '8px', color: '#475569', cursor: 'pointer', fontWeight: 500
};

export default Tickets;
