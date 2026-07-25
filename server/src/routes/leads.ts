import { Router, Request, Response } from 'express';
import Lead from '../models/Lead';
import User from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'] as const;

router.post('/public', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, company } = req.body;
    if (!firstName?.trim()) throw new AppError(400, 'First name is required');
    if (!lastName?.trim()) throw new AppError(400, 'Last name is required');
    if (!email?.trim()) throw new AppError(400, 'Email is required');

    const lead = await Lead.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || undefined,
      company: company?.trim() || undefined,
      source: 'public',
    });
    res.status(201).json({ message: 'Lead submitted successfully', lead });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Public lead error:', error);
      res.status(500).json({ error: 'Failed to submit lead. Please try again.' });
    }
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const { status, search, assignedTo } = req.query;

    const filter: any = {};

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) throw new AppError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      filter.status = status;
    }
    if (search?.toString().trim()) {
      const s = search.toString().trim();
      filter.$or = [
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { company: { $regex: s, $options: 'i' } },
      ];
    }
    if (assignedTo) filter.assignedTo = assignedTo;

    if (req.user!.role === 'member') {
      filter.$and = [{ $or: [{ assignedTo: req.user!._id }, { createdBy: req.user!._id }] }];
    }

    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name')
      .populate('activity.performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ leads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('List leads error:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name email')
      .populate('activity.performedBy', 'name email');
    if (!lead) throw new AppError(404, 'Lead not found');

    if (req.user!.role === 'member' && lead.assignedTo && lead.assignedTo.toString() !== req.user!._id.toString()) {
      throw new AppError(403, 'You can only view leads assigned to you');
    }

    res.json({ lead });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if ((error as any)?.name === 'CastError') {
      res.status(400).json({ error: 'Invalid lead ID format' });
    } else {
      console.error('Get lead error:', error);
      res.status(500).json({ error: 'Failed to fetch lead' });
    }
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, phone, company } = req.body;
    if (!firstName?.trim()) throw new AppError(400, 'First name is required');
    if (!lastName?.trim()) throw new AppError(400, 'Last name is required');
    if (!email?.trim()) throw new AppError(400, 'Email is required');

    const lead = await Lead.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || undefined,
      company: company?.trim() || undefined,
      source: 'manual',
      createdBy: req.user!._id,
    });
    lead.activity.push({ action: 'created', performedBy: req.user!._id, details: 'Lead created', createdAt: new Date() });
    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name email')
      .populate('activity.performedBy', 'name email');

    res.status(201).json({ lead: populated });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Create lead error:', error);
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) throw new AppError(404, 'Lead not found');
    if (req.user!.role === 'member' && lead.assignedTo && lead.assignedTo.toString() !== req.user!._id.toString()) {
      throw new AppError(403, 'You can only update leads assigned to you');
    }

    const { firstName, lastName, email, phone, company, status, assignedTo } = req.body;
    const updates: any = {};

    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone?.trim() || undefined;
    if (company !== undefined) updates.company = company?.trim() || undefined;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) throw new AppError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      if (lead.status !== status) {
        lead.activity.push({
          action: 'status_change',
          performedBy: req.user!._id,
          details: `Status changed from "${lead.status}" to "${status}"`,
          createdAt: new Date(),
        });
      }
      updates.status = status;
    }

    if (assignedTo !== undefined) {
      if (req.user!.role !== 'admin') throw new AppError(403, 'Only admins can assign leads');
      const targetUser = await User.findById(assignedTo);
      if (!targetUser) throw new AppError(404, 'User to assign not found');
      if (lead.assignedTo?.toString() !== assignedTo) {
        lead.activity.push({
          action: 'assigned',
          performedBy: req.user!._id,
          details: `Lead assigned to ${targetUser.name}`,
          createdAt: new Date(),
        });
      }
      updates.assignedTo = assignedTo;
    }

    Object.assign(lead, updates);
    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name email')
      .populate('activity.performedBy', 'name email');

    res.json({ lead: populated });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if ((error as any)?.name === 'CastError') {
      res.status(400).json({ error: 'Invalid ID format' });
    } else {
      console.error('Update lead error:', error);
      res.status(500).json({ error: 'Failed to update lead' });
    }
  }
});

router.post('/:id/notes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) throw new AppError(404, 'Lead not found');
    if (req.user!.role === 'member' && lead.assignedTo && lead.assignedTo.toString() !== req.user!._id.toString()) {
      throw new AppError(403, 'You can only add notes to leads assigned to you');
    }

    const { text } = req.body;
    if (!text?.trim()) throw new AppError(400, 'Note text is required');

    lead.notes.push({ text: text.trim(), author: req.user!._id, createdAt: new Date() });
    lead.activity.push({ action: 'note_added', performedBy: req.user!._id, details: 'Note added', createdAt: new Date() });
    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('notes.author', 'name email')
      .populate('activity.performedBy', 'name email');

    res.status(201).json({ lead: populated });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if ((error as any)?.name === 'CastError') {
      res.status(400).json({ error: 'Invalid lead ID format' });
    } else {
      console.error('Add note error:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) throw new AppError(404, 'Lead not found');
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else if ((error as any)?.name === 'CastError') {
      res.status(400).json({ error: 'Invalid lead ID format' });
    } else {
      console.error('Delete lead error:', error);
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  }
});

export default router;