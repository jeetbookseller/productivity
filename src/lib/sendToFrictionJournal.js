import { supabase } from './supabase.js';

/**
 * Copies a PH capture note into FJ's rapid_logs table.
 * @param {object} note - The PH note object { id, text, date, crAt, struck }
 * @param {'note'|'event'|'mood'} tag - Tag chosen by the user in the picker
 * @param {string} userId - The authenticated user's UUID
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendToFrictionJournal(note, tag, userId) {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const now = Date.now();

  const { error } = await supabase
    .from('rapid_logs')
    .insert({
      uuid: crypto.randomUUID(),
      tag,
      body: note.text,
      user_id: userId,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      sent_to_ph: 0,
      sent_to_ph_at: null,
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
