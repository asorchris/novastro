import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  additionalData?: Record<string, any>;
}

export interface ILeaderboardData extends Document {
  data: ILeaderboardEntry[];
  scrapedAt: Date;
  source: string;
  totalEntries: number;
  metadata?: Record<string, any>;
}

const LeaderboardEntrySchema = new Schema({
  rank: { type: Number, required: true },
  username: { type: String, required: true },
  score: { type: Number, required: true },
  additionalData: { type: Schema.Types.Mixed }
});

const LeaderboardDataSchema = new Schema({
  data: { type: [LeaderboardEntrySchema], required: true },
  scrapedAt: { type: Date, default: Date.now },
  source: { type: String, required: true },
  totalEntries: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed }
});

// Create indexes for better query performance
LeaderboardDataSchema.index({ scrapedAt: -1 });
LeaderboardDataSchema.index({ source: 1 });

export const LeaderboardData = mongoose.model<ILeaderboardData>('LeaderboardData', LeaderboardDataSchema);
