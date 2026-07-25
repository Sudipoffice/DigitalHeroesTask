import mongoose, { Document, Schema } from 'mongoose';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';

export interface INote {
  text: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IActivity {
  action: string;
  performedBy: mongoose.Types.ObjectId;
  details: string;
  createdAt: Date;
}

export interface ILead extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  assignedTo?: mongoose.Types.ObjectId;
  notes: INote[];
  activity: IActivity[];
  source: 'public' | 'manual';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  text: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const activitySchema = new Schema<IActivity>({
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const leadSchema = new Schema<ILead>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'], default: 'new' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: [noteSchema],
  activity: [activitySchema],
  source: { type: String, enum: ['public', 'manual'], default: 'public' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<ILead>('Lead', leadSchema);