import Ticket from '../models/Ticket.mjs';

/**
 * @desc    Create a new support ticket
 * @route   POST /api/v1/tickets
 * @access  Private
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, initialMessage } = req.body;
    
    if (!subject || !initialMessage) {
      return res.status(400).json({ status: false, message: 'Subject and initial message are required' });
    }

    const ticket = await Ticket.create({
      merchantId: req.user._id,
      subject,
      messages: [{
        senderId: req.user._id,
        text: initialMessage
      }]
    });

    res.status(201).json({ status: true, ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ status: false, message: 'Server error creating ticket' });
  }
};

/**
 * @desc    Get all tickets (Admins get all, Users get their own)
 * @route   GET /api/v1/tickets
 * @access  Private
 */
export const getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const isAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    const query = isAdmin ? {} : { merchantId: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const skipAmount = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .populate('merchantId', 'name email')
        .populate('messages.senderId', 'name role')
        .sort({ updatedAt: -1 })
        .skip(skipAmount)
        .limit(parseInt(limit)),
      Ticket.countDocuments(query)
    ]);

    res.status(200).json({ 
      status: true, 
      tickets,
      pagination: {
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ status: false, message: 'Server error fetching tickets' });
  }
};

/**
 * @desc    Get a single ticket
 * @route   GET /api/v1/tickets/:id
 * @access  Private
 */
export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('merchantId', 'name email')
      .populate('messages.senderId', 'name role');

    if (!ticket) return res.status(404).json({ status: false, message: 'Ticket not found' });

    const isAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    if (!isAdmin && ticket.merchantId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: false, message: 'Not authorized' });
    }

    res.status(200).json({ status: true, ticket });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

/**
 * @desc    Add a message to a ticket
 * @route   POST /api/v1/tickets/:id/message
 * @access  Private
 */
export const addMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ status: false, message: 'Message is required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: false, message: 'Ticket not found' });

    const isAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    if (!isAdmin && ticket.merchantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: false, message: 'Not authorized' });
    }

    ticket.messages.push({
      senderId: req.user._id,
      text
    });
    
    // Auto re-open ticket if a merchant replies to a resolved ticket
    if (!isAdmin && ticket.status === 'resolved') {
        ticket.status = 'open';
    }

    await ticket.save();

    // Re-fetch to populate sender
    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('merchantId', 'name email')
      .populate('messages.senderId', 'name role');

    res.status(200).json({ status: true, ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/v1/tickets/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ status: false, message: 'Ticket not found' });

    const isAdmin = req.user.role === 'superadmin' || req.user.role === 'admin';
    
    // If I am Admin, mark all merchant messages as read
    // If I am Merchant, mark all admin messages as read
    let modified = false;
    ticket.messages.forEach(msg => {
      if (!msg.read) {
        // Assume messages sent by someone else
        if (msg.senderId.toString() !== req.user._id.toString()) {
            msg.read = true;
            modified = true;
        }
      }
    });

    if (modified) {
        await ticket.save();
    }

    res.status(200).json({ status: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

/**
 * @desc    Update ticket status
 * @route   PUT /api/v1/tickets/:id/status
 * @access  Private (Admin Only)
 */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ status: true, ticket });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Server error' });
  }
};
